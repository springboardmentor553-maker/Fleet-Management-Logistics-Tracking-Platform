import api from './axios'

export const getTrips = () => api.get('/trips/').then((r) => r.data)
export const getTrip = (id) => api.get(`/trips/${id}`).then((r) => r.data)
export const updateTripStatus = (id, status) => api.patch(`/trips/${id}/status`, { status }).then((r) => r.data)
export const deleteTrip = (id) => api.delete(`/trips/${id}`)
