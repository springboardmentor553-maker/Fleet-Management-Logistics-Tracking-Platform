import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

// GET ALL MAINTENANCE RECORDS
export const getMaintenance = async () => {
  const response = await API.get("/maintenance/", {
    headers: getAuthHeaders(),
  });

  return response.data;
};

// GET ONE MAINTENANCE RECORD
export const getMaintenanceById = async (id) => {
  const response = await API.get(`/maintenance/${id}`, {
    headers: getAuthHeaders(),
  });

  return response.data;
};

// CREATE MAINTENANCE RECORD
export const createMaintenance = async (maintenanceData) => {
  const response = await API.post(
    "/maintenance/",
    maintenanceData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// UPDATE MAINTENANCE RECORD
export const updateMaintenance = async (
  id,
  maintenanceData
) => {
  const response = await API.put(
    `/maintenance/${id}`,
    maintenanceData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};