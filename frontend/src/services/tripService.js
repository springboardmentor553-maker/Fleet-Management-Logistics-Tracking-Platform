import api from "./api";

// =====================================================
// GET ALL TRIPS
// =====================================================

export const getTrips = async () => {
    const response = await api.get("/trips/");
    return response.data;
};


// =====================================================
// GET TRIP BY ID
// =====================================================

export const getTrip = async (tripId) => {
    const response = await api.get(`/trips/${tripId}`);
    return response.data;
};


// =====================================================
// CREATE TRIP
// =====================================================

export const addTrip = async (tripData) => {
    const response = await api.post("/trips/", tripData);
    return response.data;
};


// =====================================================
// UPDATE TRIP
// =====================================================

export const updateTrip = async (tripId, tripData) => {
    const response = await api.put(
        `/trips/${tripId}`,
        tripData
    );

    return response.data;
};


// =====================================================
// DELETE TRIP
// =====================================================

export const deleteTrip = async (tripId) => {
    const response = await api.delete(
        `/trips/${tripId}`
    );

    return response.data;
};
// =====================================================
// UPDATE TRIP LOCATION
// =====================================================

export const updateTripLocation = async (
    tripId,
    latitude,
    longitude
) => {

    const response = await api.patch(
        `/trips/${tripId}/location`,
        {
            current_latitude: String(latitude),
            current_longitude: String(longitude)
        }
    );

    return response.data;
};