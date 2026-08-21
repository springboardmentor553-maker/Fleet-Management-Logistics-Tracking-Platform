import API from "./api";

export const getVehicles = async () => {
  const response = await API.get("/vehicles/");
  return response.data;
};

export const getVehicle = async (id) => {
  const response = await API.get(`/vehicles/${id}`);
  return response.data;
};

export const addVehicle = async (vehicleData) => {
  const response = await API.post("/vehicles/", vehicleData);
  return response.data;
};

export const updateVehicle = async (id, vehicleData) => {
  const response = await API.put(`/vehicles/${id}`, vehicleData);
  return response.data;
};

export const deleteVehicle = async (id) => {
  const response = await API.delete(`/vehicles/${id}`);
  return response.data;
};

export const getFleetSummary = async () => {
  const response = await API.get("/vehicles/summary/fleet");
  return response.data;
};