import API from "../api/axios";

// ==========================================
// Get all vehicles
// ==========================================

export const getVehicles = async () => {

    const response = await API.get("/vehicles/");

    return response.data;
};


// ==========================================
// Get single vehicle
// ==========================================

export const getVehicle = async (vehicleId) => {

    const response = await API.get(
        `/vehicles/${vehicleId}`
    );

    return response.data;
};


// ==========================================
// Add vehicle
// ==========================================

export const addVehicle = async (vehicleData) => {

    const response = await API.post(
        "/vehicles/",
        vehicleData
    );

    return response.data;
};


// ==========================================
// Update vehicle
// ==========================================

export const updateVehicle = async (
    vehicleId,
    vehicleData
) => {

    const response = await API.put(
        `/vehicles/${vehicleId}`,
        vehicleData
    );

    return response.data;
};


// ==========================================
// Delete vehicle
// ==========================================

export const deleteVehicle = async (vehicleId) => {

    const response = await API.delete(
        `/vehicles/${vehicleId}`
    );

    return response.data;
};