import axios from "axios";

const API = "http://127.0.0.1:8000/trips";

const getHeaders = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
    }
});

export const getTrips = async () => {
    const response = await axios.get(`${API}/`, getHeaders());
    return response.data;
};

export const addTrip = async (trip) => {
    const response = await axios.post(`${API}/`, trip, getHeaders());
    return response.data;
};

export const deleteTrip = async (id) => {
    const response = await axios.delete(`${API}/${id}`, getHeaders());
    return response.data;
};

export const getTripTracking = async (id) => {
    const response = await axios.get(`${API}/${id}/tracking`, getHeaders());
    return response.data;
};

export const getTripETA = async (id) => {
    const response = await axios.get(`${API}/${id}/eta`, getHeaders());
    return response.data;
};

export const getTripRoute = async (id) => {
    const response = await axios.get(`${API}/${id}/route`, getHeaders());
    return response.data;
};