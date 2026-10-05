const API_ORIGIN = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
const BASE_URL = `${API_ORIGIN}/api`;

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

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Network request failed');
  }

  return data;
}

export const api = {
  // Auth
  getDemoPersonas: () => apiRequest('/auth/demo-personas'),
  switchPersona: (userId) => apiRequest('/auth/switch-persona', {
    method: 'POST',
    body: JSON.stringify({ userId })
  }),
  loginSSO: (email, name, role) => apiRequest('/auth/sso', {
    method: 'POST',
    body: JSON.stringify({ email, name, role })
  }),
  getMe: () => apiRequest('/auth/me'),

  // Tutors & Subjects
  getTutors: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/tutors?${query}`);
  },
  getTutorById: (id) => apiRequest(`/tutors/${id}`),
  updateTutorSettings: (id, settings) => apiRequest(`/tutors/${id}/settings`, {
    method: 'PUT',
    body: JSON.stringify(settings)
  }),
  addSlot: (tutorId, slot) => apiRequest(`/tutors/${tutorId}/slots`, {
    method: 'POST',
    body: JSON.stringify(slot)
  }),
  getSubjects: () => apiRequest('/tutors/meta/subjects'),

  // Bookings & State Machine
  createBooking: (bookingData) => apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData)
  }),
  getBookings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/bookings?${query}`);
  },
  getBookingById: (id) => apiRequest(`/bookings/${id}`),
  transitionBooking: (id, nextState, actorId, reason) => apiRequest(`/bookings/${id}/transition`, {
    method: 'POST',
    body: JSON.stringify({ nextState, actorId, reason })
  }),
  confirmBookingParty: (id, actorRole, actorId) => apiRequest(`/bookings/${id}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ actorRole, actorId })
  }),
  claimGuaranteeRefund: (id, studentId, reason) => apiRequest(`/bookings/${id}/guarantee-refund`, {
    method: 'POST',
    body: JSON.stringify({ studentId, reason })
  }),

  // Escrow
  getEscrowLedger: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/escrow/ledger?${query}`);
  },
  getEscrowSummary: () => apiRequest('/escrow/summary'),
  previewSplit: (amount) => apiRequest(`/escrow/preview-split?amount=${amount}`),

  // Reviews
  submitReview: (reviewData) => apiRequest('/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData)
  }),
  getTutorReviews: (tutorId) => apiRequest(`/reviews/tutor/${tutorId}`),

  // Chat
  getChatMessages: (bookingId) => apiRequest(`/chat/${bookingId}`),
  sendChatMessage: (bookingId, payload) => apiRequest(`/chat/${bookingId}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Moderation & Admin
  reportUser: (reportData) => apiRequest('/moderation/report', {
    method: 'POST',
    body: JSON.stringify(reportData)
  }),
  getModerationQueue: () => apiRequest('/moderation/queue'),
  resolveReport: (reportId, action, adminNotes) => apiRequest('/moderation/action', {
    method: 'POST',
    body: JSON.stringify({ reportId, action, adminNotes })
  }),
  getAdminMetrics: () => apiRequest('/admin/metrics'),
  reseedDatabase: () => apiRequest('/admin/reseed', { method: 'POST' })
};
