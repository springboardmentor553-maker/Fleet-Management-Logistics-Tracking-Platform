import api from './axios'

export const getDrivers          = ()         => api.get('/drivers/').then((r) => r.data)
export const getDriver           = (id)       => api.get(`/drivers/${id}`).then((r) => r.data)
export const createDriver        = (data)     => api.post('/drivers/', data).then((r) => r.data)
export const updateDriver        = (id, data) => api.put(`/drivers/${id}`, data).then((r) => r.data)
export const deleteDriver        = (id)       => api.delete(`/drivers/${id}`)

export const getDriverAnalytics  = ()         => api.get('/drivers/manage/analytics').then((r) => r.data)
export const recordAttendance    = (id, data) => api.post(`/drivers/${id}/attendance`, data).then((r) => r.data)
export const getDriverAttendance = (id)       => api.get(`/drivers/${id}/attendance`).then((r) => r.data)
export const getDriverLogs       = (id)       => api.get(`/drivers/${id}/logs`).then((r) => r.data)
export const assignDriverVehicle = (id, vId)  => api.patch(`/drivers/${id}/assign-vehicle`, null, { params: { vehicle_id: vId } }).then((r) => r.data)
