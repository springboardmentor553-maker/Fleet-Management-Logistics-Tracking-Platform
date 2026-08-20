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

// GET ALL DRIVERS
export const getDrivers = async () => {
  const response = await API.get("/drivers/", {
    headers: getAuthHeaders(),
  });

  return response.data;
};

// GET SINGLE DRIVER
export const getDriver = async (driverId) => {
  const response = await API.get(
    `/drivers/${driverId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// UPDATE DRIVER
export const updateDriver = async (
  driverId,
  driverData
) => {
  const response = await API.put(
    `/drivers/${driverId}`,
    driverData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// GET DRIVER PERFORMANCE
export const getDriverPerformance = async (
  driverId
) => {
  const response = await API.get(
    `/drivers/${driverId}/performance`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};