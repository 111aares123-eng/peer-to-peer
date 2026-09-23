const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { isValidCollegeEmail, generateToken, authMiddleware } = require('../services/authService');
const { v4: uuidv4 } = require('uuid');

// Mock SSO login / registration
router.post('/sso', (req, res) => {
  const { email, name, role = 'student', collegeName = 'Stanford University' } = req.body;

  if (!email || !isValidCollegeEmail(email)) {
    return res.status(400).json({
      error: 'Invalid college email. Registration requires an active @*.edu institutional address for verification.'
    });
  }

  const domain = email.split('@')[1];

  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    const id = `user_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO users (id, name, email, college_domain, role, avatar_url, balance, status)
      VALUES (?, ?, ?, ?, ?, ?, 2000, 'ACTIVE')
    `).run(
      id,
      name || email.split('@')[0],
      email,
      domain,
      role,
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || email)}`
    );

    user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

    // If registering as tutor, initialize tutor profile
    if (role === 'tutor') {
      const tutorId = `tutor_${uuidv4().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO tutor_profiles (id, user_id, headline, bio, gpa, transcript_verified, hourly_rate, ranking_score)
        VALUES (?, ?, 'Peer Tutor in Training', 'Verified academic peer ready to assist.', 3.9, 1, 500, 3.5)
      `).run(tutorId, user.id);
    }
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      collegeDomain: user.college_domain,
      role: user.role,
      avatarUrl: user.avatar_url,
      balance: user.balance,
      status: user.status
    }
  });
});

// Get current authenticated user
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let tutorProfile = null;
  if (user.role === 'tutor') {
    tutorProfile = db.prepare('SELECT * FROM tutor_profiles WHERE user_id = ?').get(user.id);
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      collegeDomain: user.college_domain,
      role: user.role,
      avatarUrl: user.avatar_url,
      balance: user.balance,
      status: user.status,
      tutorProfile
    }
  });
});

// Demo persona switcher
router.get('/demo-personas', (req, res) => {
  const personas = [
    {
      id: 'user_student_alex',
      name: 'Alex Rivera (Student)',
      role: 'student',
      email: 'alex.rivera@college.edu',
      description: 'Sophomore needing help in CS201 & MATH205',
      balance: 3000
    },
    {
      id: 'user_tutor_1',
      tutorId: 'tutor_1',
      name: 'Priya Sharma (Senior CS Tutor)',
      role: 'tutor',
      email: 'priya.sharma@stanford.edu',
      description: 'Rank #1 CS201 Tutor (A+, 78 sessions, Score: 4.05)',
      balance: 1250
    },
    {
      id: 'user_tutor_2',
      tutorId: 'tutor_2',
      name: 'Marcus Vance (Math TA)',
      role: 'tutor',
      email: 'marcus.vance@mit.edu',
      description: 'Linear Algebra Specialist (A+, 64 sessions)',
      balance: 980
    },
    {
      id: 'user_admin_dean',
      name: 'Dean Eleanor Vance (Admin)',
      role: 'admin',
      email: 'dean.admin@college.edu',
      description: 'Campus Marketplace Safety & Escrow Auditor',
      balance: 15400
    }
  ];

  res.json(personas);
});

// Quick switch to a demo persona
router.post('/switch-persona', (req, res) => {
  const { userId } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Persona not found' });

  let tutorProfile = null;
  if (user.role === 'tutor') {
    tutorProfile = db.prepare('SELECT * FROM tutor_profiles WHERE user_id = ?').get(user.id);
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      collegeDomain: user.college_domain,
      role: user.role,
      avatarUrl: user.avatar_url,
      balance: user.balance,
      status: user.status,
      tutorProfile
    }
  });
});

module.exports = router;
