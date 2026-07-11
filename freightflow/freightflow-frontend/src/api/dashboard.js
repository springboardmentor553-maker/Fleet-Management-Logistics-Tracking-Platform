import { client } from "./client";

export const dashboardApi = {
  summary: () => client.get("/dashboard/summary"),
};
