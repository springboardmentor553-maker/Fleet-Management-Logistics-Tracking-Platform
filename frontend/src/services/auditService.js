import axios from "axios";

const API = "http://127.0.0.1:8000";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");

    return {
        Authorization: `Bearer ${token}`,
    };
};

export const getAuditLogs = async () => {
    const response = await axios.get(
        `${API}/audit-logs/`,
        {
            headers: getAuthHeaders(),
        }
    );

    return response.data;
};