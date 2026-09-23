const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');
const { updateTutorRanking } = require('../services/rankingEngine');

// Submit student review for completed session
router.post('/', (req, res) => {
  const { bookingId, studentId, tutorId, rating, tags = [], comment = '' } = req.body;

  if (!bookingId || !studentId || !tutorId || !rating) {
    return res.status(400).json({ error: 'Missing required review fields' });
  }

  const reviewTx = db.transaction(() => {
    // Verify booking is completed
    const booking = db.prepare('SELECT state FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) throw new Error('Booking not found');
    if (booking.state !== 'COMPLETED') throw new Error('Cannot review an incomplete session');

    // Check if review already exists
    const existing = db.prepare('SELECT id FROM reviews WHERE booking_id = ?').get(bookingId);
    if (existing) throw new Error('Review already submitted for this booking');

    const reviewId = uuidv4();
    const tagsJson = JSON.stringify(tags);

    db.prepare(`
      INSERT INTO reviews (id, booking_id, student_id, tutor_id, rating, tags, comment, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(reviewId, bookingId, studentId, tutorId, Number(rating), tagsJson, comment);

    // Recalculate average rating for tutor
    const stats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
      FROM reviews 
      WHERE tutor_id = ?
    `).get(tutorId);

    const newAvg = Number(stats.avg_rating.toFixed(2));
    db.prepare(`
      UPDATE tutor_profiles 
      SET average_rating = ? 
      WHERE id = ?
    `).run(newAvg, tutorId);

    // Update Algorithmic Ranking Score
    const newRankScore = updateTutorRanking(db, tutorId);

    return {
      reviewId,
      rating: Number(rating),
      averageRating: newAvg,
      newRankScore
    };
  });

  try {
    const result = reviewTx();
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get reviews for a tutor
router.get('/tutor/:tutorId', (req, res) => {
  const { tutorId } = req.params;
  const reviews = db.prepare(`
    SELECT r.*, u.name as student_name, u.avatar_url as student_avatar
    FROM reviews r
    JOIN users u ON r.student_id = u.id
    WHERE r.tutor_id = ?
    ORDER BY r.created_at DESC
  `).all(tutorId);

  res.json(reviews);
});

module.exports = router;
