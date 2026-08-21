import axios from "axios";

// ============================================================
// API URL
// ============================================================

const API = "http://127.0.0.1:8000/dashboard";

// ============================================================
// AUTHORIZATION HEADER
// ============================================================

const getHeaders = () => {
    const token = localStorage.getItem("token");

    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

// ============================================================
// DASHBOARD SUMMARY
// ============================================================

export const getDashboardSummary = async () => {
    const response = await axios.get(
        API + "/",
        getHeaders()
    );

    return response.data;
};

// ============================================================
// DASHBOARD ANALYTICS
// ============================================================

export const getDashboardAnalytics = async () => {
    const response = await axios.get(
        API + "/analytics",
        getHeaders()
    );

    return response.data;
};

// ============================================================
// DETAILED STATISTICS
// ============================================================

export const getDashboardStatistics = async () => {
    const response = await axios.get(
        API + "/statistics",
        getHeaders()
    );

    return response.data;
};