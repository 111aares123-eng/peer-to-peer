import React, { useState } from 'react';
import {
  Wallet, Star, Award, Zap, Calendar, Plus, Users,
  CheckCircle2, Clock, ShieldCheck, ArrowDownRight, Settings
} from 'lucide-react';
import { formatCurrency, formatDate, formatTime, explainRankScore } from '../utils/formatters';

export default function TutorDashboard({
  currentUser,
  tutorProfile,
  bookings,
  escrowLedger,
  onUpdateSettings,
  onAddSlot
}) {
  const [hourlyRate, setHourlyRate] = useState(tutorProfile?.hourly_rate || 650);
  const [surgeMultiplier, setSurgeMultiplier] = useState(tutorProfile?.surge_multiplier || 1.0);
  const [groupDiscount, setGroupDiscount] = useState(tutorProfile?.group_rate_discount || 0.30);
  const [savingSettings, setSavingSettings] = useState(false);

  // New slot form state
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:00');
  const [isGroup, setIsGroup] = useState(false);
  const [addingSlot, setAddingSlot] = useState(false);

  const rankExplanation = explainRankScore(
    tutorProfile?.ranking_score || 0,
    tutorProfile?.average_rating || 5.0,
    tutorProfile?.total_sessions_completed || 0
  );

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await onUpdateSettings(tutorProfile.id, {
        hourly_rate: Number(hourlyRate),
        surge_multiplier: Number(surgeMultiplier),
        group_rate_discount: Number(groupDiscount)
      });
      alert('Tutor pricing & surge settings updated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setAddingSlot(true);
    try {
      await onAddSlot(tutorProfile.id, {
        date: newDate,
        start_time: startTime,
        end_time: endTime,
        is_group: isGroup ? 1 : 0,
        max_capacity: isGroup ? 4 : 1
      });
      alert('Availability slot added to your public calendar.');
    } catch (err) {
      alert(err.message || 'Failed to add slot');
    } finally {
      setAddingSlot(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Senior Tutor Portal</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Verified Mentor
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Manage your syllabus availability, dynamic surge pricing, and view isolated escrow split payouts.
          </p>
        </div>

        {/* Payout Balance Card */}
        <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 text-right">
          <div className="text-[11px] text-gray-300">Total Net Tutor Earnings (88% Released)</div>
          <div className="text-xl font-extrabold text-emerald-400">
            {formatCurrency(currentUser?.balance || 0)}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Algorithmic Rank Score */}
        <div className="glass-panel p-4 rounded-2xl border border-indigo-500/30 space-y-1">
          <div className="flex items-center justify-between text-xs text-indigo-300">
            <span>Algorithmic Rank Score</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {tutorProfile?.ranking_score?.toFixed(2) || '0.00'}
          </div>
          <div className="text-[10px] text-gray-400 font-mono">
            {rankExplanation.explanation}
          </div>
        </div>

        {/* Metric 2: Average Rating */}
        <div className="glass-panel p-4 rounded-2xl border border-gray-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Student Rating (R)</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {tutorProfile?.average_rating?.toFixed(2) || '5.00'} / 5.0
          </div>
          <div className="text-[10px] text-gray-400">
            Weighted at 70% in ranking algorithm
          </div>
        </div>

        {/* Metric 3: Session Volume */}
        <div className="glass-panel p-4 rounded-2xl border border-gray-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Completed Volume (S)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {tutorProfile?.total_sessions_completed || 0} Sessions
          </div>
          <div className="text-[10px] text-gray-400">
            log₁₀ scale prevents volume spam monopolies
          </div>
        </div>
      </div>

      {/* Pricing & Surge Controls + Add Slot Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Dynamic Pricing & Exam Surge Settings */}
        <div className="glass-panel p-5 rounded-3xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Exam Surge & Dynamic Pricing</span>
            </h3>
            <span className="text-[10px] text-gray-400">12% platform take-rate</span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            {/* Standard Hourly Rate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-gray-300 font-medium">Standard Hourly Rate:</label>
                <span className="font-bold text-white">{formatCurrency(hourlyRate)}</span>
              </div>
              <input
                type="range"
                min="300"
                max="1500"
                step="50"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Exam Week Surge Multiplier */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-gray-300 font-medium flex items-center gap-1">
                  <span>Exam-Week Surge Multiplier:</span>
                  {surgeMultiplier > 1.0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      +{Math.round((surgeMultiplier - 1) * 100)}% Surge
                    </span>
                  )}
                </label>
                <span className="font-bold text-amber-300">{surgeMultiplier}x</span>
              </div>
              <div className="flex items-center gap-2">
                {[1.0, 1.2, 1.35, 1.5].map((multiplier) => (
                  <button
                    type="button"
                    key={multiplier}
                    onClick={() => setSurgeMultiplier(multiplier)}
                    className={`flex-1 py-1.5 rounded-lg border text-center transition-all ${
                      surgeMultiplier === multiplier
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-semibold'
                        : 'bg-gray-800 text-gray-400 border-gray-700'
                    }`}
                  >
                    {multiplier === 1.0 ? 'Standard' : `${multiplier}x`}
                  </button>
                ))}
              </div>
            </div>

            {/* Effective Rate Preview */}
            <div className="p-3 rounded-2xl bg-gray-900 border border-gray-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Effective Student Price:</span>
                <span className="font-bold text-white text-sm">
                  {formatCurrency(Math.round(hourlyRate * surgeMultiplier))} / hr
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-400">
                <span>Your Take-Home (88% after escrow split):</span>
                <span className="font-semibold">
                  {formatCurrency(Math.round((hourlyRate * surgeMultiplier) * 0.88))} / hr
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md shadow-indigo-600/30"
            >
              {savingSettings ? 'Saving...' : 'Update Tutor Pricing Settings'}
            </button>
          </form>
        </div>

        {/* Right: Add Open Calendar Slot */}
        <div className="glass-panel p-5 rounded-3xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Add Availability Slot</span>
            </h3>
            <span className="text-[10px] text-gray-400">Live on Student Calendar</span>
          </div>

          <form onSubmit={handleCreateSlot} className="space-y-4 text-xs">
            <div>
              <label className="text-gray-300 font-medium mb-1 block">Date:</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-300 font-medium mb-1 block">Start Time:</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-gray-300 font-medium mb-1 block">End Time:</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-700 text-white"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isGroup}
                onChange={(e) => setIsGroup(e.target.checked)}
                className="rounded bg-gray-800 border-gray-700 text-indigo-600 focus:ring-0"
              />
              <span className="text-gray-300">
                Group Exam Prep Format (Capacity: 4 students, 30% discount per student)
              </span>
            </label>

            <button
              type="submit"
              disabled={addingSlot}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{addingSlot ? 'Publishing Slot...' : 'Publish Slot to Marketplace'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Escrow Payouts Ledger Table */}
      <div className="glass-panel p-5 rounded-3xl border border-gray-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">Isolated Escrow Payouts Ledger</h3>
          </div>
          <span className="text-[11px] text-gray-400">Two-party atomic split audit</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 font-medium">
                <th className="pb-2.5">Date / Transaction</th>
                <th className="pb-2.5">Student Peer</th>
                <th className="pb-2.5">Gross Amount</th>
                <th className="pb-2.5">Platform Fee (12%)</th>
                <th className="pb-2.5">Tutor Payout (88%)</th>
                <th className="pb-2.5">Escrow State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-gray-300">
              {escrowLedger && escrowLedger.length > 0 ? (
                escrowLedger.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-800/30">
                    <td className="py-2.5 font-mono text-[11px] text-gray-400">
                      {formatDate(row.hold_initiated_at)}
                    </td>
                    <td className="py-2.5 font-medium text-white">{row.student_name}</td>
                    <td className="py-2.5 font-semibold text-white">{formatCurrency(row.gross_amount)}</td>
                    <td className="py-2.5 text-gray-400">-{formatCurrency(row.platform_fee)}</td>
                    <td className="py-2.5 font-semibold text-emerald-400">+{formatCurrency(row.tutor_amount)}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === 'RELEASED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : row.status === 'HELD'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500">
                    No escrow payout records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
