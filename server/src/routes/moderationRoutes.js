const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { reportUser, getModerationQueue, resolveReport } = require('../services/moderationService');

// One-tap report/flag submission
router.post('/report', (req, res) => {
  const { reporterId, reportedUserId, bookingId, category, description } = req.body;

  if (!reporterId || !reportedUserId || !category || !description) {
    return res.status(400).json({ error: 'Missing required report fields' });
  }

  try {
    const result = reportUser(db, {
      reporterId,
      reportedUserId,
      bookingId,
      category,
      description
    });

    if (result.autoSuspended && req.app.get('io')) {
      req.app.get('io').emit('user_suspended', { userId: reportedUserId });
    }

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin moderation queue
router.get('/queue', (req, res) => {
  const queue = getModerationQueue(db);
  res.json(queue);
});

// Admin resolution action
router.post('/action', (req, res) => {
  const { reportId, action, adminNotes } = req.body;

  try {
    const result = resolveReport(db, { reportId, action, adminNotes });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
