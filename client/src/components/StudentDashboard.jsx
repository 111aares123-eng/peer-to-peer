import React, { useState } from 'react';
import {
  Calendar, Video, MapPin, CheckCircle2, Clock, Star,
  ShieldCheck, AlertCircle, MessageSquare, Award, ArrowUpRight
} from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';

const REVIEW_TAGS = ['Exam Prep', 'Clear Proofs', 'Patience', 'Helped on Midterm', 'Problem Sets', 'Intuitive Explanations'];

export default function StudentDashboard({
  bookings,
  currentUser,
  onJoinSession,
  onSubmitReview,
  onClaimRefund
}) {
  const [filterState, setFilterState] = useState('ALL');
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState(['Exam Prep', 'Clear Proofs']);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const filteredBookings = bookings.filter((b) => {
    if (filterState === 'ALL') return true;
    return b.state === filterState;
  });

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingForReview) return;
    setSubmittingReview(true);
    try {
      await onSubmitReview({
        bookingId: selectedBookingForReview.id,
        studentId: currentUser.id,
        tutorId: selectedBookingForReview.tutor_id,
        rating,
        tags: selectedTags,
        comment
      });
      setSelectedBookingForReview(null);
      setComment('');
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-white">Student Dashboard & Sessions</h1>
          <p className="text-xs text-gray-400">
            Track your verified peer tutoring sessions, escrow guarantees, and review completed help.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-gray-900 p-1 rounded-xl border border-gray-800 text-xs">
          {['ALL', 'CONFIRMED', 'IN_SESSION', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterState(st)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterState === st
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
          <Calendar className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-sm font-semibold text-gray-300">No sessions found in this view</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Explore verified senior tutors across 6 core courses and schedule an on-demand session with 15-minute escrow protection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookings.map((b) => {
            const isConfirmed = b.state === 'CONFIRMED';
            const isInSession = b.state === 'IN_SESSION';
            const isCompleted = b.state === 'COMPLETED';
            const isCancelled = b.state === 'CANCELLED';

            return (
              <div
                key={b.id}
                className="glass-panel rounded-2xl p-5 border border-gray-800 hover:border-gray-700 transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={b.tutor_avatar || 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120'}
                      alt={b.tutor_name}
                      className="w-12 h-12 rounded-xl object-cover border border-indigo-500/30"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-white text-sm">{b.tutor_name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                          {b.subject_code}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{b.subject_name}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isInSession
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        : isConfirmed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isCompleted
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {b.state}
                  </span>
                </div>

                {/* Session Time & Location */}
                <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 text-xs space-y-1.5 text-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Scheduled Time:</span>
                    <span className="font-semibold text-white">
                      {formatDate(b.slot_date)} • {formatTime(b.slot_start)} - {formatTime(b.slot_end)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Delivery Mode:</span>
                    <span className="text-indigo-300">
                      {b.session_mode === 'IN_APP_VIDEO' ? 'In-App Virtual Classroom' : 'Logged Campus Location'}
                    </span>
                  </div>
                  {b.campus_location_notes && (
                    <div className="text-[11px] text-gray-400 truncate">
                      Location: {b.campus_location_notes}
                    </div>
                  )}
                </div>

                {/* Escrow Status Bar */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-800">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      Escrow: <strong>{formatCurrency(b.total_amount)}</strong> ({b.escrow_status || 'HELD'})
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {(isConfirmed || isInSession) && (
                      <button
                        onClick={() => onJoinSession(b)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Launch Virtual Room</span>
                      </button>
                    )}

                    {isCompleted && (
                      <button
                        onClick={() => setSelectedBookingForReview(b)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Rate & Recalculate Rank</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rate & Review Modal */}
      {selectedBookingForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 bg-gray-900 border border-indigo-500/30 shadow-2xl relative space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Rate Session & Update Tutor Rank</span>
            </h3>
            <p className="text-xs text-gray-400">
              Your rating directly feeds the algorithmic ranking score for{' '}
              <strong>{selectedBookingForReview.tutor_name}</strong> in {selectedBookingForReview.subject_code}.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              {/* Star Rating */}
              <div>
                <label className="text-xs font-semibold text-gray-300 mb-1.5 block">
                  Overall Rating (1 to 5 Stars):
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setRating(s)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          s <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-amber-300 ml-2">{rating}.0 / 5.0</span>
                </div>
              </div>

              {/* Tag Selection */}
              <div>
                <label className="text-xs font-semibold text-gray-300 mb-1.5 block">
                  Peer Feedback Badges:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {REVIEW_TAGS.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                        selectedTags.includes(tag)
                          ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                          : 'bg-gray-800 text-gray-400 border-gray-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="text-xs font-semibold text-gray-300 mb-1.5 block">
                  Syllabus Review & Comments:
                </label>
                <textarea
                  rows={3}
                  placeholder="How did this tutor help with problem sets or midterm preparation?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-950 border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForReview(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
                >
                  {submittingReview ? 'Updating Ranking Score...' : 'Submit & Update Rank Score'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
