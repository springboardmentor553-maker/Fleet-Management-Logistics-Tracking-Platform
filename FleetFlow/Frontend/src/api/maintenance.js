import api from './axios'

export const getMaintenanceRecords = (params = {}) =>
  api.get('/maintenance/', { params }).then((r) => r.data)

export const scheduleMaintenance = (data) =>
  api.post('/maintenance/', data).then((r) => r.data)

export const updateMaintenanceRecord = (id, data) =>
  api.patch(`/maintenance/${id}`, data).then((r) => r.data)

export const deleteMaintenanceRecord = (id) =>
  api.delete(`/maintenance/${id}`)

export const getVehicleHealthReports = () =>
  api.get('/maintenance/health-reports').then((r) => r.data)

export const startMaintenance = (id) =>
  api.patch(`/maintenance/${id}/start`).then((r) => r.data);

export const completeMaintenance = (id) =>
  api.patch(`/maintenance/${id}/complete`).then((r) => r.data);

export const getUpcomingMaintenance = () =>
  api.get("/maintenance/upcoming").then((r) => r.data);

export const getOverdueMaintenance = () =>
  api.get("/maintenance/overdue").then((r) => r.data);