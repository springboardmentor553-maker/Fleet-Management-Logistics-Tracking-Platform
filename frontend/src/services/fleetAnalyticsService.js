import axios from "axios";

const API = "http://127.0.0.1:8000";

const token = () => localStorage.getItem("token");

export const getFleetAnalytics = async () => {

    const response = await axios.get(
        `${API}/analytics/dashboard`,
        {
            headers: {
                Authorization: `Bearer ${token()}`
            }
        }
    );

    return response.data;

};