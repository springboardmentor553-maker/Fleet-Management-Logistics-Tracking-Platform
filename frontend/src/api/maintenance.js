import api from './axios';

export const getMaintenanceRecords = async () => {
  const response = await api.get('/maintenance');
  return response.data;
};

export const getMaintenanceRecord = async (id) => {
  const response = await api.get(`/maintenance/${id}`);
  return response.data;
};

export const createMaintenanceRecord = async (maintenanceData) => {
  const response = await api.post('/maintenance', maintenanceData);
  return response.data;
};

export const updateMaintenanceRecord = async (id, maintenanceData) => {
  const response = await api.put(`/maintenance/${id}`, maintenanceData);
  return response.data;
};

export const deleteMaintenanceRecord = async (id) => {
  const response = await api.delete(`/maintenance/${id}`);
  return response.data;
};

export const getMaintenanceAlerts = async () => {
  const response = await api.get('/maintenance-alerts/');
  return response.data;
};

export const getMaintenanceSummary = async () => {
  const response = await api.get('/maintenance/summary');
  return response.data;
};

export const getMaintenanceReport = async () => {
  const response = await api.get('/reports/maintenance');
  return response.data;
};

export const getMaintenanceReportDetails = async () => {
  const response = await api.get('/maintenance/report');
  return response.data;
};

export const getVehicleMaintenanceHistory = async (vehicleId) => {
  const response = await api.get(`/vehicles/${vehicleId}/maintenance-history`);
  return response.data;
};
