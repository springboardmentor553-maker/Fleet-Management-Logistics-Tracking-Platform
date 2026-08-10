import api from "./api";

export const getFuelRecords = async () => {
  const response = await api.get("/fuel-records/");
  return response.data;
};

export const getFuelRecordById = async (id) => {
  const response = await api.get(`/fuel-records/${id}`);
  return response.data;
};

export const createFuelRecord = async (data) => {
  const response = await api.post("/fuel-records/", data);
  return response.data;
};

export const updateFuelRecord = async (id, data) => {
  const response = await api.put(`/fuel-records/${id}`, data);
  return response.data;
};

export const deleteFuelRecord = async (id) => {
  const response = await api.delete(`/fuel-records/${id}`);
  return response.data;
};
