import { client } from "./client";

export const vehiclesApi = {
  list: (params) => client.get("/vehicles", { params }),
  get: (id) => client.get(`/vehicles/${id}`),
  create: (payload) => client.post("/vehicles", payload),
  update: (id, payload) => client.patch(`/vehicles/${id}`, payload),
  remove: (id) => client.delete(`/vehicles/${id}`),
};
