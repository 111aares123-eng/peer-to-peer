const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { createAtomicBooking, transitionBooking, handlePartyConfirmation } = require('../services/bookingStateMachine');
const { refundEscrow } = require('../services/escrowEngine');

// Create new atomic booking with Escrow capture
router.post('/', (req, res) => {
  const {
    slotId,
    studentId,
    tutorId,
    subjectCode,
    sessionMode = 'IN_APP_VIDEO',
    campusLocationNotes = '',
    totalAmount,
    isGroup = 0
  } = req.body;

  if (!slotId || !studentId || !tutorId || !subjectCode || !totalAmount) {
    return res.status(400).json({ error: 'Missing required booking parameters' });
  }

  try {
    const result = createAtomicBooking(db, {
      slotId,
      studentId,
      tutorId,
      subjectCode,
      sessionMode,
      campusLocationNotes,
      totalAmount: Number(totalAmount),
      isGroup: Number(isGroup)
    });

    // Notify connected sockets if server IO is available
    if (req.app.get('io')) {
      req.app.get('io').emit('booking_created', result);
    }

    res.status(201).json(result);
  } catch (err) {
    if (err.code === 'SLOT_ALREADY_BOOKED') {
      return res.status(409).json({ error: 'This time slot was just booked by another student. Please select an alternate slot.' });
    }
    return res.status(500).json({ error: err.message });
  }
});

// Get bookings for current user (student or tutor)
router.get('/', (req, res) => {
  const { userId, role } = req.query;

  let query = `
    SELECT 
      b.*,
      s.name as subject_name,
      s.department,
      u_stu.name as student_name,
      u_stu.avatar_url as student_avatar,
      u_tut.name as tutor_name,
      u_tut.avatar_url as tutor_avatar,
      tp.id as tutor_profile_id,
      sl.date as slot_date,
      sl.start_time as slot_start,
      sl.end_time as slot_end,
      e.status as escrow_status,
      e.gross_amount as escrow_gross,
      e.tutor_amount as escrow_tutor_share,
      e.platform_fee as escrow_platform_fee
    FROM bookings b
    JOIN subjects s ON b.subject_code = s.code
    JOIN users u_stu ON b.student_id = u_stu.id
    JOIN tutor_profiles tp ON b.tutor_id = tp.id
    JOIN users u_tut ON tp.user_id = u_tut.id
    JOIN availability_slots sl ON b.slot_id = sl.id
    LEFT JOIN escrow_payouts e ON b.id = e.booking_id
  `;

  const params = [];
  if (userId) {
    if (role === 'tutor') {
      query += ` WHERE tp.user_id = ? `;
    } else {
      query += ` WHERE b.student_id = ? `;
    }
    params.push(userId);
  }

  query += ` ORDER BY b.created_at DESC `;

  const bookings = db.prepare(query).all(...params);
  res.json(bookings);
});

// Get single booking by ID with audit logs
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const booking = db.prepare(`
    SELECT 
      b.*,
      s.name as subject_name,
      s.department,
      u_stu.name as student_name,
      u_stu.email as student_email,
      u_stu.avatar_url as student_avatar,
      u_tut.name as tutor_name,
      u_tut.email as tutor_email,
      u_tut.avatar_url as tutor_avatar,
      tp.id as tutor_profile_id,
      sl.date as slot_date,
      sl.start_time as slot_start,
      sl.end_time as slot_end,
      e.status as escrow_status,
      e.gross_amount as escrow_gross,
      e.tutor_amount as escrow_tutor_share,
      e.platform_fee as escrow_platform_fee,
      e.hold_initiated_at as escrow_hold_time,
      e.released_at as escrow_released_time
    FROM bookings b
    JOIN subjects s ON b.subject_code = s.code
    JOIN users u_stu ON b.student_id = u_stu.id
    JOIN tutor_profiles tp ON b.tutor_id = tp.id
    JOIN users u_tut ON tp.user_id = u_tut.id
    JOIN availability_slots sl ON b.slot_id = sl.id
    LEFT JOIN escrow_payouts e ON b.id = e.booking_id
    WHERE b.id = ?
  `).get(id);

  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  // Fetch state transition logs
  const logs = db.prepare(`
    SELECT l.*, u.name as actor_name 
    FROM booking_state_logs l
    LEFT JOIN users u ON l.actor_id = u.id
    WHERE l.booking_id = ?
    ORDER BY l.created_at ASC
  `).all(id);

  res.json({ ...booking, logs });
});

// Transition booking state
router.post('/:id/transition', (req, res) => {
  const { id } = req.params;
  const { nextState, actorId, reason } = req.body;

  try {
    const result = transitionBooking(db, {
      bookingId: id,
      nextState,
      actorId: actorId || 'system',
      reason
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('booking_state_changed', result);
    }

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Two-party session confirmation
router.post('/:id/confirm', (req, res) => {
  const { id } = req.params;
  const { actorRole, actorId } = req.body;

  try {
    const result = handlePartyConfirmation(db, {
      bookingId: id,
      actorRole,
      actorId
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('booking_party_confirmed', result);
    }

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 15-Minute Satisfaction Guarantee Refund Claim
router.post('/:id/guarantee-refund', (req, res) => {
  const { id } = req.params;
  const { studentId, reason = '15-minute satisfaction guarantee refund invoked' } = req.body;

  try {
    // Transition to CANCELLED and refund escrow
    const cancelRes = transitionBooking(db, {
      bookingId: id,
      nextState: 'CANCELLED',
      actorId: studentId,
      reason
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('booking_refunded', { bookingId: id, reason });
    }

    res.json({
      success: true,
      message: '100% Escrow refund processed back to your balance.',
      cancelRes
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
