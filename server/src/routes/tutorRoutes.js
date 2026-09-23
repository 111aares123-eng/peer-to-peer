const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// Get all tutors with ranking, filters, and verified subjects
router.get('/', (req, res) => {
  const {
    subject,
    search,
    minRating = 0,
    maxPrice = 5000,
    verifiedOnly = 'false',
    sort = 'rank'
  } = req.query;

  let query = `
    SELECT 
      t.id as tutor_id,
      t.user_id,
      u.name,
      u.email,
      u.college_domain,
      u.avatar_url,
      u.status as user_status,
      t.headline,
      t.bio,
      t.gpa,
      t.transcript_verified,
      t.hourly_rate,
      t.surge_multiplier,
      t.group_rate_discount,
      t.total_sessions_completed,
      t.average_rating,
      t.ranking_score,
      ts.subject_code,
      ts.grade_earned,
      s.name as subject_name,
      s.department
    FROM tutor_profiles t
    JOIN users u ON t.user_id = u.id
    LEFT JOIN tutor_subjects ts ON t.id = ts.tutor_id
    LEFT JOIN subjects s ON ts.subject_code = s.code
    WHERE u.status != 'SUSPENDED'
      AND t.average_rating >= ?
      AND (t.hourly_rate * t.surge_multiplier) <= ?
  `;

  const params = [Number(minRating), Number(maxPrice)];

  if (verifiedOnly === 'true') {
    query += ` AND t.transcript_verified = 1 `;
  }

  if (subject && subject !== 'ALL') {
    query += ` AND ts.subject_code = ? `;
    params.push(subject);
  }

  if (search) {
    query += ` AND (
      u.name LIKE ? OR 
      t.headline LIKE ? OR 
      s.name LIKE ? OR 
      ts.subject_code LIKE ?
    ) `;
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  // Sort order
  if (sort === 'price_asc') {
    query += ` ORDER BY (t.hourly_rate * t.surge_multiplier) ASC `;
  } else if (sort === 'price_desc') {
    query += ` ORDER BY (t.hourly_rate * t.surge_multiplier) DESC `;
  } else if (sort === 'rating') {
    query += ` ORDER BY t.average_rating DESC, t.total_sessions_completed DESC `;
  } else {
    // Default: Algorithmic rank score
    query += ` ORDER BY t.ranking_score DESC `;
  }

  const tutors = db.prepare(query).all(...params);

  // Attach available upcoming slots to each tutor
  const slotStmt = db.prepare(`
    SELECT * FROM availability_slots 
    WHERE tutor_id = ? AND is_booked = 0 
    ORDER BY date ASC, start_time ASC 
    LIMIT 6
  `);

  const results = tutors.map(t => {
    const slots = slotStmt.all(t.tutor_id);
    const effectiveRate = Math.round(t.hourly_rate * t.surge_multiplier);
    return {
      ...t,
      effectiveRate,
      hasSurge: t.surge_multiplier > 1.0,
      slots
    };
  });

  res.json(results);
});

// Get individual tutor profile
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const tutor = db.prepare(`
    SELECT 
      t.*,
      u.name,
      u.email,
      u.college_domain,
      u.avatar_url,
      u.status as user_status
    FROM tutor_profiles t
    JOIN users u ON t.user_id = u.id
    WHERE t.id = ?
  `).get(id);

  if (!tutor) return res.status(404).json({ error: 'Tutor not found' });

  // Subjects & grades
  const subjects = db.prepare(`
    SELECT ts.*, s.name as subject_name, s.department, s.syllabus_summary
    FROM tutor_subjects ts
    JOIN subjects s ON ts.subject_code = s.code
    WHERE ts.tutor_id = ?
  `).all(id);

  // Available slots
  const slots = db.prepare(`
    SELECT * FROM availability_slots 
    WHERE tutor_id = ?
    ORDER BY date ASC, start_time ASC
  `).all(id);

  // Reviews
  const reviews = db.prepare(`
    SELECT r.*, u.name as student_name, u.avatar_url as student_avatar
    FROM reviews r
    JOIN users u ON r.student_id = u.id
    WHERE r.tutor_id = ?
    ORDER BY r.created_at DESC
  `).all(id);

  res.json({
    ...tutor,
    effectiveRate: Math.round(tutor.hourly_rate * tutor.surge_multiplier),
    subjects,
    slots,
    reviews
  });
});

// Update tutor settings (surge multiplier, rate, group discount)
router.put('/:id/settings', (req, res) => {
  const { id } = req.params;
  const { hourly_rate, surge_multiplier, group_rate_discount } = req.body;

  db.prepare(`
    UPDATE tutor_profiles 
    SET hourly_rate = COALESCE(?, hourly_rate),
        surge_multiplier = COALESCE(?, surge_multiplier),
        group_rate_discount = COALESCE(?, group_rate_discount)
    WHERE id = ?
  `).run(hourly_rate, surge_multiplier, group_rate_discount, id);

  const updated = db.prepare('SELECT * FROM tutor_profiles WHERE id = ?').get(id);
  res.json(updated);
});

// Add availability slot
router.post('/:id/slots', (req, res) => {
  const { id } = req.params;
  const { date, start_time, end_time, is_group = 0, max_capacity = 1 } = req.body;

  if (!date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required slot fields' });
  }

  const slotId = `slot_${uuidv4().slice(0, 8)}`;
  db.prepare(`
    INSERT INTO availability_slots (id, tutor_id, date, start_time, end_time, is_booked, is_group, max_capacity, current_bookings)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?, 0)
  `).run(slotId, id, date, start_time, end_time, is_group ? 1 : 0, Number(max_capacity) || 1);

  const created = db.prepare('SELECT * FROM availability_slots WHERE id = ?').get(slotId);
  res.status(201).json(created);
});

// Get all subjects in curriculum
router.get('/meta/subjects', (req, res) => {
  const subjects = db.prepare('SELECT * FROM subjects ORDER BY department, code').all();
  res.json(subjects);
});

module.exports = router;
