import axios from "axios";
import { authHeader } from "./authService";

const API = "http://127.0.0.1:8000/vehicles";

// Get all vehicles
export const getVehicles = async () => {
  const response = await axios.get(API, {
    headers: authHeader(),
  });

  return response.data;
};

// Add vehicle
export const addVehicle = async (vehicleData) => {
  const response = await axios.post(API, vehicleData, {
    headers: authHeader(),
  });

  return response.data;
};

// Update vehicle
export const updateVehicle = async (id, vehicleData) => {
  const response = await axios.put(
    `${API}/${id}`,
    vehicleData,
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

// Delete vehicle
export const deleteVehicle = async (id) => {
  const response = await axios.delete(
    `${API}/${id}`,
    {
      headers: authHeader(),
    }
  );

  return response.data;
};