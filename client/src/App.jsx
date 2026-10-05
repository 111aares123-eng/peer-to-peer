import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { api } from './utils/api';
import Navbar from './components/Navbar';
import SearchFilters from './components/SearchFilters';
import TutorCard from './components/TutorCard';
import BookingModal from './components/BookingModal';
import EscrowPaymentModal from './components/EscrowPaymentModal';
import LiveSessionRoom from './components/LiveSessionRoom';
import StudentDashboard from './components/StudentDashboard';
import TutorDashboard from './components/TutorDashboard';
import AdminDashboard from './components/AdminDashboard';
import ReportModal from './components/ReportModal';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [demoPersonas, setDemoPersonas] = useState([]);
  const [activeTab, setActiveTab] = useState('explore');

  // Filters & Tutors
  const [tutors, setTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [filters, setFilters] = useState({
    subject: 'ALL',
    search: '',
    minRating: 0,
    maxPrice: 5000,
    verifiedOnly: 'false',
    sort: 'rank'
  });

  // User Bookings & Escrow
  const [bookings, setBookings] = useState([]);
  const [escrowLedger, setEscrowLedger] = useState([]);

  // Modals state
  const [selectedTutorForBooking, setSelectedTutorForBooking] = useState(null);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);
  const [pendingPaymentDetails, setPendingPaymentDetails] = useState(null);
  const [activeLiveSession, setActiveLiveSession] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [isReseeding, setIsReseeding] = useState(false);

  // Socket
  const socketRef = useRef(null);

  // Initialize Socket.io
  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('booking_state_changed', () => {
      refreshBookings();
    });

    socket.on('booking_refunded', (data) => {
      alert(`100% Escrow Refund processed for session ${data.bookingId}`);
      refreshBookings();
      refreshUser();
    });

    socket.on('user_suspended', (data) => {
      alert(`Safety Alert: Account ${data.userId} auto-suspended after 3 distinct community reports.`);
      refreshTutors();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Initialize Demo Personas & Current User
  useEffect(() => {
    async function initAuth() {
      try {
        const personas = await api.getDemoPersonas();
        setDemoPersonas(personas);

        // Default to Student Alex Rivera if not set
        const defaultPersona = personas[0];
        const res = await api.switchPersona(defaultPersona.id);
        localStorage.setItem('p2p_auth_token', res.token);
        setCurrentUser(res.user);
      } catch (err) {
        console.error('Failed to initialize demo persona:', err);
      }
    }
    initAuth();
  }, []);

  // Fetch Tutors when filters change
  const refreshTutors = async () => {
    setLoadingTutors(true);
    try {
      const data = await api.getTutors(filters);
      setTutors(data);
    } catch (err) {
      console.error('Error fetching tutors:', err);
    } finally {
      setLoadingTutors(false);
    }
  };

  useEffect(() => {
    refreshTutors();
  }, [filters]);

  // Fetch Bookings & Escrow Ledger
  const refreshBookings = async () => {
    if (!currentUser) return;
    try {
      const data = await api.getBookings({ userId: currentUser.id, role: currentUser.role });
      setBookings(data);

      if (currentUser.role === 'tutor' || currentUser.role === 'admin') {
        const ledger = await api.getEscrowLedger();
        setEscrowLedger(ledger);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setCurrentUser(res.user);
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  useEffect(() => {
    refreshBookings();
  }, [currentUser]);

  // Handle Switch Persona
  const handleSwitchPersona = async (userId) => {
    try {
      const res = await api.switchPersona(userId);
      localStorage.setItem('p2p_auth_token', res.token);
      setCurrentUser(res.user);
      if (res.user.role === 'tutor') {
        setActiveTab('tutor-dashboard');
      } else if (res.user.role === 'admin') {
        setActiveTab('admin');
      } else {
        setActiveTab('explore');
      }
    } catch (err) {
      alert(err.message || 'Failed to switch persona');
    }
  };

  // Reseed Cold-Start Data
  const handleReseed = async () => {
    if (!confirm('Reseed database with 15 senior tutors across 6 core courses?')) return;
    setIsReseeding(true);
    try {
      await api.reseedDatabase();
      await refreshTutors();
      await refreshBookings();
      await refreshUser();
      alert('Marketplace reseeded with 15 verified senior tutors!');
    } catch (err) {
      alert(err.message || 'Failed to reseed');
    } finally {
      setIsReseeding(false);
    }
  };

  // Filter change handler
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Booking Flow: Step 1 -> Open slot picker
  const handleSelectSlot = (tutor, slot) => {
    setSelectedTutorForBooking(tutor);
    setSelectedSlotForBooking(slot);
  };

  // Booking Flow: Step 2 -> Proceed to Escrow Checkout
  const handleProceedToPayment = (details) => {
    setSelectedTutorForBooking(null);
    setPendingPaymentDetails(details);
  };

  // Booking Flow: Step 3 -> Execute atomic booking & escrow hold
  const handlePaymentSuccess = async (bookingData) => {
    await api.createBooking({
      ...bookingData,
      studentId: currentUser.id
    });

    setPendingPaymentDetails(null);
    await refreshBookings();
    await refreshTutors();
    await refreshUser();

    alert(`Session booked! Escrow hold of ₹${bookingData.totalAmount} is active with 15-minute guarantee.`);
    setActiveTab('bookings');
  };

  // Session Completion: Two-party confirm & escrow split release
  const handleCompleteSession = async (bookingId) => {
    try {
      await api.confirmBookingParty(bookingId, currentUser.role, currentUser.id);
      await refreshBookings();
      await refreshUser();
      setActiveLiveSession(null);
      alert('Session verified! Escrow split completed (Tutor received 88%, Platform retained 12%).');
      setActiveTab('bookings');
    } catch (err) {
      alert(err.message || 'Failed to complete session');
    }
  };

  // 15-Minute Guarantee Refund Claim
  const handleClaimRefund = async (bookingId) => {
    if (!confirm('Claim 100% money-back guarantee refund from held escrow?')) return;
    try {
      await api.claimGuaranteeRefund(bookingId, currentUser.id, '15-minute satisfaction guarantee invoked');
      await refreshBookings();
      await refreshUser();
      setActiveLiveSession(null);
      alert('100% refund returned to your wallet balance.');
    } catch (err) {
      alert(err.message || 'Failed to claim refund');
    }
  };

  // One-Tap Report
  const handleSubmitReport = async (reportData) => {
    await api.reportUser({
      ...reportData,
      reporterId: currentUser.id
    });
    await refreshTutors();
  };

  // Submit Review
  const handleSubmitReview = async (reviewData) => {
    await api.submitReview(reviewData);
    await refreshBookings();
    await refreshTutors();
    alert('Review submitted! Tutor ranking score updated.');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        demoPersonas={demoPersonas}
        onSwitchPersona={handleSwitchPersona}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReseed={handleReseed}
        isReseeding={isReseeding}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 1: Explore & Book Verified Tutors */}
        {activeTab === 'explore' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Hero Banner */}
            <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-900/60 via-gray-900 to-indigo-950/40 border border-indigo-500/30 overflow-hidden shadow-2xl">
              <div className="max-w-2xl relative z-10 space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>College SSO & Grade A Transcript Verified</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Syllabus-Aligned Peer Tutoring with Automated Escrow Protection
                </h1>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Connect on-demand with high-achieving campus seniors. Pre-session coordination is 100% masked for safety, funds are held in escrow until two-party confirmation, and all sessions feature a 15-minute satisfaction guarantee.
                </p>
              </div>
            </div>

            {/* Interactive Search & Filter Bar */}
            <SearchFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              totalResults={tutors.length}
            />

            {/* Ranked Tutor Cards Grid */}
            {loadingTutors ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="glass-panel rounded-2xl p-5 h-72 animate-pulse" />
                ))}
              </div>
            ) : tutors.length === 0 ? (
              <div className="glass-panel p-12 rounded-3xl text-center text-gray-400">
                No tutors found matching your search criteria. Try relaxing your filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {tutors.map((tutor) => (
                  <TutorCard
                    key={tutor.tutor_id}
                    tutor={tutor}
                    onSelectSlot={handleSelectSlot}
                    onReport={(t) => setReportTarget(t)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Bookings & Live Session Launch */}
        {activeTab === 'bookings' && (
          <StudentDashboard
            bookings={bookings}
            currentUser={currentUser}
            onJoinSession={(b) => setActiveLiveSession(b)}
            onSubmitReview={handleSubmitReview}
            onClaimRefund={handleClaimRefund}
          />
        )}

        {/* Tab 3: Tutor Portal */}
        {activeTab === 'tutor-dashboard' && (
          <TutorDashboard
            currentUser={currentUser}
            tutorProfile={currentUser?.tutorProfile}
            bookings={bookings}
            escrowLedger={escrowLedger}
            onUpdateSettings={async (id, settings) => {
              await api.updateTutorSettings(id, settings);
              await refreshUser();
            }}
            onAddSlot={async (id, slot) => {
              await api.addSlot(id, slot);
              await refreshTutors();
            }}
          />
        )}

        {/* Tab 4: Admin & Escrow Audit Console */}
        {activeTab === 'admin' && (
          <AdminDashboard
            onReseed={handleReseed}
            isReseeding={isReseeding}
          />
        )}
      </main>

      {/* Booking Slot Modal */}
      {selectedTutorForBooking && (
        <BookingModal
          tutor={selectedTutorForBooking}
          initialSlot={selectedSlotForBooking}
          isOpen={true}
          onClose={() => setSelectedTutorForBooking(null)}
          onProceedToPayment={handleProceedToPayment}
        />
      )}

      {/* Escrow Payment Authorization Modal */}
      {pendingPaymentDetails && (
        <EscrowPaymentModal
          bookingDetails={pendingPaymentDetails}
          isOpen={true}
          onClose={() => setPendingPaymentDetails(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Live Virtual Classroom Room */}
      {activeLiveSession && (
        <LiveSessionRoom
          booking={activeLiveSession}
          currentUser={currentUser}
          socket={socketRef.current}
          onClose={() => setActiveLiveSession(null)}
          onCompleteSession={handleCompleteSession}
          onClaimRefund={handleClaimRefund}
          onReport={(t) => setReportTarget(t)}
        />
      )}

      {/* One-Tap Safety Flag Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={true}
          targetUser={reportTarget}
          onClose={() => setReportTarget(null)}
          onSubmitReport={handleSubmitReport}
        />
      )}
    </div>
  );
}
