const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { getEscrowSummary, calculateSplit } = require('../services/escrowEngine');

// Get escrow ledger records
router.get('/ledger', (req, res) => {
  const { tutorId, studentId, status } = req.query;

  let query = `
    SELECT 
      e.*,
      b.subject_code,
      b.scheduled_at,
      u_stu.name as student_name,
      u_stu.email as student_email,
      u_tut.name as tutor_name,
      u_tut.email as tutor_email
    FROM escrow_payouts e
    JOIN bookings b ON e.booking_id = b.id
    JOIN users u_stu ON e.student_id = u_stu.id
    JOIN tutor_profiles tp ON e.tutor_id = tp.id
    JOIN users u_tut ON tp.user_id = u_tut.id
  `;

  const conditions = [];
  const params = [];

  if (tutorId) {
    conditions.push('e.tutor_id = ?');
    params.push(tutorId);
  }
  if (studentId) {
    conditions.push('e.student_id = ?');
    params.push(studentId);
  }
  if (status) {
    conditions.push('e.status = ?');
    params.push(status);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY e.hold_initiated_at DESC ';

  const ledger = db.prepare(query).all(...params);
  res.json(ledger);
});

// Get aggregated platform escrow summary
router.get('/summary', (req, res) => {
  const summary = getEscrowSummary(db);
  res.json(summary);
});

// Calculate breakdown helper
router.get('/preview-split', (req, res) => {
  const amount = Number(req.query.amount) || 0;
  const split = calculateSplit(amount);
  res.json(split);
});

module.exports = router;
