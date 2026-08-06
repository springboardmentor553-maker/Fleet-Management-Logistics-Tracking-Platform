import api from './axios'

/* ── Maintenance Alerts ─────────────────────────────── */
export const getAlerts = (params = {}) =>
  api.get('/maintenance-alerts/', { params }).then((r) => r.data)

export const getAlertById = (id) =>
  api.get(`/maintenance-alerts/${id}`).then((r) => r.data)

export const createAlert = (data) =>
  api.post('/maintenance-alerts/', data).then((r) => r.data)

export const updateAlertStatus = (id, data) =>
  api.patch(`/maintenance-alerts/${id}`, data).then((r) => r.data)

export const deleteAlert = (id) =>
  api.delete(`/maintenance-alerts/${id}`).then((r) => r.data)

/* ── Maintenance Reports ────────────────────────────── */
export const getMaintenanceReport = () =>
  api.get('/reports/maintenance').then((r) => r.data)
