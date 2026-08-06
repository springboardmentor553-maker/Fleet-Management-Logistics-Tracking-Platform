import api from './axios'

// Driver Assignments
export const getAssignments     = ()           => api.get('/driver-assignments/').then((r) => r.data)
export const createAssignment   = (data)       => api.post('/driver-assignments/', data).then((r) => r.data)
export const updateAssignment   = (id, data)   => api.put(`/driver-assignments/${id}`, data).then((r) => r.data)
export const deleteAssignment   = (id)         => api.delete(`/driver-assignments/${id}`)

// Driver Performance
export const getDriverPerformance = (driverId) => api.get(`/driver-assignments/performance/${driverId}`).then((r) => r.data)

// Operational Analytics
export const getOperationalAnalytics = () => api.get('/analytics/operations').then((r) => r.data)
