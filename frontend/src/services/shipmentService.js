import axios from "axios";

const API = "http://127.0.0.1:8000/shipments";

const getHeaders = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
    }
});

export const getShipments = async () => {
    const response = await axios.get(API + "/", getHeaders());
    return response.data;
};

export const addShipment = async (shipment) => {
    const response = await axios.post(
        API + "/",
        shipment,
        getHeaders()
    );
    return response.data;
};

export const updateShipment = async (id, shipment) => {
    const response = await axios.put(
        `${API}/${id}`,
        shipment,
        getHeaders()
    );
    return response.data;
};

export const deleteShipment = async (id) => {
    const response = await axios.delete(
        `${API}/${id}`,
        getHeaders()
    );
    return response.data;
};

export const trackShipment = async (trackingId) => {
    const response = await axios.get(
        `${API}/track/${trackingId}`,
        getHeaders()
    );
    return response.data;
};