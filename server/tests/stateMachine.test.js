const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const { createAtomicBooking, transitionBooking, handlePartyConfirmation } = require('../src/services/bookingStateMachine');
const { calculateRankingScore } = require('../src/services/rankingEngine');

function setupTestDb() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  const schemaPath = path.join(__dirname, '../src/db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  // Setup mock user, tutor, and slot
  db.prepare(`
    INSERT INTO users (id, name, email, college_domain, role, balance, status)
    VALUES ('stu_1', 'Student One', 'stu@college.edu', 'college.edu', 'student', 2000, 'ACTIVE'),
           ('tut_user_1', 'Tutor One', 'tut@college.edu', 'college.edu', 'tutor', 0, 'ACTIVE')
  `).run();

  db.prepare(`
    INSERT INTO tutor_profiles (id, user_id, headline, bio, gpa, transcript_verified, hourly_rate, ranking_score)
    VALUES ('tut_1', 'tut_user_1', 'Headline', 'Bio', 3.9, 1, 500, 3.5)
  `).run();

  db.prepare(`
    INSERT INTO subjects (code, name, department, syllabus_summary)
    VALUES ('CS201', 'DSA', 'CS', 'Algorithms')
  `).run();

  db.prepare(`
    INSERT INTO availability_slots (id, tutor_id, date, start_time, end_time, is_booked, is_group, max_capacity, current_bookings)
    VALUES ('slot_test_1', 'tut_1', '2026-09-25', '14:00', '15:00', 0, 0, 1, 0)
  `).run();

  return db;
}

describe('Booking State Machine & Concurrency', () => {
  let db;

  beforeEach(() => {
    db = setupTestDb();
  });

  it('should create booking atomically and lock the slot', () => {
    const result = createAtomicBooking(db, {
      slotId: 'slot_test_1',
      studentId: 'stu_1',
      tutorId: 'tut_1',
      subjectCode: 'CS201',
      sessionMode: 'IN_APP_VIDEO',
      totalAmount: 500
    });

    assert.equal(result.state, 'CONFIRMED');
    assert.equal(result.escrow.status, 'HELD');
    assert.equal(result.escrow.grossAmount, 500);
    assert.equal(result.escrow.platformFee, 60); // 12% of 500
    assert.equal(result.escrow.tutorAmount, 440); // 88% of 500

    // Verify slot is now locked
    const slot = db.prepare('SELECT is_booked, current_bookings FROM availability_slots WHERE id = ?').get('slot_test_1');
    assert.equal(slot.is_booked, 1);
    assert.equal(slot.current_bookings, 1);

    // Verify state log was recorded
    const log = db.prepare('SELECT * FROM booking_state_logs WHERE booking_id = ?').get(result.bookingId);
    assert.equal(log.to_state, 'CONFIRMED');
  });

  it('should prevent race conditions and reject double-booking', () => {
    // First booking succeeds
    createAtomicBooking(db, {
      slotId: 'slot_test_1',
      studentId: 'stu_1',
      tutorId: 'tut_1',
      subjectCode: 'CS201',
      sessionMode: 'IN_APP_VIDEO',
      totalAmount: 500
    });

    // Second booking attempt on same slot MUST fail
    assert.throws(() => {
      createAtomicBooking(db, {
        slotId: 'slot_test_1',
        studentId: 'stu_1',
        tutorId: 'tut_1',
        subjectCode: 'CS201',
        sessionMode: 'IN_APP_VIDEO',
        totalAmount: 500
      });
    }, (err) => {
      return err.code === 'SLOT_ALREADY_BOOKED';
    });
  });

  it('should complete session and release escrow to tutor', () => {
    const booking = createAtomicBooking(db, {
      slotId: 'slot_test_1',
      studentId: 'stu_1',
      tutorId: 'tut_1',
      subjectCode: 'CS201',
      sessionMode: 'IN_APP_VIDEO',
      totalAmount: 500
    });

    // Transition CONFIRMED -> IN_SESSION
    transitionBooking(db, {
      bookingId: booking.bookingId,
      nextState: 'IN_SESSION',
      actorId: 'tut_1',
      reason: 'Session started'
    });

    const inSession = db.prepare('SELECT state FROM bookings WHERE id = ?').get(booking.bookingId);
    assert.equal(inSession.state, 'IN_SESSION');

    // Transition IN_SESSION -> COMPLETED
    transitionBooking(db, {
      bookingId: booking.bookingId,
      nextState: 'COMPLETED',
      actorId: 'stu_1',
      reason: 'Two-party completion confirmed'
    });

    const completed = db.prepare('SELECT state FROM bookings WHERE id = ?').get(booking.bookingId);
    assert.equal(completed.state, 'COMPLETED');

    // Escrow must be RELEASED
    const escrow = db.prepare('SELECT status, tutor_amount FROM escrow_payouts WHERE booking_id = ?').get(booking.bookingId);
    assert.equal(escrow.status, 'RELEASED');

    // Tutor user balance should now have ₹440
    const tutorUser = db.prepare('SELECT balance FROM users WHERE id = ?').get('tut_user_1');
    assert.equal(tutorUser.balance, 440);
  });

  it('should reject invalid state transitions', () => {
    const booking = createAtomicBooking(db, {
      slotId: 'slot_test_1',
      studentId: 'stu_1',
      tutorId: 'tut_1',
      subjectCode: 'CS201',
      sessionMode: 'IN_APP_VIDEO',
      totalAmount: 500
    });

    // CONFIRMED cannot transition directly to COMPLETED without IN_SESSION
    assert.throws(() => {
      transitionBooking(db, {
        bookingId: booking.bookingId,
        nextState: 'COMPLETED',
        actorId: 'stu_1'
      });
    }, /Invalid state transition/);
  });
});
