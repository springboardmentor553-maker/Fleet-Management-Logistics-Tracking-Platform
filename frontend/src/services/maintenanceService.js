import {
    getMaintenance,
    getMaintenanceById,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance,
} from "../api/maintenanceApi";

// Get all maintenance
export const getAllMaintenance = async () => {
    const response = await getMaintenance();
    return response.data;
};

// Get maintenance by ID
export const getMaintenanceRecord = async (id) => {
    const response = await getMaintenanceById(id);
    return response.data;
};

// Create maintenance
export const addMaintenance = async (data) => {
    const response = await createMaintenance(data);
    return response.data;
};

// Update maintenance
export const editMaintenance = async (id, data) => {
    const response = await updateMaintenance(id, data);
    return response.data;
};

// Delete (Archive) maintenance
export const removeMaintenance = async (id) => {
    const response = await deleteMaintenance(id);
    return response.data;
};