export const MOCK_SUBJECTS = [
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

export const MOCK_PERSONAS = [
  {
    id: 'user_student_alex',
    name: 'Alex Rivera (Student)',
    email: 'alex.rivera@college.edu',
    college_domain: 'college.edu',
    role: 'student',
    balance: 3000,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    status: 'ACTIVE',
    description: 'Freshman looking for CS201 & MATH205 exam prep'
  },
  {
    id: 'tutor_u_priya',
    name: 'Priya Sharma (Senior Tutor - CS201)',
    email: 'priya.sharma@stanford.edu',
    college_domain: 'stanford.edu',
    role: 'tutor',
    balance: 5120,
    avatar_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150',
    status: 'ACTIVE',
    description: 'Senior TA with 78 completed sessions & 4.98 rating',
    tutorProfile: {
      id: 'tutor_prof_priya',
      hourly_rate: 650,
      surge_multiplier: 1.0,
      group_rate_discount: 0.30,
      ranking_score: 9.85,
      average_rating: 4.98,
      total_sessions_completed: 78
    }
  },
  {
    id: 'tutor_u_marcus',
    name: 'Marcus Vance (Senior Tutor - MATH205)',
    email: 'marcus.vance@mit.edu',
    college_domain: 'mit.edu',
    role: 'tutor',
    balance: 4200,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    status: 'ACTIVE',
    description: 'Math Olympiad Gold medalist with 64 sessions',
    tutorProfile: {
      id: 'tutor_prof_marcus',
      hourly_rate: 700,
      surge_multiplier: 1.0,
      group_rate_discount: 0.25,
      ranking_score: 9.72,
      average_rating: 4.95,
      total_sessions_completed: 64
    }
  },
  {
    id: 'user_admin_dean',
    name: 'Dean Eleanor Vance (Admin & Escrow Audit)',
    email: 'dean.admin@college.edu',
    college_domain: 'college.edu',
    role: 'admin',
    balance: 15400,
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    status: 'ACTIVE',
    description: 'Campus administrator managing escrow & safety queue'
  }
];

export const MOCK_TUTORS = [
  {
    tutor_id: 'tutor_prof_priya',
    user_id: 'tutor_u_priya',
    name: 'Priya Sharma',
    email: 'priya.sharma@stanford.edu',
    college_domain: 'stanford.edu',
    avatar_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150',
    headline: 'Senior TA for CS201 | Incoming SWE @ Google',
    bio: 'Specializing in Dynamic Programming, Graph Algorithms, and interview problem sets. Former Teaching Assistant with 80+ peer sessions.',
    gpa: 3.96,
    hourly_rate: 650,
    average_rating: 4.98,
    total_sessions_completed: 78,
    completed_sessions_count: 78,
    ranking_score: 9.85,
    rank_score: 9.85,
    surge_multiplier: 1.0,
    exam_surge_multiplier: 1.0,
    group_rate_discount: 0.30,
    effectiveRate: 650,
    subject_code: 'CS201',
    grade_earned: 'A+',
    course_grade: 'A+',
    subject_name: 'Data Structures & Algorithms',
    department: 'Computer Science',
    slots: [
      { id: 'slot_1', start_time: '2026-10-06T14:00:00Z', end_time: '2026-10-06T15:00:00Z', is_booked: 0, is_group: 0, max_students: 1 },
      { id: 'slot_2', start_time: '2026-10-07T16:00:00Z', end_time: '2026-10-07T17:00:00Z', is_booked: 0, is_group: 1, max_students: 4 }
    ],
    reviews: [
      { id: 'rev_1', rating: 5.0, comment: 'Priya broke down the 0/1 Knapsack dynamic programming state transition in 15 minutes! Totally nailed my midterm question.', tags: ['Exam Prep', 'Clear Proofs', 'Patience'], created_at: '2026-10-01T12:00:00Z' }
    ]
  },
  {
    tutor_id: 'tutor_prof_marcus',
    user_id: 'tutor_u_marcus',
    name: 'Marcus Vance',
    email: 'marcus.vance@mit.edu',
    college_domain: 'mit.edu',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    headline: 'Math Olympiad Gold | Linear Algebra Specialist',
    bio: 'I break down complex vector spaces, eigen-decompositions, and multivariable proofs into intuitive visual geometry.',
    gpa: 4.00,
    hourly_rate: 700,
    average_rating: 4.95,
    total_sessions_completed: 64,
    completed_sessions_count: 64,
    ranking_score: 9.72,
    rank_score: 9.72,
    surge_multiplier: 1.0,
    exam_surge_multiplier: 1.0,
    group_rate_discount: 0.25,
    effectiveRate: 700,
    subject_code: 'MATH205',
    grade_earned: 'A+',
    course_grade: 'A+',
    subject_name: 'Linear Algebra & Multivariable Calculus',
    department: 'Mathematics',
    slots: [
      { id: 'slot_3', start_time: '2026-10-06T17:00:00Z', end_time: '2026-10-06T18:00:00Z', is_booked: 0, is_group: 0, max_students: 1 }
    ],
    reviews: [
      { id: 'rev_2', rating: 5.0, comment: 'Visualized orthogonal projections so clearly. Saved my quiz score!', tags: ['Visual Intuition', 'Proof Review'], created_at: '2026-10-02T15:00:00Z' }
    ]
  },
  {
    tutor_id: 'tutor_prof_elena',
    user_id: 'tutor_u_elena',
    name: 'Elena Rostova',
    email: 'elena.rostova@berkeley.edu',
    college_domain: 'berkeley.edu',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    headline: 'Econ Honors Peer Tutor | Game Theory & Micro Expert',
    bio: 'Helped 40+ classmates jump from B- to solid A in ECON101 midterms. Focused on graphical problem-solving and market equilibria.',
    gpa: 3.92,
    hourly_rate: 550,
    average_rating: 4.91,
    total_sessions_completed: 52,
    completed_sessions_count: 52,
    ranking_score: 9.58,
    rank_score: 9.58,
    surge_multiplier: 1.0,
    exam_surge_multiplier: 1.0,
    group_rate_discount: 0.30,
    effectiveRate: 550,
    subject_code: 'ECON101',
    grade_earned: 'A',
    course_grade: 'A',
    subject_name: 'Principles of Microeconomics',
    department: 'Economics',
    slots: [
      { id: 'slot_4', start_time: '2026-10-08T11:00:00Z', end_time: '2026-10-08T12:00:00Z', is_booked: 0, is_group: 0, max_students: 1 }
    ],
    reviews: []
  },
  {
    tutor_id: 'tutor_prof_david',
    user_id: 'tutor_u_david',
    name: 'David Chen',
    email: 'david.chen@harvard.edu',
    college_domain: 'harvard.edu',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    headline: 'Organic Synthesis TA | 99th Percentile Chemistry',
    bio: 'Organic chemistry does not require pure memorization. I teach arrow-pushing logic and stereochemical mechanism prediction.',
    gpa: 3.98,
    hourly_rate: 600,
    average_rating: 4.94,
    total_sessions_completed: 46,
    completed_sessions_count: 46,
    ranking_score: 9.52,
    rank_score: 9.52,
    surge_multiplier: 1.0,
    exam_surge_multiplier: 1.0,
    group_rate_discount: 0.20,
    effectiveRate: 600,
    subject_code: 'CHEM102',
    grade_earned: 'A+',
    course_grade: 'A+',
    subject_name: 'Organic Chemistry & Reaction Mechanisms',
    department: 'Chemistry',
    slots: [
      { id: 'slot_5', start_time: '2026-10-07T13:00:00Z', end_time: '2026-10-07T14:00:00Z', is_booked: 0, is_group: 0, max_students: 1 }
    ],
    reviews: []
  },
  {
    tutor_id: 'tutor_prof_aisha',
    user_id: 'tutor_u_aisha',
    name: 'Aisha Patel',
    email: 'aisha.patel@stanford.edu',
    college_domain: 'stanford.edu',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    headline: 'Physics Lab Head Tutor | Mechanics & Wave Mechanics',
    bio: 'Specialized in breaking down difficult Lagrangian & Newtonian mechanics problems for engineering freshman.',
    gpa: 3.95,
    hourly_rate: 600,
    average_rating: 4.89,
    total_sessions_completed: 38,
    completed_sessions_count: 38,
    ranking_score: 9.38,
    rank_score: 9.38,
    surge_multiplier: 1.0,
    exam_surge_multiplier: 1.0,
    group_rate_discount: 0.30,
    effectiveRate: 600,
    subject_code: 'PHYS101',
    grade_earned: 'A',
    course_grade: 'A',
    subject_name: 'Classical Mechanics & Wave Dynamics',
    department: 'Physics',
    slots: [
      { id: 'slot_6', start_time: '2026-10-09T15:00:00Z', end_time: '2026-10-09T16:00:00Z', is_booked: 0, is_group: 0, max_students: 1 }
    ],
    reviews: []
  },
  {
    tutor_id: 'tutor_prof_lucas',
    user_id: 'tutor_u_lucas',
    name: 'Lucas Morel',
    email: 'lucas.morel@college.edu',
    college_domain: 'college.edu',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    headline: 'Genetics & Molecular Bio Peer Lead | Pre-Med Mentor',
    bio: 'Helping students master gene mapping, operon regulation, and recombinant DNA design for semester finals.',
    gpa: 3.91,
    hourly_rate: 550,
    average_rating: 4.88,
    total_sessions_completed: 31,
    completed_sessions_count: 31,
    ranking_score: 9.25,
    rank_score: 9.25,
    surge_multiplier: 1.0,
    exam_surge_multiplier: 1.0,
    group_rate_discount: 0.25,
    effectiveRate: 550,
    subject_code: 'BIO101',
    grade_earned: 'A',
    course_grade: 'A',
    subject_name: 'Molecular Biology & Genetics',
    department: 'Biological Sciences',
    slots: [
      { id: 'slot_7', start_time: '2026-10-08T18:00:00Z', end_time: '2026-10-08T19:00:00Z', is_booked: 0, is_group: 0, max_students: 1 }
    ],
    reviews: []
  }
];
