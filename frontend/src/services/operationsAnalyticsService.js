import API from "../api/axios";


// ============================================================
// OPERATIONS ANALYTICS
// ============================================================

export const getOperationsAnalytics = async () => {

    const response = await API.get(
        "/analytics/operations"
    );

    return response.data;
};