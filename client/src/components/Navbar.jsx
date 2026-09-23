import React, { useState } from 'react';
import { ShieldCheck, UserCheck, RefreshCw, GraduationCap, Wallet, ChevronDown, Award } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function Navbar({
  currentUser,
  demoPersonas,
  onSwitchPersona,
  activeTab,
  setActiveTab,
  onReseed,
  isReseeding
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-gray-900/85 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & College Tag */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('explore')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white">PeerGrad</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Campus Verified
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Syllabus-Aligned Escrow Marketplace</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-800/60 p-1 rounded-xl border border-gray-700/50">
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'explore'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Explore Tutors
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'bookings'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              My Bookings
            </button>
            <button
              onClick={() => setActiveTab('tutor-dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'tutor-dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Tutor Portal
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Admin & Escrow
            </button>
          </nav>

          {/* Right Controls: Balance + Persona Switcher + Reset */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Wallet Balance Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800/80 border border-gray-700/70 text-xs text-gray-200">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>
                {currentUser?.role === 'tutor' ? 'Earnings: ' : 'Balance: '}
                <strong className="text-emerald-400 font-semibold">
                  {formatCurrency(currentUser?.balance || 0)}
                </strong>
              </span>
            </div>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gray-800/90 border border-indigo-500/30 hover:border-indigo-500/60 transition-all text-left"
              >
                <img
                  src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={currentUser?.name}
                  className="w-7 h-7 rounded-full object-cover border border-indigo-400/40"
                />
                <div className="hidden lg:block text-xs">
                  <div className="font-semibold text-white leading-tight flex items-center gap-1">
                    {currentUser?.name?.split(' ')[0]}
                    {currentUser?.status === 'ACTIVE' && (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-[10px] text-indigo-300 capitalize">{currentUser?.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-gray-800 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">
                    Switch Test Persona
                  </div>
                  <div className="mt-1 space-y-1">
                    {demoPersonas.map((persona) => (
                      <button
                        key={persona.id}
                        onClick={() => onSwitchPersona(persona.id)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                          currentUser?.id === persona.id
                            ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold'
                            : 'hover:bg-gray-800 text-gray-300'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-white">{persona.name}</div>
                          <div className="text-[11px] text-gray-400">{persona.description}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                          {persona.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reseed / Reset Cold-Start Button */}
            <button
              onClick={onReseed}
              disabled={isReseeding}
              title="Reseed 15 Senior Tutors & Reset Demo"
              className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-indigo-400 border border-gray-700 transition-all text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${isReseeding ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden xl:inline text-xs">Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-gray-800/60 text-xs">
          <button
            onClick={() => setActiveTab('explore')}
            className={`py-1 px-2.5 rounded-lg ${activeTab === 'explore' ? 'text-indigo-400 font-bold' : 'text-gray-400'}`}
          >
            Explore
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-1 px-2.5 rounded-lg ${activeTab === 'bookings' ? 'text-indigo-400 font-bold' : 'text-gray-400'}`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('tutor-dashboard')}
            className={`py-1 px-2.5 rounded-lg ${activeTab === 'tutor-dashboard' ? 'text-indigo-400 font-bold' : 'text-gray-400'}`}
          >
            Tutor
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-1 px-2.5 rounded-lg ${activeTab === 'admin' ? 'text-indigo-400 font-bold' : 'text-gray-400'}`}
          >
            Admin
          </button>
        </div>
      </div>
    </header>
  );
}
