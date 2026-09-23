const express = require('express');
const router = express.Router();
const db = require('../db/database');
const seedDatabase = require('../db/seed');
const { getEscrowSummary } = require('../services/escrowEngine');

// Get high-level marketplace metrics
router.get('/metrics', (req, res) => {
  const tutorCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'tutor' AND status != 'SUSPENDED'").get().count;
  const studentCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
  const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
  const completedBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE state = 'COMPLETED'").get().count;
  const activeReports = db.prepare("SELECT COUNT(*) as count FROM reports_flags WHERE status = 'PENDING'").get().count;
  const suspendedUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'SUSPENDED'").get().count;
  
  const escrowStats = getEscrowSummary(db);

  res.json({
    tutorCount,
    studentCount,
    totalBookings,
    completedBookings,
    activeReports,
    suspendedUsers,
    escrow: escrowStats
  });
});

// Trigger fresh cold-start reseed
router.post('/reseed', (req, res) => {
  try {
    seedDatabase();
    res.json({ success: true, message: 'Database reset and pre-seeded with 15 senior tutors across 6 core subjects.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
