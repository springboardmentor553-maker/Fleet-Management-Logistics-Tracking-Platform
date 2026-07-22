import api from './axios'

export const getRouteEstimate = (shipmentId) =>
  api.get(`/route/estimate/${shipmentId}`).then((r) => r.data)

export const getRouteVariants = (payload) =>
  api.post('/route/variants', payload).then((r) => r.data)
