import api from './axios';

export const getMaintenanceAlerts = async (skip = 0, limit = 100) => {
  const response = await api.get(`/maintenance-alerts/?skip=${skip}&limit=${limit}`);
  return response.data;
};

export const getMaintenanceAlertById = async (id) => {
  const response = await api.get(`/maintenance-alerts/${id}`);
  return response.data;
};

export const createMaintenanceAlert = async (alertData) => {
  const response = await api.post('/maintenance-alerts/', alertData);
  return response.data;
};

export const updateMaintenanceAlert = async (id, alertData) => {
  const response = await api.put(`/maintenance-alerts/${id}`, alertData);
  return response.data;
};

export const deleteMaintenanceAlert = async (id) => {
  const response = await api.delete(`/maintenance-alerts/${id}`);
  return response.data;
};

export const getMaintenanceReport = async () => {
  const response = await api.get('/reports/maintenance');
  return response.data;
};
