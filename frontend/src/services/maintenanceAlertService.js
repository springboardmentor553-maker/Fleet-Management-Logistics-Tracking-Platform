import axios from "axios";

const API = "http://127.0.0.1:8000";

const token = () => localStorage.getItem("token");

export const getAlerts = async () => {
    const res = await axios.get(`${API}/maintenance-alerts`, {
        headers: {
            Authorization: `Bearer ${token()}`
        }
    });

    return res.data;
};

export const createAlert = async (data) => {
    const res = await axios.post(
        `${API}/maintenance-alerts`,
        data,
        {
            headers: {
                Authorization: `Bearer ${token()}`
            }
        }
    );

    return res.data;
};

export const updateAlert = async (id, data) => {
    const res = await axios.put(
        `${API}/maintenance-alerts/${id}`,
        data,
        {
            headers: {
                Authorization: `Bearer ${token()}`
            }
        }
    );

    return res.data;
};

export const deleteAlert = async (id) => {
    await axios.delete(
        `${API}/maintenance-alerts/${id}`,
        {
            headers: {
                Authorization: `Bearer ${token()}`
            }
        }
    );
};