import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear storage and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  refresh:  (token) => api.post('/auth/refresh', { refresh_token: token }),
  me:       () => api.get('/auth/me'),
}

// ── Vehicles ──────────────────────────────────────────────────
export const vehicleApi = {
  list:   ()           => api.get('/vehicles'),
  get:    (id)         => api.get(`/vehicles/${id}`),
  create: (data)       => api.post('/vehicles', data),
  update: (id, data)   => api.put(`/vehicles/${id}`, data),
  delete: (id)         => api.delete(`/vehicles/${id}`),
}

// ── Drivers ───────────────────────────────────────────────────
export const driverApi = {
  list:   ()         => api.get('/drivers'),
  get:    (id)       => api.get(`/drivers/${id}`),
  create: (data)     => api.post('/drivers', data),
  update: (id, data) => api.patch(`/drivers/${id}`, data),
  delete: (id)       => api.delete(`/drivers/${id}`),
}

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardApi = {
  summary: () => api.get('/dashboard'),
}

// ── Shipments ─────────────────────────────────────────────────
export const shipmentApi = {
  list:         ()           => api.get('/shipments'),
  get:          (id)         => api.get(`/shipments/${id}`),
  create:       (data)       => api.post('/shipments', data),
  update:       (id, data)   => api.put(`/shipments/${id}`, data),
  delete:       (id)         => api.delete(`/shipments/${id}`),
  trackByNumber:(num)        => api.get(`/shipments/${num}/status`),
}

// ── Trips ─────────────────────────────────────────────────────
export const tripApi = {
  list:   ()           => api.get('/trips'),
  get:    (id)         => api.get(`/trips/${id}`),
  create: (data)       => api.post('/trips', data),
  update: (id, data)   => api.put(`/trips/${id}`, data),
  delete: (id)         => api.delete(`/trips/${id}`),
  route:  (id)         => api.get(`/trips/${id}/route`),
  eta:    (id)         => api.get(`/trips/${id}/eta`),
}

// ── Tracking (WS helper) ──────────────────────────────────────
export const WS_BASE = 'ws://localhost:8000'
export const trackingWsUrl = (tripId) => `${WS_BASE}/ws/tracking/${tripId}`

export default api
