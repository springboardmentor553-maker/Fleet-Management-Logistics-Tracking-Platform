import API from "../api/axios";

// ==========================================
// GET ALL DRIVERS
// ==========================================

export const getDrivers = async () => {
    const response = await API.get("/drivers/");
    return response.data;
};

// ==========================================
// GET DRIVER BY ID
// ==========================================

export const getDriver = async (driverId) => {
    const response = await API.get(`/drivers/${driverId}`);
    return response.data;
};

// ==========================================
// ADD DRIVER
// ==========================================

export const addDriver = async (driverData) => {
    const response = await API.post(
        "/drivers/",
        driverData
    );

    return response.data;
};

// ==========================================
// UPDATE DRIVER
// ==========================================

export const updateDriver = async (
    driverId,
    driverData
) => {
    const response = await API.put(
        `/drivers/${driverId}`,
        driverData
    );

    return response.data;
};

// ==========================================
// DELETE DRIVER
// ==========================================

export const deleteDriver = async (driverId) => {
    const response = await API.delete(
        `/drivers/${driverId}`
    );

    return response.data;
};