import API from "../api/axios";


// =====================================================
// GET FUEL ANALYTICS
// =====================================================

export const getFuelAnalytics = async () => {

    const response = await API.get("/fuel/analytics");

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