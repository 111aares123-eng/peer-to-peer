import React, { useState } from 'react';
import { Star, ShieldCheck, Clock, Flag, Calendar, Info, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatTime, formatDate, explainRankScore } from '../utils/formatters';

export default function TutorCard({
  tutor,
  onSelectSlot,
  onReport
}) {
  const [showFormulaTooltip, setShowFormulaTooltip] = useState(false);

  const rankScore = tutor.ranking_score ?? tutor.rank_score ?? 9.5;
  const avgRating = tutor.average_rating ?? 5.0;
  const sessionsCount = tutor.total_sessions_completed ?? tutor.completed_sessions_count ?? 0;
  const gradeEarned = tutor.grade_earned || tutor.course_grade || 'A';
  const effectiveRate = tutor.effectiveRate ?? tutor.hourly_rate ?? 600;

  const rankExplanation = explainRankScore(
    rankScore,
    avgRating,
    sessionsCount
  );

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between relative group">
      {/* Top Banner: Rank Score + College Verified */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={tutor.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={tutor.name}
                className="w-13 h-13 rounded-2xl object-cover border-2 border-indigo-500/30"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-gray-950 p-0.5 rounded-full ring-2 ring-gray-900" title="Verified Transcript">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-white text-base leading-snug">{tutor.name}</h3>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  @{tutor.college_domain}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 font-medium line-clamp-1">{tutor.headline}</p>
            </div>
          </div>

          {/* Algorithmic Rank Score Badge with Formula Tooltip */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowFormulaTooltip(true)}
              onMouseLeave={() => setShowFormulaTooltip(false)}
              onClick={() => setShowFormulaTooltip(!showFormulaTooltip)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/15 to-indigo-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs transition-all hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Rank {rankScore.toFixed(2)}</span>
            </button>

            {showFormulaTooltip && (
              <div className="absolute right-0 top-8 w-64 p-3 rounded-xl bg-gray-950 border border-indigo-500/40 shadow-2xl z-50 text-[11px] space-y-1.5 animate-in fade-in">
                <div className="font-semibold text-white flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  Algorithmic Score Breakdown
                </div>
                <div className="text-gray-300 font-mono text-[10px] bg-gray-900 p-1.5 rounded border border-gray-800">
                  {rankExplanation.explanation}
                </div>
                <div className="text-gray-400 leading-relaxed text-[10px]">
                  Balances quality (Rating × 0.70) with verified experience volume (log₁₀(Sessions + 1) × 0.30).
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verified Grade & GPA Pill */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{tutor.subject_code}: Grade {gradeEarned} Verified</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-800 text-gray-300 text-xs">
            <span>GPA: <strong className="text-white">{(tutor.gpa || 3.9).toFixed(2)}</strong></span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-800 text-gray-300 text-xs">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="font-semibold text-white">{avgRating.toFixed(2)}</span>
            <span className="text-gray-400">({sessionsCount} sessions)</span>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4">
          {tutor.bio}
        </p>
      </div>

      {/* Available Slots & Booking Section */}
      <div className="pt-3 border-t border-gray-800/80 space-y-3">
        {/* Price & Escrow Notice */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-white">
                {formatCurrency(effectiveRate)}
              </span>
              <span className="text-xs text-gray-400">/ hour</span>
              {tutor.hasSurge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Exam Surge Active
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500">12% platform escrow included</p>
          </div>

          <button
            onClick={() => onReport(tutor)}
            className="text-gray-500 hover:text-rose-400 text-xs flex items-center gap-1 p-1 transition-colors"
            title="One-Tap Flag / Report for Misconduct"
          >
            <Flag className="w-3.5 h-3.5" />
            <span className="text-[10px]">Report</span>
          </button>
        </div>

        {/* Slot Quick Selector */}
        <div>
          <div className="text-[11px] font-medium text-gray-400 mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Open Verified Slots:</span>
          </div>

          {tutor.slots && tutor.slots.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5">
              {tutor.slots.slice(0, 4).map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => onSelectSlot(tutor, slot)}
                  className="px-2 py-1.5 rounded-lg bg-gray-800/90 hover:bg-indigo-600 hover:text-white border border-gray-700/70 hover:border-indigo-500 text-left text-xs transition-all group/btn"
                >
                  <div className="font-medium text-gray-200 group-hover/btn:text-white">
                    {formatDate(slot.date || slot.start_time)}
                  </div>
                  <div className="text-[10px] text-gray-400 group-hover/btn:text-indigo-100 flex items-center justify-between">
                    <span>{formatTime(slot.start_time)}</span>
                    {slot.is_group ? (
                      <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300">Group</span>
                    ) : (
                      <span>1-on-1</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic py-1">
              No open slots right now. Check back soon.
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => onSelectSlot(tutor, tutor.slots?.[0] || null)}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
        >
          <Calendar className="w-4 h-4" />
          <span>Select Time & Escrow Book</span>
        </button>
      </div>
    </div>
  );
}
