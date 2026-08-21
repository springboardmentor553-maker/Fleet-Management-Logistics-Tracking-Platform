import API from "../api/axios";

// =====================================================
// GET ALL FUEL RECORDS
// =====================================================

export const getAllFuel = async () => {
    const response = await API.get("/fuel/");
    return response.data;
};


// =====================================================
// ADD FUEL RECORD
// =====================================================

export const addFuel = async (data) => {
    const response = await API.post("/fuel/", data);
    return response.data;
};


// =====================================================
// DELETE FUEL RECORD
// =====================================================

export const deleteFuel = async (id) => {
    const response = await API.delete(`/fuel/${id}`);
    return response.data;
};


// =====================================================
// GET VEHICLE FUEL ANALYTICS
// =====================================================

export const getVehicleFuelAnalytics = async (vehicleId) => {
    const response = await API.get(
        `/fuel/vehicle/${vehicleId}`
    );

    return response.data;
};


// =====================================================
// GET OVERALL FUEL ANALYTICS
// =====================================================

export const getFuelAnalytics = async () => {
    const response = await API.get("/fuel/analytics");

    return response.data;
};