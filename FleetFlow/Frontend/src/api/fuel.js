import api from './axios'

export const getFuelRecords = () =>
  api.get('/fuel/').then((r) => r.data)

export const createFuelRecord = (data) =>
  api.post('/fuel/', data).then((r) => r.data)

export const updateFuelRecord = (id, data) =>
  api.put(`/fuel/${id}`, data).then((r) => r.data)

export const deleteFuelRecord = (id) =>
  api.delete(`/fuel/${id}`)

export const getFuelAnalytics = () =>
  api.get('/analytics/fuel').then((r) => r.data)
