const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { saveChatMessage, getBookingMessages } = require('../services/maskedChatService');

// Get masked message history for booking
router.get('/:bookingId', (req, res) => {
  const { bookingId } = req.params;
  const messages = getBookingMessages(db, bookingId);
  res.json(messages);
});

// Send new message with zero-contact masking filter
router.post('/:bookingId', (req, res) => {
  const { bookingId } = req.params;
  const { senderId, recipientId, message } = req.body;

  if (!senderId || !recipientId || !message) {
    return res.status(400).json({ error: 'Missing required chat parameters' });
  }

  let finalRecipientId = recipientId;
  const tutor = db.prepare('SELECT user_id FROM tutor_profiles WHERE id = ?').get(recipientId);
  if (tutor) {
    finalRecipientId = tutor.user_id;
  }

  const saved = saveChatMessage(db, {
    bookingId,
    senderId,
    recipientId: finalRecipientId,
    message
  });

  // Real-time broadcast
  if (req.app.get('io')) {
    req.app.get('io').to(`booking_${bookingId}`).emit('new_message', saved);
  }

  res.status(201).json(saved);
});

module.exports = router;
