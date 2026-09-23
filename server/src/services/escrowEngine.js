const { v4: uuidv4 } = require('uuid');
const { PLATFORM_FEE_PERCENTAGE } = require('../config');

/**
 * Calculates 12% platform split:
 * E.g. ₹500 booking -> tutor gets ₹440, platform keeps ₹60
 */
function calculateSplit(grossAmount, feePercentage = PLATFORM_FEE_PERCENTAGE) {
  const gross = Math.max(0, Math.round(Number(grossAmount) || 0));
  const platformFee = Math.round(gross * (feePercentage / 100));
  const tutorAmount = gross - platformFee;
  return {
    grossAmount: gross,
    platformFee,
    tutorAmount,
    platformPercentage: feePercentage
  };
}

/**
 * Creates an escrow hold record in the isolated ledger
 */
function createEscrowHold(db, { bookingId, studentId, tutorId, grossAmount, stripeChargeId = null }) {
  const split = calculateSplit(grossAmount);
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO escrow_payouts (
      id, booking_id, student_id, tutor_id, gross_amount, tutor_amount, 
      platform_fee, status, stripe_charge_id, hold_initiated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'HELD', ?, CURRENT_TIMESTAMP)
  `);

  stmt.run(
    id,
    bookingId,
    studentId,
    tutorId,
    split.grossAmount,
    split.tutorAmount,
    split.platformFee,
    stripeChargeId || `ch_mock_${id.slice(0, 8)}`
  );

  return {
    id,
    bookingId,
    ...split,
    status: 'HELD'
  };
}

/**
 * Atomically releases escrow funds to tutor balance upon two-party completion
 */
function releaseEscrow(db, bookingId) {
  const releaseTx = db.transaction(() => {
    const escrow = db.prepare(`
      SELECT * FROM escrow_payouts WHERE booking_id = ?
    `).get(bookingId);

    if (!escrow) {
      throw new Error(`Escrow record not found for booking: ${bookingId}`);
    }

    if (escrow.status === 'RELEASED') {
      return { alreadyReleased: true, escrow };
    }

    if (escrow.status !== 'HELD') {
      throw new Error(`Cannot release escrow with status: ${escrow.status}`);
    }

    // Mark escrow released
    const stripeTransferId = `tr_mock_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      UPDATE escrow_payouts 
      SET status = 'RELEASED', released_at = CURRENT_TIMESTAMP, stripe_transfer_id = ?
      WHERE id = ?
    `).run(stripeTransferId, escrow.id);

    // Credit tutor's user account balance
    db.prepare(`
      UPDATE users 
      SET balance = balance + ? 
      WHERE id = (SELECT user_id FROM tutor_profiles WHERE id = ?)
    `).run(escrow.tutor_amount, escrow.tutor_id);

    return {
      success: true,
      escrowId: escrow.id,
      tutorAmount: escrow.tutor_amount,
      platformFee: escrow.platform_fee,
      stripeTransferId
    };
  });

  return releaseTx();
}

/**
 * Atomically refunds escrow to student (e.g. 15-minute guarantee or early cancellation)
 */
function refundEscrow(db, bookingId, reason = '15-minute money back guarantee') {
  const refundTx = db.transaction(() => {
    const escrow = db.prepare(`
      SELECT * FROM escrow_payouts WHERE booking_id = ?
    `).get(bookingId);

    if (!escrow) {
      throw new Error(`Escrow record not found for booking: ${bookingId}`);
    }

    if (escrow.status === 'REFUNDED') {
      return { alreadyRefunded: true, escrow };
    }

    if (escrow.status !== 'HELD') {
      throw new Error(`Cannot refund escrow with status: ${escrow.status}`);
    }

    db.prepare(`
      UPDATE escrow_payouts 
      SET status = 'REFUNDED', refund_reason = ? 
      WHERE id = ?
    `).run(reason, escrow.id);

    // Credit student user balance back
    db.prepare(`
      UPDATE users 
      SET balance = balance + ? 
      WHERE id = ?
    `).run(escrow.gross_amount, escrow.student_id);

    return {
      success: true,
      refundedAmount: escrow.gross_amount,
      reason
    };
  });

  return refundTx();
}

/**
 * Get aggregated ledger stats for admin & analytics
 */
function getEscrowSummary(db) {
  const summary = db.prepare(`
    SELECT 
      COUNT(*) as total_transactions,
      SUM(CASE WHEN status = 'HELD' THEN gross_amount ELSE 0 END) as total_held_escrow,
      SUM(CASE WHEN status = 'RELEASED' THEN gross_amount ELSE 0 END) as total_volume_released,
      SUM(CASE WHEN status = 'RELEASED' THEN platform_fee ELSE 0 END) as total_platform_revenue_earned,
      SUM(CASE WHEN status = 'RELEASED' THEN tutor_amount ELSE 0 END) as total_tutor_payouts,
      SUM(CASE WHEN status = 'REFUNDED' THEN gross_amount ELSE 0 END) as total_refunded
    FROM escrow_payouts
  `).get();

  return summary;
}

module.exports = {
  calculateSplit,
  createEscrowHold,
  releaseEscrow,
  refundEscrow,
  getEscrowSummary
};
