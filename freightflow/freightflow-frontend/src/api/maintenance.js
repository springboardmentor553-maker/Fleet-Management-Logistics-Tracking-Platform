import { client } from "./client";

export const maintenanceApi = {
  list: (params) => client.get("/maintenance", { params }),
  create: (payload) => client.post("/maintenance", payload),
  update: (id, payload) => client.patch(`/maintenance/${id}`, payload),
  close: (id) => client.post(`/maintenance/${id}/close`),
};
