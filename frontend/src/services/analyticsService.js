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

export const getFuelAnalytics = async () => {
  const response = await API.get("/analytics/fuel", {
    headers: getAuthHeaders(),
  });

  return response.data;
};

export const getOperationsAnalytics = async () => {
  const response = await API.get("/analytics/operations", {
    headers: getAuthHeaders(),
  });

  return response.data;
};
