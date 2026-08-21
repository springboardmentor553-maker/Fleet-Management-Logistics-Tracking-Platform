import API from "./api";

// Detailed Fleet Operations Dashboard
export const getDashboard = async () => {
  const response = await API.get("/dashboard/fleet");
  return response.data;
};

// Fleet Summary
export const getFleetSummary = async () => {
  const response = await API.get("/vehicles/summary/fleet");
  return response.data;
};