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

// GET ALL MAINTENANCE ALERTS
export const getMaintenanceAlerts = async () => {
  const response = await API.get("/maintenance-alerts/", {
    headers: getAuthHeaders(),
  });

  return response.data;
};

// GET MAINTENANCE ALERT BY ID
export const getMaintenanceAlertById = async (id) => {
  const response = await API.get(`/maintenance-alerts/${id}`, {
    headers: getAuthHeaders(),
  });

  return response.data;
};

// CREATE MAINTENANCE ALERT
export const createMaintenanceAlert = async (alertData) => {
  const response = await API.post(
    "/maintenance-alerts/",
    alertData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// UPDATE MAINTENANCE ALERT STATUS
export const updateMaintenanceAlertStatus = async (
  id,
  alertStatus
) => {
  const response = await API.put(
    `/maintenance-alerts/${id}`,
    {
      alert_status: alertStatus,
    },
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// DELETE MAINTENANCE ALERT
export const deleteMaintenanceAlert = async (id) => {
  const response = await API.delete(
    `/maintenance-alerts/${id}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};
