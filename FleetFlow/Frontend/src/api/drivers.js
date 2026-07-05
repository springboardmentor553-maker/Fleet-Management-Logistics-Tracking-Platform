import api from './axios'

export const getDrivers   = ()         => api.get('/drivers/').then((r) => r.data)
export const getDriver    = (id)       => api.get(`/drivers/${id}`).then((r) => r.data)
export const createDriver = (data)     => api.post('/drivers/', data).then((r) => r.data)
export const updateDriver = (id, data) => api.put(`/drivers/${id}`, data).then((r) => r.data)
export const deleteDriver = (id)       => api.delete(`/drivers/${id}`)
