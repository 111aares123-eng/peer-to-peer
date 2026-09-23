import React from 'react';
import { Search, SlidersHorizontal, Sparkles, Zap, ShieldCheck } from 'lucide-react';

const SUBJECT_LIST = [
  { code: 'ALL', label: 'All Subjects' },
  { code: 'CS201', label: 'CS201: Data Structures & Algorithms' },
  { code: 'MATH205', label: 'MATH205: Linear Algebra & Calc' },
  { code: 'ECON101', label: 'ECON101: Microeconomics' },
  { code: 'CHEM102', label: 'CHEM102: Organic Chemistry' },
  { code: 'PHYS101', label: 'PHYS101: Mechanics & Dynamics' },
  { code: 'BIO101', label: 'BIO101: Molecular Biology' }
];

export default function SearchFilters({
  filters,
  onFilterChange,
  totalResults
}) {
  return (
    <div className="space-y-4">
      {/* Exam Surge Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent border border-amber-500/20 text-xs text-amber-200">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span>
            <strong>Midterms Exam Week Active:</strong> Dynamic surge pricing and peer group-study formats (up to 4 students) are enabled.
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>15-Min Escrow Guarantee on All Sessions</span>
        </div>
      </div>

      {/* Main Search Bar & Sort */}
      <div className="glass-panel p-4 rounded-2xl shadow-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by topic, syllabus concept, or tutor name..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900/80 border border-gray-700/80 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Sort:</span>
            <select
              value={filters.sort}
              onChange={(e) => onFilterChange('sort', e.target.value)}
              className="px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="rank">Algorithmic Rank (Quality + Volume)</option>
              <option value="rating">Highest Rating</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {SUBJECT_LIST.map((subj) => (
          <button
            key={subj.code}
            onClick={() => onFilterChange('subject', subj.code)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all font-medium border ${
              filters.subject === subj.code
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30'
                : 'bg-gray-800/60 text-gray-400 border-gray-700/60 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {subj.label}
          </button>
        ))}
      </div>

      {/* Secondary Quick Filters: Verified A-Grade, Min Rating, Max Price */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400 px-1">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.verifiedOnly === 'true'}
              onChange={(e) => onFilterChange('verifiedOnly', e.target.checked ? 'true' : 'false')}
              className="rounded bg-gray-800 border-gray-700 text-indigo-600 focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-gray-300">Verified A / A+ Grade Only</span>
          </label>

          <div className="hidden sm:flex items-center gap-2">
            <span>Min Rating:</span>
            <select
              value={filters.minRating}
              onChange={(e) => onFilterChange('minRating', e.target.value)}
              className="px-2 py-1 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-xs"
            >
              <option value="0">Any Rating</option>
              <option value="4.5">4.5+ ★</option>
              <option value="4.8">4.8+ ★</option>
              <option value="4.9">4.9+ ★</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-gray-400">
          Showing <span className="font-semibold text-white">{totalResults}</span> verified peer tutors
        </div>
      </div>
    </div>
  );
}
