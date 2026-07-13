import api from './axios'

export const getRouteEstimate = (shipmentId) =>
  api.get(`/route/estimate/${shipmentId}`).then((r) => r.data)
