import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ab_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Attach session ID for spam tracking / notifications
  const sessionId = localStorage.getItem('ab_session')
  if (sessionId) config.headers['x-session-id'] = sessionId
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('ab_token')) {
      localStorage.removeItem('ab_token')
      localStorage.removeItem('ab_user')
      window.location.href = '/dashboard/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  me: () => api.get('/auth/me'),
  createMember: (data) => api.post('/auth/members', data),
  getMembers: () => api.get('/auth/members'),
}

// ── Feedback ──────────────────────────────────────────────
export const feedbackAPI = {
  submit: (data) => api.post('/feedback', data),
  list: (params) => api.get('/feedback', { params }),
  getById: (id) => api.get(`/feedback/${id}`),

  // ✅ ADD THIS LINE
  trackById: (id) => api.get(`/feedback/track/${id}`),

  updateStatus: (id, status, note) => api.patch(`/feedback/${id}/status`, { status, note }),
  assign: (id, memberId) => api.patch(`/feedback/${id}/assign`, { memberId }),
  getNotifications: (sessionId) => api.get(`/feedback/notifications/${sessionId}`),
  markNotificationRead: (id) => api.post(`/feedback/notifications/${id}/read`),
}

// ── Notes ────────────────────────────────────────────────
export const notesAPI = {
  list: (feedbackId) => api.get(`/feedback/${feedbackId}/notes`),
  create: (feedbackId, content) => api.post(`/feedback/${feedbackId}/notes`, { content }),
  delete: (feedbackId, noteId) => api.delete(`/feedback/${feedbackId}/notes/${noteId}`),
}

// ── Teams ────────────────────────────────────────────────
export const teamsAPI = {
  list: () => api.get('/teams'),
  members: (teamId) => api.get(`/teams/${teamId}/members`),
  stats: () => api.get('/teams/stats/overview'),
}

export default api
