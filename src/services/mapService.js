import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// ===========================================
// Geocode Location
// ===========================================

export const geocodeLocation = async (location) => {
  try {
    const response = await API.post("/map/geocode", {
      location: location.trim(),
    });

    return response.data;
  } catch (error) {
    console.error("Geocoding Error:", error);

    throw error;
  }
};

// ===========================================
// Generate Route
// ===========================================

export const generateRoute = async (
  pickupLatitude,
  pickupLongitude,
 destinationLatitude,
  destinationLongitude
) => {
  try {
    const response = await API.post("/map/route", {
      pickup_latitude: Number(pickupLatitude),
      pickup_longitude: Number(pickupLongitude),
      destination_latitude: Number(destinationLatitude),
      destination_longitude: Number(destinationLongitude),
    });

    return response.data;
  } catch (error) {
    console.error("Route Error:", error);

    throw error;
  }
};