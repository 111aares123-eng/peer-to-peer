# PeerGrad — Peer-to-Peer Academic Help Marketplace

A syllabus-aligned, college-verified on-demand tutoring marketplace connecting high-achieving students with peers needing academic help, featuring automated escrow payouts (12% platform take rate), algorithmic tutor ranking, atomic booking state machine, and zero-contact masked in-app messaging.

---

## 🚀 Quick Setup Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ / v22 recommended)
- **npm**: v9.0.0 or higher

*(No external database installation required — SQLite runs embedded in ACID WAL mode with isolated escrow ledger tables).*

---

### Step-by-Step Installation

#### 1. Clone or Copy the Repository
```bash
git clone <repo-url> peer-to-peer
cd peer-to-peer
```

#### 2. Install All Dependencies
Run from the root directory:
```bash
npm run install:all
```
*(Or install separately: `cd server && npm install && cd ../client && npm install`)*

#### 3. Seed Database with 15 Pre-Seeded Senior Tutors
```bash
cd server
npm run seed
cd ..
```

#### 4. Start the Application
From the root directory, run:
```bash
npm run dev
```

This concurrently launches:
- **Backend API & WebSockets**: `http://localhost:5000`
- **Frontend Client**: `http://localhost:3000`

---

## 🌐 Using the App

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Test Personas (Top-Right Role Switcher)
- **Alex Rivera (Student)**: Browse 15 senior tutors across 6 subjects (`CS201`, `MATH205`, `ECON101`, `CHEM102`, `PHYS101`, `BIO101`), book slots, authorize Stripe-style escrow holds, and launch live virtual sessions.
- **Priya Sharma (Senior Tutor)**: Manage availability slots, adjust exam-week dynamic surge pricing (1.2x – 1.5x), and view 88% net earnings in the isolated escrow ledger.
- **Dean Eleanor Vance (Admin)**: Inspect total platform GMV, 12% revenue earned, active escrow holds, and review the 3-strike automatic suspension moderation queue.

---

## 🧪 Running Automated Tests

To run the complete 23-test suite (state machine concurrency, escrow split arithmetic, ranking formula, masked chat redaction, and end-to-end API flows):

```bash
cd server
npm test
```

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, Tailwind CSS v4, Lucide Icons, Vite
- **Backend**: Node.js, Express, Socket.io (real-time chat & collaborative whiteboard)
- **Database & Ledger**: ACID SQLite in WAL mode (`better-sqlite3`) with foreign key enforcement and isolated `escrow_payouts` ledger
- **Payments & Escrow**: Stripe Connect Escrow mock engine (12% platform take rate, 15-minute satisfaction money-back guarantee)
- **Safety**: Regex contact redaction filter (phones, emails, WhatsApp links) & 3-strike automatic account suspension
