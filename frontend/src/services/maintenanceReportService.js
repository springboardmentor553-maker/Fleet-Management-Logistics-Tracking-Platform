import axios from "axios";

const API = "http://127.0.0.1:8000";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
    headers: {
        Authorization: `Bearer ${getToken()}`
    }
});

// Get maintenance summary
export const getMaintenanceReport = async () => {
    const response = await axios.get(
        `${API}/maintenance/reports`,
        authHeaders()
    );

    return response.data;
};

// Get all maintenance records
export const getMaintenanceRecords = async () => {
    const response = await axios.get(
        `${API}/maintenance/`,
        authHeaders()
    );

    return response.data;
};

// Get upcoming maintenance
export const getUpcomingMaintenance = async () => {
    const response = await axios.get(
        `${API}/maintenance/upcoming`,
        authHeaders()
    );

    return response.data;
};

// Get overdue maintenance
export const getOverdueMaintenance = async () => {
    const response = await axios.get(
        `${API}/maintenance/overdue`,
        authHeaders()
    );

    return response.data;
};