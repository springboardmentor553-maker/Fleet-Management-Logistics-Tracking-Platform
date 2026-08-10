import api from "./api";

export const getFuelAnalytics = async () => {
  const response = await api.get("/analytics/fuel");
  return response.data;
};

export const getOperationsAnalytics = async () => {
  const response = await api.get("/analytics/operations");
  return response.data;
};

export const getMaintenanceReport = async () => {
  const response = await api.get("/reports/maintenance");
  return response.data;
};

export const getMaintenanceAlerts = async () => {
  const response = await api.get("/maintenance-alerts/");
  return response.data;
};

export const createMaintenanceAlert = async (data) => {
  const response = await api.post("/maintenance-alerts/", data);
  return response.data;
};

export const updateMaintenanceAlert = async (id, data) => {
  const response = await api.put(`/maintenance-alerts/${id}`, data);
  return response.data;
};

export const deleteMaintenanceAlert = async (id) => {
  const response = await api.delete(`/maintenance-alerts/${id}`);
  return response.data;
};
