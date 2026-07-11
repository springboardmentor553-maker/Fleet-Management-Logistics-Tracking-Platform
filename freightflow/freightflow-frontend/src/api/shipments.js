import { client } from "./client";

export const shipmentsApi = {
  list: (params) => client.get("/shipments", { params }),
  get: (id) => client.get(`/shipments/${id}`),
  create: (payload) => client.post("/shipments", payload),
  update: (id, payload) => client.patch(`/shipments/${id}`, payload),
  assign: (id, payload) => client.post(`/shipments/${id}/assign`, payload),
  startTransit: (id) => client.post(`/shipments/${id}/start-transit`),
  deliver: (id) => client.post(`/shipments/${id}/deliver`),
  cancel: (id) => client.post(`/shipments/${id}/cancel`),
};
