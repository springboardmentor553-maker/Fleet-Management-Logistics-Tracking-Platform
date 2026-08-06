import api from './axios'

/* ── Notifications ──────────────────────────────────── */
export const getNotifications = (params = {}) =>
  api.get('/notifications/', { params }).then(r => r.data)

export const getNotificationSummary = () =>
  api.get('/notifications/summary').then(r => r.data)

export const createNotification = (data) =>
  api.post('/notifications/', data).then(r => r.data)

export const markRead = (id) =>
  api.patch(`/notifications/${id}/read`).then(r => r.data)

export const markAllRead = () =>
  api.patch('/notifications/read-all/bulk').then(r => r.data)

export const deleteNotification = (id) =>
  api.delete(`/notifications/${id}`).then(r => r.data)

export const clearAllNotifications = () =>
  api.delete('/notifications/clear/all').then(r => r.data)
