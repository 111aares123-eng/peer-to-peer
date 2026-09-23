-- Peer-to-Peer Academic Help Marketplace Schema
-- Enforces ACID compliance, atomic state transitions, isolated escrow ledger, and moderation tracking

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    college_domain TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'tutor', 'admin')),
    avatar_url TEXT,
    balance INTEGER NOT NULL DEFAULT 0, -- in cents / ₹ (store in smallest unit)
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutor_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    headline TEXT NOT NULL,
    bio TEXT NOT NULL,
    gpa REAL NOT NULL,
    transcript_verified INTEGER NOT NULL DEFAULT 0, -- 1 for true, 0 for false
    transcript_url TEXT,
    hourly_rate INTEGER NOT NULL, -- in ₹
    surge_multiplier REAL NOT NULL DEFAULT 1.0, -- for exam-week dynamic pricing
    group_rate_discount REAL NOT NULL DEFAULT 0.30, -- 30% discount per student for group sessions
    total_sessions_completed INTEGER NOT NULL DEFAULT 0, -- S
    average_rating REAL NOT NULL DEFAULT 5.0, -- R
    ranking_score REAL NOT NULL DEFAULT 0.0, -- calculated via algorithm
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    syllabus_summary TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tutor_subjects (
    id TEXT PRIMARY KEY,
    tutor_id TEXT NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    subject_code TEXT NOT NULL REFERENCES subjects(code) ON DELETE CASCADE,
    grade_earned TEXT NOT NULL, -- e.g. 'A+', 'A'
    verified INTEGER NOT NULL DEFAULT 1,
    UNIQUE(tutor_id, subject_code)
);

CREATE TABLE IF NOT EXISTS availability_slots (
    id TEXT PRIMARY KEY,
    tutor_id TEXT NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    date TEXT NOT NULL, -- YYYY-MM-DD
    start_time TEXT NOT NULL, -- HH:MM
    end_time TEXT NOT NULL, -- HH:MM
    is_booked INTEGER NOT NULL DEFAULT 0,
    is_group INTEGER NOT NULL DEFAULT 0,
    max_capacity INTEGER NOT NULL DEFAULT 1,
    current_bookings INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    slot_id TEXT NOT NULL REFERENCES availability_slots(id),
    student_id TEXT NOT NULL REFERENCES users(id),
    tutor_id TEXT NOT NULL REFERENCES tutor_profiles(id),
    subject_code TEXT NOT NULL REFERENCES subjects(code),
    state TEXT NOT NULL CHECK(state IN ('PENDING', 'CONFIRMED', 'IN_SESSION', 'COMPLETED', 'CANCELLED', 'DISPUTED')),
    session_mode TEXT NOT NULL CHECK(session_mode IN ('IN_APP_VIDEO', 'PUBLIC_CAMPUS_LOCATION')),
    campus_location_notes TEXT,
    scheduled_at DATETIME NOT NULL,
    started_at DATETIME,
    completed_at DATETIME,
    total_amount INTEGER NOT NULL, -- in ₹
    is_group INTEGER NOT NULL DEFAULT 0,
    tutor_confirmed INTEGER NOT NULL DEFAULT 0,
    student_confirmed INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Immutable audit log for all state transitions
CREATE TABLE IF NOT EXISTS booking_state_logs (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    from_state TEXT,
    to_state TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Isolated Escrow Payouts Ledger
CREATE TABLE IF NOT EXISTS escrow_payouts (
    id TEXT PRIMARY KEY,
    booking_id TEXT UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id),
    tutor_id TEXT NOT NULL REFERENCES tutor_profiles(id),
    gross_amount INTEGER NOT NULL, -- 100%
    tutor_amount INTEGER NOT NULL, -- 88%
    platform_fee INTEGER NOT NULL, -- 12%
    status TEXT NOT NULL CHECK(status IN ('HELD', 'RELEASED', 'REFUNDED')),
    stripe_charge_id TEXT,
    stripe_transfer_id TEXT,
    hold_initiated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    released_at DATETIME,
    refund_reason TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    booking_id TEXT UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id),
    tutor_id TEXT NOT NULL REFERENCES tutor_profiles(id),
    rating REAL NOT NULL CHECK(rating >= 1.0 AND rating <= 5.0),
    tags TEXT, -- JSON string or comma-separated
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL,
    sender_id TEXT NOT NULL REFERENCES users(id),
    recipient_id TEXT NOT NULL REFERENCES users(id),
    original_message TEXT NOT NULL,
    redacted_message TEXT NOT NULL,
    had_contact_info INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports_flags (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL REFERENCES users(id),
    reported_user_id TEXT NOT NULL REFERENCES users(id),
    booking_id TEXT,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'RESOLVED', 'DISMISSED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & rapid ranking lookup
CREATE INDEX IF NOT EXISTS idx_tutor_ranking ON tutor_profiles(ranking_score DESC);
CREATE INDEX IF NOT EXISTS idx_slots_tutor_date ON availability_slots(tutor_id, date, is_booked);
CREATE INDEX IF NOT EXISTS idx_bookings_state ON bookings(state);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports_flags(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_payouts(status);
