import api from "../api/axios";


export const getShipments = ()=>{

    return api.get("/shipments");

}



export const createShipment=(data)=>{

    return api.post(
        "/shipments",
        data
    );

}



export const updateShipment=(id,data)=>{

    return api.put(
        `/shipments/${id}`,
        data
    );

}



export const deleteShipment=(id)=>{

    return api.delete(
        `/shipments/${id}`
    );

}


export const updateShipmentStatus = (shipmentId, status) => {
  return api.put(`/shipments/${shipmentId}/status`, {
    status,
  });
};