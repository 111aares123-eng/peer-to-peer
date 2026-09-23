import React, { useState } from 'react';
import { X, CreditCard, Lock, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';

export default function EscrowPaymentModal({
  bookingDetails,
  isOpen,
  onClose,
  onPaymentSuccess
}) {
  if (!isOpen || !bookingDetails) return null;

  const { tutor, slot, sessionMode, campusLocationNotes, totalAmount, isGroup } = bookingDetails;
  
  // Calculate 12% platform split
  const platformFee = Math.round(totalAmount * 0.12);
  const tutorPayout = totalAmount - platformFee;

  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('982');
  const [error, setError] = useState(null);

  const handleAuthorize = async () => {
    setLoading(true);
    setError(null);
    try {
      await onPaymentSuccess({
        slotId: slot.id,
        tutorId: tutor.tutor_id,
        subjectCode: tutor.subject_code,
        sessionMode,
        campusLocationNotes,
        totalAmount,
        isGroup
      });
    } catch (err) {
      setError(err.message || 'Payment authorization failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 bg-gray-900 border border-indigo-500/30 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Authorize Escrow Payment</h2>
              <p className="text-[11px] text-gray-400">Powered by Stripe Connect Escrow Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="py-4 space-y-4 text-xs">
          {/* Booking Summary Card */}
          <div className="p-3.5 rounded-2xl bg-gray-800/80 border border-gray-700/80 space-y-2">
            <div className="flex items-center justify-between text-gray-300">
              <span className="font-semibold text-white">{tutor.name}</span>
              <span className="text-indigo-300">{tutor.subject_code}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span>{formatDate(slot.date)} • {formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
              <span>{sessionMode === 'IN_APP_VIDEO' ? 'Virtual Video' : 'Logged Campus'}</span>
            </div>
          </div>

          {/* 12% Escrow Split Breakdown */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-gray-900 border border-indigo-500/25 space-y-2.5">
            <div className="flex items-center justify-between font-semibold text-white text-sm pb-2 border-b border-gray-800">
              <span>Total Booking Amount:</span>
              <span className="text-emerald-400 text-base font-bold">{formatCurrency(totalAmount)}</span>
            </div>

            <div className="flex items-center justify-between text-gray-300 text-xs">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Held in Escrow for Tutor (88%):
              </span>
              <span className="font-medium text-white">{formatCurrency(tutorPayout)}</span>
            </div>

            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>Platform Verification & Insurance (12%):</span>
              <span>{formatCurrency(platformFee)}</span>
            </div>

            <div className="pt-2 text-[10px] text-indigo-300/80 border-t border-indigo-500/20 leading-relaxed">
              Funds are safely isolated in the campus marketplace escrow ledger. Payout is released to the tutor only after session completion.
            </div>
          </div>

          {/* Mock Card Input */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-gray-300 flex items-center justify-between">
              <span>Credit / Debit Card (Stripe Connect Test Card)</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> End-to-End Encrypted
              </span>
            </label>
            <div className="p-2.5 rounded-xl bg-gray-950 border border-gray-700 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="bg-transparent text-white font-mono text-xs w-full focus:outline-none"
              />
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="bg-transparent text-white font-mono text-xs w-14 text-center focus:outline-none"
              />
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                className="bg-transparent text-white font-mono text-xs w-10 text-center focus:outline-none"
              />
            </div>
          </div>

          {/* 15-Minute Guarantee Banner */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>
              <strong>15-Minute Money-Back Guarantee:</strong> If the tutor is late, syllabus mismatched, or unsatisfactory, you can request an instant 100% refund from held escrow during the first 15 minutes.
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAuthorize}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            <span>Authorize & Hold {formatCurrency(totalAmount)} in Escrow</span>
          </button>
        </div>
      </div>
    </div>
  );
}
