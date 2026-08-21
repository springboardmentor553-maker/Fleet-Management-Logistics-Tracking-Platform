import axios from "axios";

const API = "http://127.0.0.1:8000";

const getToken = () => localStorage.getItem("token");

export const getAttendance = async () => {
    const response = await axios.get(`${API}/driver-attendance/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    return response.data;
};

export const createAttendance = async (attendance) => {
    const response = await axios.post(
        `${API}/driver-attendance/`,
        attendance,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );

    return response.data;
};

export const deleteAttendance = async (id) => {
    const response = await axios.delete(
        `${API}/driver-attendance/${id}`,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );

    return response.data;
};