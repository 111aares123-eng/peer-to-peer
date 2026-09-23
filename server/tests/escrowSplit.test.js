const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const { calculateSplit, createEscrowHold, releaseEscrow, refundEscrow, getEscrowSummary } = require('../src/services/escrowEngine');

function setupTestDb() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  const schemaPath = path.join(__dirname, '../src/db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  db.prepare(`
    INSERT INTO users (id, name, email, college_domain, role, balance, status)
    VALUES ('stu_1', 'Student One', 'stu@college.edu', 'college.edu', 'student', 0, 'ACTIVE'),
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

  db.prepare(`
    INSERT INTO bookings (id, slot_id, student_id, tutor_id, subject_code, state, session_mode, scheduled_at, total_amount)
    VALUES ('book_1', 'slot_test_1', 'stu_1', 'tut_1', 'CS201', 'CONFIRMED', 'IN_APP_VIDEO', '2026-09-25T14:00:00', 500)
  `).run();

  return db;
}

describe('Escrow Split Engine', () => {
  let db;

  beforeEach(() => {
    db = setupTestDb();
  });

  it('should accurately compute 12% platform take rate splits', () => {
    // ₹500 booking: 12% = ₹60 platform, 88% = ₹440 tutor
    const split500 = calculateSplit(500);
    assert.equal(split500.grossAmount, 500);
    assert.equal(split500.platformFee, 60);
    assert.equal(split500.tutorAmount, 440);

    // ₹1000 booking: 12% = ₹120 platform, 88% = ₹880 tutor
    const split1000 = calculateSplit(1000);
    assert.equal(split1000.platformFee, 120);
    assert.equal(split1000.tutorAmount, 880);

    // ₹650 booking: 12% = ₹78 platform, 88% = ₹572 tutor
    const split650 = calculateSplit(650);
    assert.equal(split650.platformFee, 78);
    assert.equal(split650.tutorAmount, 572);
  });

  it('should create escrow hold and release funds to tutor on completion', () => {
    createEscrowHold(db, {
      bookingId: 'book_1',
      studentId: 'stu_1',
      tutorId: 'tut_1',
      grossAmount: 500
    });

    const escrow = db.prepare('SELECT * FROM escrow_payouts WHERE booking_id = ?').get('book_1');
    assert.equal(escrow.status, 'HELD');
    assert.equal(escrow.gross_amount, 500);
    assert.equal(escrow.tutor_amount, 440);
    assert.equal(escrow.platform_fee, 60);

    // Release escrow
    const releaseRes = releaseEscrow(db, 'book_1');
    assert.equal(releaseRes.success, true);
    assert.equal(releaseRes.tutorAmount, 440);

    const tutorUser = db.prepare('SELECT balance FROM users WHERE id = ?').get('tut_user_1');
    assert.equal(tutorUser.balance, 440);
  });

  it('should refund 100% of escrow to student under 15-minute satisfaction guarantee', () => {
    createEscrowHold(db, {
      bookingId: 'book_1',
      studentId: 'stu_1',
      tutorId: 'tut_1',
      grossAmount: 500
    });

    // Refund triggered within 15-min guarantee
    const refundRes = refundEscrow(db, 'book_1', 'Tutor syllabus mismatch - 15 minute guarantee claimed');
    assert.equal(refundRes.success, true);
    assert.equal(refundRes.refundedAmount, 500);

    // Check student was refunded 100% (₹500)
    const studentUser = db.prepare('SELECT balance FROM users WHERE id = ?').get('stu_1');
    assert.equal(studentUser.balance, 500);

    const escrow = db.prepare('SELECT status, refund_reason FROM escrow_payouts WHERE booking_id = ?').get('book_1');
    assert.equal(escrow.status, 'REFUNDED');
    assert.match(escrow.refund_reason, /15 minute guarantee/);
  });
});
