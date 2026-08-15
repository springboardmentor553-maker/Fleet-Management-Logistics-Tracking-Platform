import api from './axios';

export const getAnalyticsOverview = async () => {
  const response = await api.get('/analytics/overview');
  return response.data;
};

export const getDriverAnalytics = async () => {
  const response = await api.get('/analytics/drivers');
  return response.data;
};

export const getVehicleAnalytics = async () => {
  const response = await api.get('/analytics/vehicles');
  return response.data;
};

export const getShipmentAnalytics = async () => {
  const response = await api.get('/analytics/shipments');
  return response.data;
};

export const getTripAnalytics = async () => {
  const response = await api.get('/analytics/trips');
  return response.data;
};
