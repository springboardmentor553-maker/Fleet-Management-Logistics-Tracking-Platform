import API from "./api";

// ==========================================
// GET ALL TRIPS
// ==========================================

export const getTrips = async () => {
  const response = await API.get("/trips/");
  return response.data;
};


// ==========================================
// GET SINGLE TRIP
// ==========================================

export const getTrip = async (tripId) => {
  const response = await API.get(
    `/trips/${tripId}`
  );

  return response.data;
};


// ==========================================
// CREATE TRIP
// ==========================================

export const createTrip = async (tripData) => {
  const response = await API.post(
    "/trips/",
    tripData
  );

  return response.data;
};


// ==========================================
// UPDATE TRIP
// ==========================================

export const updateTrip = async (
  tripId,
  tripData
) => {
  const response = await API.put(
    `/trips/${tripId}`,
    tripData
  );

  return response.data;
};


// ==========================================
// DELETE TRIP
// ==========================================

export const deleteTrip = async (tripId) => {
  const response = await API.delete(
    `/trips/${tripId}`
  );

  return response.data;
};


// ==========================================
// GET ROUTE INFORMATION
// ==========================================

export const getTripRoute = async (
  tripId,
  routeType = "fastest"
) => {
  const response = await API.get(
    `/trips/${tripId}/route`,
    {
      params: {
        route_type: routeType,
      },
    }
  );

  return response.data;
};


// ==========================================
// GET ETA INFORMATION
// ==========================================

export const getTripETA = async (tripId) => {
  const response = await API.get(
    `/trips/${tripId}/eta`
  );

  return response.data;
};