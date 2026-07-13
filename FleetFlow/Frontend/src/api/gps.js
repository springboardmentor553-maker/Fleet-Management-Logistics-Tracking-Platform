import api from './axios'

export const getVehicleLocations = () =>
  api.get('/gps/vehicles/locations').then(r => r.data)

export const updateVehicleLocation = (vehicleId, lat, lng) =>
  api.patch(`/gps/vehicles/${vehicleId}/location`, { latitude: lat, longitude: lng }).then(r => r.data)
