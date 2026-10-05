const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, server } = require('../src/index');

let BASE_URL = 'http://localhost:5000/api';
let isRunningOwnServer = false;

describe('Peer-to-Peer Marketplace End-to-End API Integration', () => {
  let studentToken = '';
  let studentUser = null;
  let tutorId = '';
  let slotId = '';
  let bookingId = '';

  before(async () => {
    // Check if server is already listening, otherwise start in-process
    if (!server.listening) {
      await new Promise((resolve) => {
        server.listen(0, () => {
          const port = server.address().port;
          BASE_URL = `http://localhost:${port}/api`;
          isRunningOwnServer = true;
          resolve();
        });
      });
    }

    // Ensure clean state before running integration tests
    await fetch(`${BASE_URL}/admin/reseed`, { method: 'POST' });
  });

  after(async () => {
    if (isRunningOwnServer && server.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('1. GET /api/health returns operational status', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
  });

  it('2. GET /api/auth/demo-personas returns verified test profiles', async () => {
    const res = await fetch(`${BASE_URL}/auth/demo-personas`);
    assert.equal(res.status, 200);
    const personas = await res.json();
    assert.ok(personas.length >= 4);
    assert.ok(personas.some(p => p.role === 'student'));
    assert.ok(personas.some(p => p.role === 'tutor'));
    assert.ok(personas.some(p => p.role === 'admin'));
  });

  it('3. POST /api/auth/switch-persona switches to Student Alex Rivera', async () => {
    const res = await fetch(`${BASE_URL}/auth/switch-persona`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user_student_alex' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    studentToken = data.token;
    studentUser = data.user;
    assert.equal(studentUser.email, 'alex.rivera@college.edu');
    assert.equal(studentUser.role, 'student');
  });

  it('4. GET /api/tutors returns 15 pre-seeded senior tutors across 6 core courses', async () => {
    const res = await fetch(`${BASE_URL}/tutors`);
    assert.equal(res.status, 200);
    const tutors = await res.json();
    assert.equal(tutors.length, 15);

    // Verify algorithmic rank scores are computed and sorted descending
    for (let i = 0; i < tutors.length - 1; i++) {
      assert.ok(
        tutors[i].ranking_score >= tutors[i + 1].ranking_score,
        'Tutors should be sorted by algorithmic ranking score descending'
      );
    }

    // Pick tutor 1 (Priya Sharma) and an open slot for testing
    const priya = tutors[0];
    tutorId = priya.tutor_id;
    assert.ok(priya.slots.length > 0);
    slotId = priya.slots[0].id;
    assert.equal(priya.grade_earned, 'A+');
  });

  it('5. POST /api/bookings creates atomic booking and isolated escrow hold with 12% fee', async () => {
    const bookingPayload = {
      slotId,
      studentId: studentUser.id,
      tutorId,
      subjectCode: 'CS201',
      sessionMode: 'IN_APP_VIDEO',
      campusLocationNotes: 'Virtual Classroom with interactive whiteboard',
      totalAmount: 650
    };

    const res = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify(bookingPayload)
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    bookingId = data.bookingId;
    assert.equal(data.state, 'CONFIRMED');
    assert.equal(data.escrow.grossAmount, 650);
    assert.equal(data.escrow.platformFee, 78); // 12% of 650
    assert.equal(data.escrow.tutorAmount, 572); // 88% of 650
    assert.equal(data.escrow.status, 'HELD');
  });

  it('6. Double booking prevention: attempting to rebook the same slot returns 409 Conflict', async () => {
    const duplicatePayload = {
      slotId,
      studentId: studentUser.id,
      tutorId,
      subjectCode: 'CS201',
      sessionMode: 'IN_APP_VIDEO',
      totalAmount: 650
    };

    const res = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify(duplicatePayload)
    });

    assert.equal(res.status, 409);
    const data = await res.json();
    assert.match(data.error, /booked/i);
  });

  it('7. POST /api/chat/:bookingId masks phone numbers and off-platform links', async () => {
    const chatPayload = {
      senderId: studentUser.id,
      recipientId: tutorId,
      message: 'Can you whatsapp me at +91 9876543210 or join wa.me/919876543210?'
    };

    const res = await fetch(`${BASE_URL}/chat/${bookingId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify(chatPayload)
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.hadContactInfo, true);
    assert.ok(!data.message.includes('9876543210'));
    assert.ok(!data.message.includes('wa.me'));
    assert.ok(data.message.includes('[REDACTED FOR SAFETY - KEEP ON PLATFORM]'));
  });

  it('8. Two-party completion releases escrow (88% to tutor, 12% retained by platform)', async () => {
    // Transition to IN_SESSION
    await fetch(`${BASE_URL}/bookings/${bookingId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nextState: 'IN_SESSION', actorId: tutorId })
    });

    // Student confirms completion
    const confirmRes = await fetch(`${BASE_URL}/bookings/${bookingId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorRole: 'student', actorId: studentUser.id })
    });

    assert.equal(confirmRes.status, 200);
    const data = await confirmRes.json();
    assert.equal(data.toState, 'COMPLETED');

    // Verify booking state in DB
    const bookingRes = await fetch(`${BASE_URL}/bookings/${bookingId}`);
    const b = await bookingRes.json();
    assert.equal(b.state, 'COMPLETED');
    assert.equal(b.escrow_status, 'RELEASED');
    assert.equal(b.escrow_tutor_share, 572);
    assert.equal(b.escrow_platform_fee, 78);
  });

  it('9. POST /api/reviews updates tutor average rating and recalculates rank score', async () => {
    const reviewPayload = {
      bookingId,
      studentId: studentUser.id,
      tutorId,
      rating: 5,
      tags: ['Exam Prep', 'Clear Proofs'],
      comment: 'Super helpful! Explained graph BFS vs DFS proofs effortlessly.'
    };

    const res = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewPayload)
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.newRankScore > 0);
  });

  it('10. POST /api/moderation/report auto-suspends account upon 3 distinct reports', async () => {
    const testTutorUserId = 'user_tutor_15'; // Sneha Roy

    // Report 1 from Student Alex
    await fetch(`${BASE_URL}/moderation/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reporterId: 'user_student_alex',
        reportedUserId: testTutorUserId,
        category: 'Off-platform contact / WhatsApp solicitation',
        description: 'Tutor requested cash payment outside platform'
      })
    });

    // Report 2 from Tutor 1
    await fetch(`${BASE_URL}/moderation/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reporterId: 'user_tutor_1',
        reportedUserId: testTutorUserId,
        category: 'No-show / Tardy attendance',
        description: 'Did not attend scheduled session'
      })
    });

    // Report 3 from Tutor 2 (Should trigger auto-suspension!)
    const res3 = await fetch(`${BASE_URL}/moderation/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reporterId: 'user_tutor_2',
        reportedUserId: testTutorUserId,
        category: 'Academic integrity violation',
        description: 'Violated academic integrity rules'
      })
    });

    assert.equal(res3.status, 201);
    const data3 = await res3.json();
    assert.equal(data3.distinctCount, 3);
    assert.equal(data3.autoSuspended, true);

    // Verify Admin queue shows suspended user
    const queueRes = await fetch(`${BASE_URL}/moderation/queue`);
    const queue = await queueRes.json();
    assert.ok(queue.suspendedUsers.some(u => u.id === testTutorUserId));
  });

  it('11. GET /api/admin/metrics returns platform GMV and 12% revenue totals', async () => {
    const res = await fetch(`${BASE_URL}/admin/metrics`);
    assert.equal(res.status, 200);
    const metrics = await res.json();
    assert.ok(metrics.escrow.total_platform_revenue_earned > 0);
    assert.ok(metrics.escrow.total_volume_released > 0);
    assert.ok(metrics.completedBookings >= 2);
    assert.ok(metrics.suspendedUsers >= 1);
  });
});
