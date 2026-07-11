import { client } from "./client";

export const usersApi = {
  list: (params) => client.get("/accounts", { params }),
  create: (payload) => client.post("/accounts", payload),
  update: (id, payload) => client.patch(`/accounts/${id}`, payload),
  deactivate: (id) => client.delete(`/accounts/${id}`),
};
