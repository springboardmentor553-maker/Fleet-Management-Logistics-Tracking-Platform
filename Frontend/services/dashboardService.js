import axios from "axios";

const API = "https://fleetflow-backend-90o5.onrender.com";

export const getDashboard = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `${API}/dashboard`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};