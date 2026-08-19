import api from "../api/axios";

export const getRoute = (tripId) => {
  return api.get(`/trip/${tripId}/route`);
};