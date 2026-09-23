const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { calculateRankingScore } = require('../src/services/rankingEngine');
const { maskMessage } = require('../src/services/maskedChatService');

describe('Weighted Ranking Algorithm', () => {
  it('should balance rating quality (W1=0.7) and log-scaled experience volume (W2=0.3)', () => {
    // Tutor with high rating (5.0) but 0 sessions:
    // (5.0 * 0.7) + (log10(1) * 0.3) = 3.5 + 0 = 3.500
    const scoreZero = calculateRankingScore(5.0, 0);
    assert.equal(scoreZero, 3.5);

    // Tutor with high rating (5.0) and 9 sessions:
    // (5.0 * 0.7) + (log10(10) * 0.3) = 3.5 + (1.0 * 0.3) = 3.800
    const scoreTen = calculateRankingScore(5.0, 9);
    assert.equal(scoreTen, 3.8);

    // Tutor with high rating (5.0) and 99 sessions:
    // (5.0 * 0.7) + (log10(100) * 0.3) = 3.5 + (2.0 * 0.3) = 4.100
    const scoreHundred = calculateRankingScore(5.0, 99);
    assert.equal(scoreHundred, 4.1);

    // Demonstrates that a tutor with 4.9 rating and 99 sessions (3.43 + 0.6 = 4.03)
    // outperforms an unproven 5.0 tutor with 0 sessions (3.50),
    // but a 3.0 rating cannot overtake high quality even with high volume:
    // (3.0 * 0.7) + (log10(100) * 0.3) = 2.1 + 0.6 = 2.700
    const poorRatingHighVolume = calculateRankingScore(3.0, 99);
    assert.ok(scoreZero > poorRatingHighVolume, 'Quality takes priority over pure volume spam');
  });
});

describe('Masked Chat & Safety Redaction', () => {
  it('should redact 10-digit and formatted phone numbers', () => {
    const raw = 'Hey call me at 9876543210 or 987-654-3210 for syllabus notes';
    const res = maskMessage(raw);
    assert.equal(res.hadContactInfo, true);
    assert.ok(!res.redacted.includes('9876543210'));
    assert.ok(!res.redacted.includes('987-654-3210'));
    assert.ok(res.redacted.includes('[REDACTED FOR SAFETY - KEEP ON PLATFORM]'));
    assert.ok(res.warning !== null);
  });

  it('should redact email addresses', () => {
    const raw = 'Send the assignment to student123@gmail.com please';
    const res = maskMessage(raw);
    assert.equal(res.hadContactInfo, true);
    assert.ok(!res.redacted.includes('student123@gmail.com'));
  });

  it('should redact WhatsApp and Telegram off-platform invite links', () => {
    const raw = 'Join our group wa.me/919876543210 or t.me/seniornotes';
    const res = maskMessage(raw);
    assert.equal(res.hadContactInfo, true);
    assert.ok(!res.redacted.includes('wa.me'));
    assert.ok(!res.redacted.includes('t.me'));
  });

  it('should leave normal academic discussion untouched', () => {
    const raw = 'Can we review question 4 on page 82 regarding eigen-spaces?';
    const res = maskMessage(raw);
    assert.equal(res.hadContactInfo, false);
    assert.equal(res.redacted, raw);
    assert.equal(res.warning, null);
  });
});
