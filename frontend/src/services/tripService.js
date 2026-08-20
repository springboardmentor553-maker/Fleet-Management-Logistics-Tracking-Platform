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

// Get all trips
export const getTrips = async () => {
  const response = await API.get("/trips/", {
    headers: getAuthHeaders(),
  });

  return response.data;
};

// Get one trip
export const getTrip = async (tripId) => {
  const response = await API.get(`/trips/${tripId}`, {
    headers: getAuthHeaders(),
  });

  return response.data;
};

// Get route information
export const getTripRoute = async (tripId) => {
  const response = await API.get(
    `/trips/${tripId}/route`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};