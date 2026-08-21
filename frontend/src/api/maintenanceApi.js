import axios from "./axios";

// Get all maintenance
export const getMaintenance = () =>
    axios.get("/maintenance/");

// Get maintenance by ID
export const getMaintenanceById = (id) =>
    axios.get(`/maintenance/${id}`);

// Create maintenance
export const createMaintenance = (data) =>
    axios.post("/maintenance/", data);

// Update maintenance
export const updateMaintenance = (id, data) =>
    axios.put(`/maintenance/${id}`, data);

// Delete (Soft Delete)
export const deleteMaintenance = (id) =>
    axios.delete(`/maintenance/${id}`);