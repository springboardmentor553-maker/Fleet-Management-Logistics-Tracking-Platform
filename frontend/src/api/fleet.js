import api from './axios';

export const getFleetPerformance = async () => {
  const response = await api.get('/fleet/performance');
  return response.data;
};

export const getFleetSummary = async () => {
  const response = await api.get('/fleet/summary');
  return response.data;
};

export const getFleetCharts = async () => {
  const response = await api.get('/fleet/charts');
  return response.data;
};
