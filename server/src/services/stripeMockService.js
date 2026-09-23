const { v4: uuidv4 } = require('uuid');

/**
 * Stripe Connect SDK Mock Engine
 * Emulates PaymentIntents, Escrow hold authorizations, and Connect Split Transfers.
 */
class StripeConnectService {
  constructor() {
    this.paymentIntents = new Map();
    this.transfers = new Map();
    this.refunds = new Map();
  }

  /**
   * Creates and authorizes a payment intent (Escrow hold)
   */
  async createEscrowIntent({ amount, currency = 'inr', studentEmail, tutorId, metadata = {} }) {
    const intentId = `pi_${uuidv4().replace(/-/g, '').slice(0, 24)}`;
    const intent = {
      id: intentId,
      amount,
      currency,
      status: 'requires_capture', // Escrow hold active
      capture_method: 'manual',
      student_email: studentEmail,
      metadata: {
        tutor_id: tutorId,
        escrow_protection: 'ENABLED',
        satisfaction_guarantee_mins: 15,
        ...metadata
      },
      client_secret: `${intentId}_secret_${uuidv4().slice(0, 16)}`,
      created: Math.floor(Date.now() / 1000)
    };

    this.paymentIntents.set(intentId, intent);
    return intent;
  }

  /**
   * Releases split payout to connected tutor account (after 12% take-rate)
   */
  async releaseTransfer({ paymentIntentId, tutorAccountId, tutorAmount, platformFee }) {
    const transferId = `tr_${uuidv4().replace(/-/g, '').slice(0, 24)}`;
    const transfer = {
      id: transferId,
      amount: tutorAmount,
      currency: 'inr',
      destination: tutorAccountId || `acct_tutor_${uuidv4().slice(0, 8)}`,
      source_transaction: paymentIntentId,
      platform_fee_retained: platformFee,
      status: 'paid',
      created: Math.floor(Date.now() / 1000)
    };

    this.transfers.set(transferId, transfer);
    return transfer;
  }

  /**
   * Refunds customer in full if cancelled within 15-minute guarantee
   */
  async refundPayment({ paymentIntentId, reason = 'requested_by_customer' }) {
    const refundId = `re_${uuidv4().replace(/-/g, '').slice(0, 24)}`;
    const refund = {
      id: refundId,
      payment_intent: paymentIntentId,
      status: 'succeeded',
      reason,
      created: Math.floor(Date.now() / 1000)
    };

    this.refunds.set(refundId, refund);
    return refund;
  }
}

module.exports = new StripeConnectService();
