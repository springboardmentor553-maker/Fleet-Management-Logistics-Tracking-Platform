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

// ── Dashboard & Analytics ───────────────────────────────────────
export const dashboardApi = {
  summary: () => api.get('/dashboard'), // Legacy
  fleet:   (params) => api.get('/dashboard/fleet', { params }),
}

export const analyticsApi = {
  fuel:       (params) => api.get('/analytics/fuel', { params }),
  operations: (params) => api.get('/analytics/operations', { params }),
}

export const maintenanceAlertsApi = {
  list:   (params) => api.get('/maintenance-alerts', { params }),
  create: (data)   => api.post('/maintenance-alerts', data),
  update: (id, status) => api.put(`/maintenance-alerts/${id}`, { status }),
  delete: (id)     => api.delete(`/maintenance-alerts/${id}`),
}

export const reportsApi = {
  maintenance: () => api.get('/reports/maintenance'),
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

// ── Driver Assignments ────────────────────────────────────────
export const assignmentApi = {
  list:   (params)     => api.get('/driver-assignments', { params }),
  get:    (id)         => api.get(`/driver-assignments/${id}`),
  create: (data)       => api.post('/driver-assignments', data),
  update: (id, data)   => api.put(`/driver-assignments/${id}`, data),
  cancel: (id)         => api.delete(`/driver-assignments/${id}`),
}

// ── Driver Attendance ─────────────────────────────────────────
export const attendanceApi = {
  list:         (params) => api.get('/driver-attendance', { params }),
  get:          (id)     => api.get(`/driver-attendance/${id}`),
  create:       (data)   => api.post('/driver-attendance', data),
  update:       (id, data) => api.put(`/driver-attendance/${id}`, data),
  todaySummary: ()       => api.get('/driver-attendance/today-summary'),
}

// ── Driver Performance ────────────────────────────────────────
export const performanceApi = {
  get: (driverId) => api.get(`/drivers/${driverId}/performance`),
}

// ── Fuel Records ──────────────────────────────────────────────
export const fuelApi = {
  list:   (params)     => api.get('/fuel', { params }),
  get:    (id)         => api.get(`/fuel/${id}`),
  create: (data)       => api.post('/fuel', data),
  update: (id, data)   => api.put(`/fuel/${id}`, data),
  delete: (id)         => api.delete(`/fuel/${id}`),
}

// ── Maintenance ───────────────────────────────────────────────
export const maintenanceApi = {
  list:   (params)     => api.get('/maintenance', { params }),
  get:    (id)         => api.get(`/maintenance/${id}`),
  create: (data)       => api.post('/maintenance', data),
  update: (id, data)   => api.put(`/maintenance/${id}`, data),
  delete: (id)         => api.delete(`/maintenance/${id}`),
}

// ── Audit Logs ────────────────────────────────────────────────
export const auditApi = {
  list: (params) => api.get('/audit-logs', { params }),
}

export default api
