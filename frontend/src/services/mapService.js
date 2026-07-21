import axios from "axios";

const API = "http://127.0.0.1:8000/trips";

const getHeaders = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
    }
});

export const getTripLocations = async () => {
    const response = await axios.get(API + "/", getHeaders());
    return response.data;
};