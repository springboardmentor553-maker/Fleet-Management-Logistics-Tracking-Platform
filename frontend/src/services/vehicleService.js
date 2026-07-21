import axios from "axios";

const API = "http://127.0.0.1:8000/vehicles";

const getHeaders = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
    }
});

export const getVehicles = async () => {
    const response = await axios.get(API, getHeaders());
    return response.data;
};

export const addVehicle = async (vehicle) => {
    const response = await axios.post(API + "/", vehicle, getHeaders());
    return response.data;
};

export const updateVehicle = async (id, vehicle) => {
    const response = await axios.put(`${API}/${id}`, vehicle, getHeaders());
    return response.data;
};

export const deleteVehicle = async (id) => {
    const response = await axios.delete(`${API}/${id}`, getHeaders());
    return response.data;
};