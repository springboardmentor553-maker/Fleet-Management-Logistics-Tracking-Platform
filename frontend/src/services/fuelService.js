import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
});

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

// ==========================================
// GET ALL FUEL RECORDS
// ==========================================

export const getFuelRecords = async () => {
  const response = await API.get(
    "/fuel-records/",
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};


// ==========================================
// GET FUEL RECORD BY ID
// ==========================================

export const getFuelRecord = async (id) => {
  const response = await API.get(
    `/fuel-records/${id}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};


// ==========================================
// CREATE FUEL RECORD
// ==========================================

export const createFuelRecord = async (fuelData) => {
  const response = await API.post(
    "/fuel-records/",
    fuelData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};


// ==========================================
// UPDATE FUEL RECORD
// ==========================================

export const updateFuelRecord = async (
  id,
  fuelData
) => {
  const response = await API.put(
    `/fuel-records/${id}`,
    fuelData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};


// ==========================================
// DELETE FUEL RECORD
// ==========================================

export const deleteFuelRecord = async (id) => {
  const response = await API.delete(
    `/fuel-records/${id}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};
