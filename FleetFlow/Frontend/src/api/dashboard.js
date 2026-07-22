import api from './axios'

export const getDashboardStats = () =>
  api.get('/dashboard/stats').then((r) => r.data)

export const getAdminDashboardStats = () =>
  api.get('/dashboard/admin').then((r) => r.data)

export const getFleetManagerDashboardStats = () =>
  api.get('/dashboard/fleet-manager').then((r) => r.data)

export const getDispatcherDashboardStats = () =>
  api.get('/dashboard/dispatcher').then((r) => r.data)

export const getDriverDashboardStats = () =>
  api.get('/dashboard/driver').then((r) => r.data)

