import React, { useState } from 'react';
import { X, Flag, AlertTriangle, ShieldAlert } from 'lucide-react';

const REPORT_CATEGORIES = [
  'Off-platform contact / WhatsApp solicitation',
  'No-show / Tardy attendance',
  'Inappropriate conduct or language',
  'Syllabus & Course Grade Mismatch',
  'Academic integrity violation'
];

export default function ReportModal({
  isOpen,
  targetUser,
  onClose,
  onSubmitReport
}) {
  if (!isOpen || !targetUser) return null;

  const [category, setCategory] = useState(REPORT_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    try {
      await onSubmitReport({
        reportedUserId: targetUser.user_id || targetUser.id,
        category,
        description: description.trim()
      });
      alert('Report logged. If 3 distinct reports accumulate, the account will be automatically suspended.');
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 bg-gray-900 border border-rose-500/30 shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">One-Tap Safety Flag</h3>
              <p className="text-xs text-rose-300">Reporting {targetUser.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Policy */}
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>
            <strong>Campus Safety Rule:</strong> 3 distinct user reports will trigger an automatic account freeze and listing suspension pending admin review.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-gray-300 font-semibold mb-1 block">Category of Concern:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-700 text-white focus:outline-none focus:border-rose-500"
            >
              {REPORT_CATEGORIES.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray-300 font-semibold mb-1 block">Details of Incident:</label>
            <textarea
              rows={3}
              placeholder="Describe what occurred (e.g. attempted to move communication to personal phone number, asked for direct cash)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-gray-950 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-all shadow-md shadow-rose-600/30 disabled:opacity-50"
            >
              {submitting ? 'Submitting Flag...' : 'Submit One-Tap Flag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
