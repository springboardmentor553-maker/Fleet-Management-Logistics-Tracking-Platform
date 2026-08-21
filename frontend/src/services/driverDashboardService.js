import API from "./api";


// ============================================================
// GET DRIVER DASHBOARD
// ============================================================

export const getDriverDashboard = async () => {
  const response = await API.get(
    "/driver-dashboard/"
  );

  return response.data;
};