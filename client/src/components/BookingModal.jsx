import React, { useState } from 'react';
import { X, Calendar, Video, MapPin, ShieldCheck, Users, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';

const CAMPUS_LOCATIONS = [
  'Central Library 3rd Floor (Quiet Study Pod B)',
  'Turing Engineering Hall - Open Peer Lab 102',
  'Science Center Glass Atrium (Table 8)',
  'Student Union Ground Floor Study Booth 4',
  'Campus Math Commons (Tutor Circle 2)'
];

export default function BookingModal({
  tutor,
  initialSlot,
  isOpen,
  onClose,
  onProceedToPayment
}) {
  if (!isOpen || !tutor) return null;

  const [selectedSlot, setSelectedSlot] = useState(initialSlot || tutor.slots?.[0] || null);
  const [sessionMode, setSessionMode] = useState('IN_APP_VIDEO');
  const [campusLocation, setCampusLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [customLocationNotes, setCustomLocationNotes] = useState('');
  const [isGroupMode, setIsGroupMode] = useState(selectedSlot?.is_group || false);

  // Calculate pricing
  const baseRate = tutor.effectiveRate;
  const finalRate = isGroupMode 
    ? Math.round(baseRate * (1 - (tutor.group_rate_discount || 0.3)))
    : baseRate;

  const handleConfirm = () => {
    if (!selectedSlot) return;

    onProceedToPayment({
      tutor,
      slot: selectedSlot,
      sessionMode,
      campusLocationNotes: sessionMode === 'PUBLIC_CAMPUS_LOCATION' 
        ? `${campusLocation} ${customLocationNotes ? `(${customLocationNotes})` : ''}` 
        : 'In-App Virtual Classroom with Collaborative Whiteboard',
      totalAmount: finalRate,
      isGroup: isGroupMode ? 1 : 0
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="glass-panel w-full max-w-xl rounded-3xl p-6 bg-gray-900 border border-gray-700/80 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <img
              src={tutor.avatar_url}
              alt={tutor.name}
              className="w-12 h-12 rounded-xl object-cover border border-indigo-500/40"
            />
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Schedule Tutoring Session</h2>
              <p className="text-xs text-indigo-300">
                with {tutor.name} • {tutor.subject_code} (Verified Grade {tutor.grade_earned})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-5">
          {/* Step 1: Select Open Slot */}
          <div>
            <label className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>1. Select Availability Slot</span>
            </label>

            {tutor.slots && tutor.slots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {tutor.slots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setIsGroupMode(slot.is_group === 1);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      selectedSlot?.id === slot.id
                        ? 'bg-indigo-600/30 border-indigo-500 text-white font-medium ring-1 ring-indigo-500 shadow-md'
                        : 'bg-gray-800/80 border-gray-700/80 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold text-white">{formatDate(slot.date)}</div>
                    <div className="text-[11px] text-gray-400 flex items-center justify-between mt-1">
                      <span>{formatTime(slot.start_time)}</span>
                      {slot.is_group ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Group
                        </span>
                      ) : (
                        <span className="text-[9px] text-gray-400">1-on-1</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-rose-400">No open slots available for this tutor.</p>
            )}
          </div>

          {/* Step 2: Session Delivery Mode */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>2. Verified Safe Session Mode</span>
              </label>
              <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                Campus Safety Protocol Enforced
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSessionMode('IN_APP_VIDEO')}
                className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${
                  sessionMode === 'IN_APP_VIDEO'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                    : 'bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">In-App Virtual Room</div>
                  <div className="text-[11px] text-gray-400">
                    Live video, collaborative whiteboard, syllabus code scratchpad.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSessionMode('PUBLIC_CAMPUS_LOCATION')}
                className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${
                  sessionMode === 'PUBLIC_CAMPUS_LOCATION'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                    : 'bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Logged Campus Location</div>
                  <div className="text-[11px] text-gray-400">
                    Designated university public libraries & verified study labs.
                  </div>
                </div>
              </button>
            </div>

            {/* Campus location dropdown if in-person mode */}
            {sessionMode === 'PUBLIC_CAMPUS_LOCATION' && (
              <div className="mt-3 p-3 rounded-xl bg-gray-800/70 border border-gray-700 text-xs space-y-2 animate-in fade-in">
                <label className="text-[11px] font-medium text-gray-300">
                  Select Logged Public Study Spot:
                </label>
                <select
                  value={campusLocation}
                  onChange={(e) => setCampusLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-xs text-white"
                >
                  {CAMPUS_LOCATIONS.map((loc, idx) => (
                    <option key={idx} value={loc}>{loc}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Optional desk / table notes (e.g. Table 4 near window)"
                  value={customLocationNotes}
                  onChange={(e) => setCustomLocationNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-xs text-white"
                />
              </div>
            )}
          </div>

          {/* Pricing & Guarantee Notice */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Estimated Total Session Cost:</span>
              <span className="text-base font-bold text-white">
                {formatCurrency(finalRate)}
              </span>
            </div>
            {isGroupMode && (
              <div className="text-[11px] text-amber-300 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>Group study discount (30% off standard hourly rate applied)</span>
              </div>
            )}
            <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-1 border-t border-indigo-500/20">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>15-Minute Money-Back Guarantee: Full refund if session does not align with your syllabus.</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedSlot}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Proceed to Escrow Authorization ({formatCurrency(finalRate)})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
