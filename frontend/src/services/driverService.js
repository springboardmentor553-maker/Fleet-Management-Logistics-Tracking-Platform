import axios from "axios";

const API = "http://127.0.0.1:8000/drivers";

const getHeaders = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
    }
});

export const getDrivers = async () => {
    const response = await axios.get(API, getHeaders());
    return response.data;
};

export const addDriver = async (driver) => {
    const response = await axios.post(API + "/", driver, getHeaders());
    return response.data;
};

export const updateDriver = async (id, driver) => {
    const response = await axios.put(
        `${API}/${id}`,
        driver,
        getHeaders()
    );
    return response.data;
};

export const deleteDriver = async (id) => {
    const response = await axios.delete(
        `${API}/${id}`,
        getHeaders()
    );
    return response.data;
};