import api from "./api";

export const getShipments = async () => {
    const response = await api.get("/shipments/");
    return response.data;
};

export const getShipment = async (shipmentId) => {
    const response = await api.get(
        `/shipments/${shipmentId}`
    );

    return response.data;
};

export const trackShipment = async (trackingId) => {
    const response = await api.get(
        `/shipments/track/${trackingId}`
    );

    return response.data;
};

export const addShipment = async (shipmentData) => {
    const response = await api.post(
        "/shipments/",
        shipmentData
    );

    return response.data;
};

export const updateShipment = async (
    shipmentId,
    shipmentData
) => {
    const response = await api.put(
        `/shipments/${shipmentId}`,
        shipmentData
    );

    return response.data;
};

export const deleteShipment = async (shipmentId) => {
    const response = await api.delete(
        `/shipments/${shipmentId}`
    );

    return response.data;
};