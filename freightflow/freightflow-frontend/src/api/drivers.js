import { client } from "./client";

export const driversApi = {
  list: (params) => client.get("/drivers", { params }),
  get: (id) => client.get(`/drivers/${id}`),
  create: (payload) => client.post("/drivers", payload),
  update: (id, payload) => client.patch(`/drivers/${id}`, payload),
  remove: (id) => client.delete(`/drivers/${id}`),
};
