const db = require('./database');
const { v4: uuidv4 } = require('uuid');
const { calculateRankingScore } = require('../services/rankingEngine');

function seedDatabase() {
  console.log('--- Seeding Peer-to-Peer Academic Marketplace ---');

  const seedTx = db.transaction(() => {
    // Clear existing data cleanly in reverse foreign key order
    db.prepare(`DELETE FROM reports_flags`).run();
    db.prepare(`DELETE FROM chat_messages`).run();
    db.prepare(`DELETE FROM reviews`).run();
    db.prepare(`DELETE FROM escrow_payouts`).run();
    db.prepare(`DELETE FROM booking_state_logs`).run();
    db.prepare(`DELETE FROM bookings`).run();
    db.prepare(`DELETE FROM availability_slots`).run();
    db.prepare(`DELETE FROM tutor_subjects`).run();
    db.prepare(`DELETE FROM tutor_profiles`).run();
    db.prepare(`DELETE FROM subjects`).run();
    db.prepare(`DELETE FROM users`).run();

    // 1. Seed Core Subjects (6 categories)
    const subjects = [
      {
        code: 'CS201',
        name: 'Data Structures & Algorithms',
        department: 'Computer Science',
        syllabus_summary: 'Binary trees, graphs, dynamic programming, sorting complexity (Big-O), memory layout & recursion.'
      },
      {
        code: 'MATH205',
        name: 'Linear Algebra & Multivariable Calculus',
        department: 'Mathematics',
        syllabus_summary: 'Vector spaces, eigenvalues & eigenvectors, partial derivatives, matrix diagonalization, Stokes theorem.'
      },
      {
        code: 'ECON101',
        name: 'Principles of Microeconomics',
        department: 'Economics',
        syllabus_summary: 'Supply & demand elasticity, consumer surplus, game theory, Nash equilibria, market failure & monopoly pricing.'
      },
      {
        code: 'CHEM102',
        name: 'Organic Chemistry & Reaction Mechanisms',
        department: 'Chemistry',
        syllabus_summary: 'Stereochemistry, nucleophilic substitution (SN1/SN2), elimination (E1/E2), NMR spectroscopy, carbonyl synthesis.'
      },
      {
        code: 'PHYS101',
        name: 'Classical Mechanics & Wave Dynamics',
        department: 'Physics',
        syllabus_summary: 'Newtonian mechanics, conservation of angular momentum, harmonic oscillators, fluid dynamics & wave equations.'
      },
      {
        code: 'BIO101',
        name: 'Molecular Biology & Genetics',
        department: 'Biological Sciences',
        syllabus_summary: 'DNA replication, transcription/translation mechanisms, CRISPR gene editing, Mendelian & non-Mendelian inheritance.'
      }
    ];

    const insertSubject = db.prepare(`
      INSERT INTO subjects (code, name, department, syllabus_summary) 
      VALUES (?, ?, ?, ?)
    `);
    for (const sub of subjects) {
      insertSubject.run(sub.code, sub.name, sub.department, sub.syllabus_summary);
    }

    // 2. Seed Default Demo Users: 1 Student, 1 Admin
    const studentUser = {
      id: 'user_student_alex',
      name: 'Alex Rivera',
      email: 'alex.rivera@college.edu',
      college_domain: 'college.edu',
      role: 'student',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      balance: 3000, // ₹3,000 wallet balance for booking sessions
      status: 'ACTIVE'
    };

    const adminUser = {
      id: 'user_admin_dean',
      name: 'Dean Eleanor Vance (Admin)',
      email: 'dean.admin@college.edu',
      college_domain: 'college.edu',
      role: 'admin',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      balance: 15400, // Platform reserve
      status: 'ACTIVE'
    };

    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, college_domain, role, avatar_url, balance, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(studentUser.id, studentUser.name, studentUser.email, studentUser.college_domain, studentUser.role, studentUser.avatar_url, studentUser.balance, studentUser.status);
    insertUser.run(adminUser.id, adminUser.name, adminUser.email, adminUser.college_domain, adminUser.role, adminUser.avatar_url, adminUser.balance, adminUser.status);

    // 3. Seed 15 High-Achieving Senior Tutors across the 6 subjects
    const tutorsData = [
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@stanford.edu',
        college_domain: 'stanford.edu',
        headline: 'Senior TA for CS201 | Incoming SWE @ Google',
        bio: 'Specializing in Dynamic Programming, Graph Algorithms, and interview problem sets. Former Teaching Assistant with 80+ peer sessions.',
        gpa: 3.96,
        hourly_rate: 650,
        average_rating: 4.98,
        sessions: 78,
        subject: 'CS201',
        grade: 'A+',
        avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150'
      },
      {
        name: 'Marcus Vance',
        email: 'marcus.vance@mit.edu',
        college_domain: 'mit.edu',
        headline: 'Math Olympiad Gold | Linear Algebra Specialist',
        bio: 'I break down complex vector spaces, eigen-decompositions, and multivariable proofs into intuitive visual geometry.',
        gpa: 4.00,
        hourly_rate: 700,
        average_rating: 4.95,
        sessions: 64,
        subject: 'MATH205',
        grade: 'A+',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      },
      {
        name: 'Elena Rostova',
        email: 'elena.rostova@berkeley.edu',
        college_domain: 'berkeley.edu',
        headline: 'Econ Honors Peer Tutor | Game Theory & Micro Expert',
        bio: 'Helped 40+ classmates jump from B- to solid A in ECON101 midterms. Focused on graphical problem-solving and market equilibria.',
        gpa: 3.92,
        hourly_rate: 550,
        average_rating: 4.91,
        sessions: 52,
        subject: 'ECON101',
        grade: 'A',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
      },
      {
        name: 'Rahul Nair',
        email: 'rahul.nair@mit.edu',
        college_domain: 'mit.edu',
        headline: 'Organic Chem Teaching Fellow | Reaction Mechanism Pro',
        bio: 'No rote memorization. Master electron arrow-pushing, stereocenter tricks, and synthesis trees for CHEM102 exam mastery.',
        gpa: 3.94,
        hourly_rate: 600,
        average_rating: 4.88,
        sessions: 46,
        subject: 'CHEM102',
        grade: 'A+',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
      },
      {
        name: 'Chloe Chen',
        email: 'chloe.chen@stanford.edu',
        college_domain: 'stanford.edu',
        headline: 'Physics Senior Scholar | Mechanics & Waves Master',
        bio: 'Physics is easy when you see the free-body diagrams clearly. Former lab lead for PHYS101 with clear breakdown sheets.',
        gpa: 3.98,
        hourly_rate: 620,
        average_rating: 4.93,
        sessions: 59,
        subject: 'PHYS101',
        grade: 'A+',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'
      },
      {
        name: 'Liam O’Connor',
        email: 'liam.oconnor@college.edu',
        college_domain: 'college.edu',
        headline: 'Biochem Lab Researcher | Genetics & CRISPR Enthusiast',
        bio: 'Published undergraduate researcher. I simplify molecular biology pathways, transcription factors, and pedigree analysis.',
        gpa: 3.89,
        hourly_rate: 500,
        average_rating: 4.85,
        sessions: 38,
        subject: 'BIO101',
        grade: 'A',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'
      },
      {
        name: 'Fatima Al-Mansoor',
        email: 'fatima.m@berkeley.edu',
        college_domain: 'berkeley.edu',
        headline: 'Competitive Programmer | Trees, DP & Graph Specialist',
        bio: 'Candidate Master on Codeforces. Patient, structured mentor for students struggling with recursive thinking in CS201.',
        gpa: 3.97,
        hourly_rate: 680,
        average_rating: 4.97,
        sessions: 71,
        subject: 'CS201',
        grade: 'A+',
        avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150'
      },
      {
        name: 'Dev Patel',
        email: 'dev.patel@mit.edu',
        college_domain: 'mit.edu',
        headline: 'Applied Math Major | Calculus II & Differential Equations',
        bio: 'Calculus made painless. Step-by-step problem sets, integration by parts tricks, and series convergence tests.',
        gpa: 3.91,
        hourly_rate: 520,
        average_rating: 4.89,
        sessions: 42,
        subject: 'MATH205',
        grade: 'A',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'
      },
      {
        name: 'Aisha Khan',
        email: 'aisha.khan@college.edu',
        college_domain: 'college.edu',
        headline: 'Econ Society President | Macro & Micro Analysis',
        bio: 'Exam-focused sessions with real-world case studies and practice problem dissection. High grade-improvement record.',
        gpa: 3.93,
        hourly_rate: 580,
        average_rating: 4.92,
        sessions: 49,
        subject: 'ECON101',
        grade: 'A+',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150'
      },
      {
        name: 'Ethan Brooks',
        email: 'ethan.brooks@stanford.edu',
        college_domain: 'stanford.edu',
        headline: 'Pre-Med Peer Advisor | Organic Chem & Spectroscopy',
        bio: 'Scored 100th percentile on MCAT chemical foundations. I provide concise cheat sheets for all CHEM102 reaction pathways.',
        gpa: 3.95,
        hourly_rate: 750,
        average_rating: 4.96,
        sessions: 62,
        subject: 'CHEM102',
        grade: 'A+',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150'
      },
      {
        name: 'Sophia Zhang',
        email: 'sophia.zhang@berkeley.edu',
        college_domain: 'berkeley.edu',
        headline: 'Physics & Engineering Fellow | Mechanics Problem Solving',
        bio: 'Special focus on exam problem sets and rotational dynamics. Interactive whiteboard walkthroughs with verified formulas.',
        gpa: 3.90,
        hourly_rate: 540,
        average_rating: 4.87,
        sessions: 35,
        subject: 'PHYS101',
        grade: 'A',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'
      },
      {
        name: 'Carlos Mendez',
        email: 'carlos.m@mit.edu',
        college_domain: 'mit.edu',
        headline: 'Computational Biology TA | Genetics & Bioinformatics',
        bio: 'Translating biological concepts into clear algorithmic logic. Great for both bio majors and CS students taking bio electives.',
        gpa: 3.88,
        hourly_rate: 520,
        average_rating: 4.84,
        sessions: 31,
        subject: 'BIO101',
        grade: 'A',
        avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150'
      },
      {
        name: 'Ananya Gupta',
        email: 'ananya.g@stanford.edu',
        college_domain: 'stanford.edu',
        headline: 'Algorithms Head Tutor | 90+ Satisfied Peers',
        bio: 'Specializing in exam prep, Big-O proofs, and algorithmic thinking. Consistent 5-star ratings across 3 semesters.',
        gpa: 3.99,
        hourly_rate: 720,
        average_rating: 4.99,
        sessions: 92,
        subject: 'CS201',
        grade: 'A+',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      },
      {
        name: 'Lucas Dubois',
        email: 'lucas.dubois@college.edu',
        college_domain: 'college.edu',
        headline: 'Pure Mathematics Researcher | Multivariable Calc Specialist',
        bio: 'Clear intuition behind Green’s and Stokes’ theorem, flux integrals, and multidimensional coordinate changes.',
        gpa: 3.94,
        hourly_rate: 600,
        average_rating: 4.90,
        sessions: 44,
        subject: 'MATH205',
        grade: 'A',
        avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150'
      },
      {
        name: 'Sneha Roy',
        email: 'sneha.roy@mit.edu',
        college_domain: 'mit.edu',
        headline: 'Behavioral Econ Researcher | Micro & Quantitative Econ',
        bio: 'Proven exam revision templates, past paper walkthroughs, and step-by-step calculus utility maximization.',
        gpa: 3.92,
        hourly_rate: 560,
        average_rating: 4.88,
        sessions: 40,
        subject: 'ECON101',
        grade: 'A',
        avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150'
      }
    ];

    const insertTutorProfile = db.prepare(`
      INSERT INTO tutor_profiles (
        id, user_id, headline, bio, gpa, transcript_verified, transcript_url,
        hourly_rate, surge_multiplier, group_rate_discount, total_sessions_completed,
        average_rating, ranking_score
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, 1.0, 0.30, ?, ?, ?)
    `);

    const insertTutorSubject = db.prepare(`
      INSERT INTO tutor_subjects (id, tutor_id, subject_code, grade_earned, verified)
      VALUES (?, ?, ?, ?, 1)
    `);

    const insertSlot = db.prepare(`
      INSERT INTO availability_slots (
        id, tutor_id, date, start_time, end_time, is_booked, is_group, max_capacity, current_bookings
      ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, 0)
    `);

    // Dates for the next 5 days
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const timeSlots = [
      { start: '10:00', end: '11:00' },
      { start: '14:00', end: '15:00' },
      { start: '16:00', end: '17:00' },
      { start: '18:00', end: '19:00' }
    ];

    for (let i = 0; i < tutorsData.length; i++) {
      const t = tutorsData[i];
      const userId = `user_tutor_${i + 1}`;
      const tutorProfileId = `tutor_${i + 1}`;

      // Insert User record
      insertUser.run(
        userId,
        t.name,
        t.email,
        t.college_domain,
        'tutor',
        t.avatar,
        1250, // Existing tutor earnings
        'ACTIVE'
      );

      // Compute Ranking Score: (R * 0.7) + (log10(S + 1) * 0.3)
      const rankScore = calculateRankingScore(t.average_rating, t.sessions);

      // Insert Tutor Profile
      insertTutorProfile.run(
        tutorProfileId,
        userId,
        t.headline,
        t.bio,
        t.gpa,
        `https://transcripts.college.edu/verified/${userId}.pdf`,
        t.hourly_rate,
        t.sessions,
        t.average_rating,
        rankScore
      );

      // Link Verified Subject
      insertTutorSubject.run(
        uuidv4(),
        tutorProfileId,
        t.subject,
        t.grade
      );

      // Seed 6 availability slots per tutor over upcoming days
      for (let dayIdx = 0; dayIdx < 3; dayIdx++) {
        const slotDate = dates[dayIdx];
        const slot1 = timeSlots[dayIdx % timeSlots.length];
        const slot2 = timeSlots[(dayIdx + 2) % timeSlots.length];

        // 1-on-1 slot
        insertSlot.run(
          `slot_${tutorProfileId}_${dayIdx}_1`,
          tutorProfileId,
          slotDate,
          slot1.start,
          slot1.end,
          0, // individual
          1
        );

        // Group study slot (Exam prep format)
        insertSlot.run(
          `slot_${tutorProfileId}_${dayIdx}_2`,
          tutorProfileId,
          slotDate,
          slot2.start,
          slot2.end,
          1, // group slot
          4
        );
      }
    }

    // 4. Seed a completed sample booking with Escrow ledger record & verified review
    const sampleBookingId = 'booking_sample_completed_1';
    const sampleTutorId = 'tutor_1'; // Priya Sharma
    const sampleStudentId = studentUser.id;
    const sampleAmount = 650;
    const sampleSplit = {
      gross: sampleAmount,
      platform: Math.round(sampleAmount * 0.12), // ₹78
      tutor: sampleAmount - Math.round(sampleAmount * 0.12) // ₹572
    };

    db.prepare(`
      INSERT INTO bookings (
        id, slot_id, student_id, tutor_id, subject_code, state, 
        session_mode, campus_location_notes, scheduled_at, started_at, completed_at, 
        total_amount, tutor_confirmed, student_confirmed, created_at
      ) VALUES (
        ?, 'slot_tutor_1_0_1', ?, ?, 'CS201', 'COMPLETED',
        'IN_APP_VIDEO', 'Virtual Classroom with interactive whiteboard',
        datetime('now', '-2 days'), datetime('now', '-2 days'), datetime('now', '-2 days', '+1 hour'),
        ?, 1, 1, datetime('now', '-3 days')
      )
    `).run(sampleBookingId, sampleStudentId, sampleTutorId, sampleAmount);

    db.prepare(`
      INSERT INTO escrow_payouts (
        id, booking_id, student_id, tutor_id, gross_amount, tutor_amount, platform_fee,
        status, stripe_charge_id, stripe_transfer_id, hold_initiated_at, released_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, 'RELEASED', 'ch_sample_mock_123', 'tr_sample_mock_456',
        datetime('now', '-3 days'), datetime('now', '-2 days', '+1 hour')
      )
    `).run(
      uuidv4(),
      sampleBookingId,
      sampleStudentId,
      sampleTutorId,
      sampleSplit.gross,
      sampleSplit.tutor,
      sampleSplit.platform
    );

    db.prepare(`
      INSERT INTO reviews (id, booking_id, student_id, tutor_id, rating, tags, comment, created_at)
      VALUES (?, ?, ?, ?, 5.0, ?, ?, datetime('now', '-2 days', '+2 hours'))
    `).run(
      uuidv4(),
      sampleBookingId,
      sampleStudentId,
      sampleTutorId,
      JSON.stringify(['Exam Prep', 'Clear Proofs', 'Patience']),
      'Priya broke down the 0/1 Knapsack dynamic programming state transition in 15 minutes! Totally nailed my midterm question.'
    );

    console.log('--- Successfully seeded 15 senior tutors across 6 core subjects! ---');
  });

  seedTx();
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
