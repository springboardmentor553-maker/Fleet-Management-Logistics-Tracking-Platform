import { client } from "./client";

export const trackingApi = {
  ping: (payload) => client.post("/tracking/ping", payload),
  history: (shipmentId) => client.get(`/tracking/shipment/${shipmentId}/history`),
  latest: (shipmentId) => client.get(`/tracking/shipment/${shipmentId}/latest`),
};
