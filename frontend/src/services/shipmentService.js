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
// GET ALL SHIPMENTS
// ==========================================

export const getShipments = async () => {
  const response = await API.get("/shipments/", {
    headers: getAuthHeaders(),
  });

  return response.data;
};


// ==========================================
// CREATE SHIPMENT
// ==========================================

export const createShipment = async (shipmentData) => {
  const response = await API.post(
    "/shipments/",
    shipmentData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};


// ==========================================
// UPDATE SHIPMENT
// ==========================================

export const updateShipment = async (
  id,
  shipmentData
) => {
  const response = await API.put(
    `/shipments/${id}`,
    shipmentData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};


// ==========================================
// DELETE SHIPMENT
// ==========================================

export const deleteShipment = async (id) => {
  const response = await API.delete(
    `/shipments/${id}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};


// ==========================================
// TASK 4
// SHIPMENT TRACKING API
// ==========================================

export const getShipmentStatus = async (
  trackingNumber
) => {
  const response = await API.get(
    `/shipments/${trackingNumber}/status`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};


// ==========================================
// TASK 3
// ETA API
// ==========================================

export const getTripETA = async (tripId) => {
  const response = await API.get(
    `/trip/${tripId}/eta`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};
