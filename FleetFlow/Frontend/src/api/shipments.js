import api from './axios'

export const getShipments  = ()       => api.get('/shipments/').then(r => r.data)
export const getShipment   = (id)     => api.get(`/shipments/${id}`).then(r => r.data)
export const createShipment = (data)  => api.post('/shipments/', data).then(r => r.data)
export const updateShipment = (id, d) => api.put(`/shipments/${id}`, d).then(r => r.data)
export const deleteShipment = (id)    => api.delete(`/shipments/${id}`)
export const assignShipment = (id, d) => api.patch(`/dispatcher/shipments/${id}/assign`, d).then(r => r.data)
export const cancelShipment = (id)    => api.patch(`/dispatcher/shipments/${id}/cancel`).then(r => r.data)
