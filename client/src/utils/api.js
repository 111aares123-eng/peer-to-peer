import { MOCK_PERSONAS, MOCK_TUTORS, MOCK_SUBJECTS } from './mockData';

const API_ORIGIN = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
const BASE_URL = `${API_ORIGIN}/api`;

let memoryBookings = [
  {
    id: 'sample_b_001',
    student_id: 'user_student_alex',
    tutor_id: 'tutor_prof_priya',
    tutor_name: 'Priya Sharma',
    tutor_avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150',
    student_name: 'Alex Rivera',
    subject_code: 'CS201',
    start_time: '2026-10-06T14:00:00Z',
    end_time: '2026-10-06T15:00:00Z',
    status: 'IN_PROGRESS',
    session_mode: 'IN_APP_VIDEO',
    campus_location_notes: 'In-App Virtual Classroom with Collaborative Whiteboard',
    total_amount: 650,
    tutor_amount: 572,
    platform_fee: 78,
    escrow_status: 'HELD',
    created_at: new Date().toISOString()
  }
];

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('p2p_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Network request failed' }));
    throw new Error(data.error || 'Network request failed');
  }

  return await response.json();
}

export const api = {
  // Auth
  getDemoPersonas: async () => {
    try {
      return await apiRequest('/auth/demo-personas');
    } catch {
      return MOCK_PERSONAS;
    }
  },

  switchPersona: async (userId) => {
    try {
      return await apiRequest('/auth/switch-persona', {
        method: 'POST',
        body: JSON.stringify({ userId })
      });
    } catch {
      const user = MOCK_PERSONAS.find((p) => p.id === userId) || MOCK_PERSONAS[0];
      return {
        token: `mock_jwt_${user.id}`,
        user
      };
    }
  },

  loginSSO: async (email, name, role) => {
    try {
      return await apiRequest('/auth/sso', {
        method: 'POST',
        body: JSON.stringify({ email, name, role })
      });
    } catch {
      return {
        token: 'mock_jwt_sso',
        user: { id: `user_${Date.now()}`, email, name, role, status: 'ACTIVE', balance: 3000 }
      };
    }
  },

  getMe: async () => {
    try {
      return await apiRequest('/auth/me');
    } catch {
      return { user: MOCK_PERSONAS[0] };
    }
  },

  // Tutors & Subjects
  getTutors: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      return await apiRequest(`/tutors?${query}`);
    } catch {
      let result = [...MOCK_TUTORS];
      if (params.subject && params.subject !== 'ALL') {
        result = result.filter((t) => t.subject_code === params.subject);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        result = result.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.headline.toLowerCase().includes(q) ||
            t.subject_code.toLowerCase().includes(q)
        );
      }
      if (params.minRating) {
        result = result.filter((t) => t.average_rating >= Number(params.minRating));
      }
      if (params.maxPrice) {
        result = result.filter((t) => t.effectiveRate <= Number(params.maxPrice));
      }
      return result;
    }
  },

  getTutorById: async (id) => {
    try {
      return await apiRequest(`/tutors/${id}`);
    } catch {
      return MOCK_TUTORS.find((t) => t.tutor_id === id) || MOCK_TUTORS[0];
    }
  },

  updateTutorSettings: async (id, settings) => {
    try {
      return await apiRequest(`/tutors/${id}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
    } catch {
      return { success: true, settings };
    }
  },

  addSlot: async (tutorId, slot) => {
    try {
      return await apiRequest(`/tutors/${tutorId}/slots`, {
        method: 'POST',
        body: JSON.stringify(slot)
      });
    } catch {
      return { success: true, slot: { ...slot, id: `slot_${Date.now()}` } };
    }
  },

  getSubjects: async () => {
    try {
      return await apiRequest('/tutors/meta/subjects');
    } catch {
      return MOCK_SUBJECTS;
    }
  },

  // Bookings & State Machine
  createBooking: async (bookingData) => {
    try {
      return await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });
    } catch {
      const tutor = MOCK_TUTORS.find((t) => t.tutor_id === bookingData.tutorId) || MOCK_TUTORS[0];
      const newBooking = {
        id: `book_${Date.now()}`,
        student_id: bookingData.studentId || 'user_student_alex',
        tutor_id: tutor.tutor_id,
        tutor_name: tutor.name,
        tutor_avatar: tutor.avatar_url,
        student_name: 'Alex Rivera',
        subject_code: bookingData.subjectCode || tutor.subject_code,
        start_time: bookingData.slot?.start_time || new Date().toISOString(),
        end_time: bookingData.slot?.end_time || new Date(Date.now() + 3600000).toISOString(),
        status: 'CONFIRMED',
        session_mode: bookingData.sessionMode,
        campus_location_notes: bookingData.campusLocationNotes,
        total_amount: bookingData.totalAmount,
        tutor_amount: Math.round(bookingData.totalAmount * 0.88),
        platform_fee: Math.round(bookingData.totalAmount * 0.12),
        escrow_status: 'HELD',
        created_at: new Date().toISOString()
      };
      memoryBookings.unshift(newBooking);
      return { booking: newBooking };
    }
  },

  getBookings: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      return await apiRequest(`/bookings?${query}`);
    } catch {
      return memoryBookings;
    }
  },

  getBookingById: async (id) => {
    try {
      return await apiRequest(`/bookings/${id}`);
    } catch {
      return memoryBookings.find((b) => b.id === id) || memoryBookings[0];
    }
  },

  transitionBooking: async (id, nextState, actorId, reason) => {
    try {
      return await apiRequest(`/bookings/${id}/transition`, {
        method: 'POST',
        body: JSON.stringify({ nextState, actorId, reason })
      });
    } catch {
      const b = memoryBookings.find((x) => x.id === id);
      if (b) b.status = nextState;
      return { success: true };
    }
  },

  confirmBookingParty: async (id, actorRole, actorId) => {
    try {
      return await apiRequest(`/bookings/${id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ actorRole, actorId })
      });
    } catch {
      const b = memoryBookings.find((x) => x.id === id);
      if (b) {
        b.status = 'COMPLETED';
        b.escrow_status = 'RELEASED';
      }
      return { success: true };
    }
  },

  claimGuaranteeRefund: async (id, studentId, reason) => {
    try {
      return await apiRequest(`/bookings/${id}/guarantee-refund`, {
        method: 'POST',
        body: JSON.stringify({ studentId, reason })
      });
    } catch {
      const b = memoryBookings.find((x) => x.id === id);
      if (b) {
        b.status = 'REFUNDED';
        b.escrow_status = 'REFUNDED';
      }
      return { success: true };
    }
  },

  // Escrow
  getEscrowLedger: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      return await apiRequest(`/escrow/ledger?${query}`);
    } catch {
      return memoryBookings.map((b) => ({
        id: `escrow_${b.id}`,
        booking_id: b.id,
        gross_amount: b.total_amount,
        tutor_amount: b.tutor_amount,
        platform_fee: b.platform_fee,
        status: b.escrow_status,
        created_at: b.created_at,
        released_at: b.escrow_status === 'RELEASED' ? new Date().toISOString() : null
      }));
    }
  },

  getEscrowSummary: async () => {
    try {
      return await apiRequest('/escrow/summary');
    } catch {
      return { totalGross: 42000, totalTutorPayout: 36960, totalPlatformFee: 5040, activeHolds: 650 };
    }
  },

  previewSplit: async (amount) => {
    try {
      return await apiRequest(`/escrow/preview-split?amount=${amount}`);
    } catch {
      const gross = Number(amount);
      const platform = Math.round(gross * 0.12);
      return { gross, platformFee: platform, tutorPayout: gross - platform, platformFeePercentage: 12 };
    }
  },

  // Reviews
  submitReview: async (reviewData) => {
    try {
      return await apiRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify(reviewData)
      });
    } catch {
      return { success: true };
    }
  },

  getTutorReviews: async (tutorId) => {
    try {
      return await apiRequest(`/reviews/tutor/${tutorId}`);
    } catch {
      const t = MOCK_TUTORS.find((x) => x.tutor_id === tutorId);
      return t?.reviews || [];
    }
  },

  // Chat
  getChatMessages: async (bookingId) => {
    try {
      return await apiRequest(`/chat/${bookingId}`);
    } catch {
      return [
        {
          id: 'msg_1',
          booking_id: bookingId,
          sender_id: 'tutor_u_priya',
          sender_name: 'Priya Sharma',
          content: 'Hi Alex! Looking forward to our CS201 dynamic programming review session.',
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];
    }
  },

  sendChatMessage: async (bookingId, payload) => {
    try {
      return await apiRequest(`/chat/${bookingId}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch {
      return {
        message: {
          id: `msg_${Date.now()}`,
          booking_id: bookingId,
          sender_id: payload.senderId,
          sender_name: 'You',
          content: payload.content,
          created_at: new Date().toISOString()
        }
      };
    }
  },

  // Moderation & Admin
  reportUser: async (reportData) => {
    try {
      return await apiRequest('/moderation/report', {
        method: 'POST',
        body: JSON.stringify(reportData)
      });
    } catch {
      return { success: true };
    }
  },

  getModerationQueue: async () => {
    try {
      return await apiRequest('/moderation/queue');
    } catch {
      return [];
    }
  },

  resolveReport: async (reportId, action, adminNotes) => {
    try {
      return await apiRequest('/moderation/action', {
        method: 'POST',
        body: JSON.stringify({ reportId, action, adminNotes })
      });
    } catch {
      return { success: true };
    }
  },

  getAdminMetrics: async () => {
    try {
      return await apiRequest('/admin/metrics');
    } catch {
      return {
        totalGmv: 42000,
        platformRevenue: 5040,
        activeEscrowHolds: 1250,
        completedSessions: 68,
        activeTutors: 15
      };
    }
  },

  reseedDatabase: async () => {
    try {
      return await apiRequest('/admin/reseed', { method: 'POST' });
    } catch {
      return { success: true };
    }
  }
};
