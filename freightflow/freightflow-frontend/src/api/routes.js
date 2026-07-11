import { client } from "./client";

export const routesApi = {
  getForShipment: (shipmentId) => client.get(`/routes/shipment/${shipmentId}`),
  create: (payload) => client.post("/routes", payload),
  update: (id, payload) => client.patch(`/routes/${id}`, payload),
  remove: (id) => client.delete(`/routes/${id}`),
};
