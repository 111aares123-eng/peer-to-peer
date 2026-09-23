require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'peer-to-peer-super-secret-key-2026',
  PLATFORM_FEE_PERCENTAGE: 12, // 12% platform take rate
  RANKING_WEIGHTS: {
    W1: 0.70, // 70% weight for average rating (1.0 - 5.0)
    W2: 0.30  // 30% weight for log-scaled completed session volume
  },
  AUTO_SUSPEND_THRESHOLD: 3, // 3 distinct reports auto-suspend account
  MONEY_BACK_GUARANTEE_MINUTES: 15, // 15-minute satisfaction guarantee
  ALLOWED_DOMAINS: ['college.edu', 'stanford.edu', 'mit.edu', 'berkeley.edu', 'harvard.edu', 'campus.edu']
};
