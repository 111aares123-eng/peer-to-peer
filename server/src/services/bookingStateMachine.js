const { v4: uuidv4 } = require('uuid');
const { createEscrowHold, releaseEscrow, refundEscrow } = require('./escrowEngine');
const { updateTutorRanking } = require('./rankingEngine');

const VALID_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED', 'DISPUTED'],
  CONFIRMED: ['IN_SESSION', 'CANCELLED', 'DISPUTED'],
  IN_SESSION: ['COMPLETED', 'CANCELLED', 'DISPUTED'],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: ['COMPLETED', 'CANCELLED']
};

/**
 * Creates a booking atomically with double-booking prevention & concurrency locking
 */
function createAtomicBooking(db, {
  slotId,
  studentId,
  tutorId,
  subjectCode,
  sessionMode,
  campusLocationNotes = '',
  totalAmount,
  isGroup = 0
}) {
  const createTx = db.transaction(() => {
    // 1. Concurrency Check: Verify availability slot is free
    const slot = db.prepare(`
      SELECT * FROM availability_slots WHERE id = ?
    `).get(slotId);

    if (!slot) {
      const err = new Error('Slot does not exist');
      err.code = 'SLOT_NOT_FOUND';
      throw err;
    }

    if (slot.is_booked && (!slot.is_group || slot.current_bookings >= slot.max_capacity)) {
      const err = new Error('Slot is already booked. Concurrency lock prevented double booking.');
      err.code = 'SLOT_ALREADY_BOOKED';
      throw err;
    }

    // 2. Lock the slot
    const newCount = slot.current_bookings + 1;
    const isNowFullyBooked = !slot.is_group || newCount >= slot.max_capacity ? 1 : 0;
    
    db.prepare(`
      UPDATE availability_slots 
      SET current_bookings = ?, is_booked = ? 
      WHERE id = ?
    `).run(newCount, isNowFullyBooked, slotId);

    // 3. Create Booking with state CONFIRMED (upon payment capture)
    const bookingId = uuidv4();
    const scheduledAt = `${slot.date}T${slot.start_time}:00`;

    db.prepare(`
      INSERT INTO bookings (
        id, slot_id, student_id, tutor_id, subject_code, state, 
        session_mode, campus_location_notes, scheduled_at, total_amount, is_group,
        tutor_confirmed, student_confirmed, created_at
      ) VALUES (?, ?, ?, ?, ?, 'CONFIRMED', ?, ?, ?, ?, ?, 0, 0, CURRENT_TIMESTAMP)
    `).run(
      bookingId,
      slotId,
      studentId,
      tutorId,
      subjectCode,
      sessionMode,
      campusLocationNotes,
      scheduledAt,
      totalAmount,
      isGroup ? 1 : 0
    );

    // 4. Log state transition in immutable audit table
    db.prepare(`
      INSERT INTO booking_state_logs (id, booking_id, from_state, to_state, actor_id, reason)
      VALUES (?, ?, NULL, 'CONFIRMED', ?, 'Initial booking creation and payment escrow capture')
    `).run(uuidv4(), bookingId, studentId);

    // 5. Initialize isolated Escrow Hold
    const escrow = createEscrowHold(db, {
      bookingId,
      studentId,
      tutorId,
      grossAmount: totalAmount
    });

    return {
      bookingId,
      state: 'CONFIRMED',
      slotId,
      escrow
    };
  });

  return createTx();
}

/**
 * Transitions booking state atomically with validation and audit logging
 */
function transitionBooking(db, { bookingId, nextState, actorId, reason = '' }) {
  const transitionTx = db.transaction(() => {
    const booking = db.prepare(`
      SELECT * FROM bookings WHERE id = ?
    `).get(bookingId);

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const currentState = booking.state;

    // Validate transition
    const allowedNext = VALID_TRANSITIONS[currentState] || [];
    if (!allowedNext.includes(nextState)) {
      throw new Error(`Invalid state transition from ${currentState} to ${nextState}`);
    }

    // Determine state-specific column updates
    let startedAt = booking.started_at;
    let completedAt = booking.completed_at;

    if (nextState === 'IN_SESSION' && !startedAt) {
      startedAt = new Date().toISOString();
    } else if (nextState === 'COMPLETED' && !completedAt) {
      completedAt = new Date().toISOString();
    }

    // Update booking state
    db.prepare(`
      UPDATE bookings 
      SET state = ?, started_at = ?, completed_at = ? 
      WHERE id = ?
    `).run(nextState, startedAt, completedAt, bookingId);

    // Write audit log
    db.prepare(`
      INSERT INTO booking_state_logs (id, booking_id, from_state, to_state, actor_id, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), bookingId, currentState, nextState, actorId, reason);

    // Post-transition triggers
    if (nextState === 'COMPLETED') {
      // 1. Release escrow to tutor
      releaseEscrow(db, bookingId);

      // 2. Increment completed session count
      db.prepare(`
        UPDATE tutor_profiles 
        SET total_sessions_completed = total_sessions_completed + 1 
        WHERE id = ?
      `).run(booking.tutor_id);

      // 3. Recalculate ranking score
      updateTutorRanking(db, booking.tutor_id);
    } else if (nextState === 'CANCELLED') {
      // Refund held escrow
      refundEscrow(db, bookingId, reason || 'Booking cancelled');

      // Free up the availability slot
      db.prepare(`
        UPDATE availability_slots 
        SET is_booked = 0, current_bookings = MAX(0, current_bookings - 1) 
        WHERE id = ?
      `).run(booking.slot_id);
    }

    return {
      success: true,
      bookingId,
      fromState: currentState,
      toState: nextState
    };
  });

  return transitionTx();
}

/**
 * Handles two-party confirmation:
 * If both tutor and student have confirmed completion (or student confirms final delivery),
 * transitions to COMPLETED and triggers escrow split release.
 */
function handlePartyConfirmation(db, { bookingId, actorRole, actorId }) {
  const confirmTx = db.transaction(() => {
    const booking = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(bookingId);
    if (!booking) throw new Error('Booking not found');

    if (booking.state === 'COMPLETED') {
      return { alreadyCompleted: true, booking };
    }

    let tutorConfirmed = booking.tutor_confirmed;
    let studentConfirmed = booking.student_confirmed;

    if (actorRole === 'tutor') {
      tutorConfirmed = 1;
    } else if (actorRole === 'student') {
      studentConfirmed = 1;
    }

    db.prepare(`
      UPDATE bookings 
      SET tutor_confirmed = ?, student_confirmed = ? 
      WHERE id = ?
    `).run(tutorConfirmed, studentConfirmed, bookingId);

    // If student confirmed (or both confirmed), complete the session!
    if (studentConfirmed === 1) {
      return transitionBooking(db, {
        bookingId,
        nextState: 'COMPLETED',
        actorId,
        reason: 'Student confirmed completion; escrow released.'
      });
    }

    return {
      success: true,
      tutorConfirmed,
      studentConfirmed,
      awaitingStudent: studentConfirmed === 0
    };
  });

  return confirmTx();
}

module.exports = {
  createAtomicBooking,
  transitionBooking,
  handlePartyConfirmation,
  VALID_TRANSITIONS
};
