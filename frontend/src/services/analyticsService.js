import API from "../api/axios";

// Dashboard Analytics
export const getFleetAnalytics = async () => {
    const response = await API.get("/analytics/dashboard");
    return response.data;
};