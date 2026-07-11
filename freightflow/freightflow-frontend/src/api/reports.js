import { client } from "./client";

export const reportsApi = {
  fleetUtilization: (params) => client.get("/reports/fleet-utilization", { params }),
  deliveryPerformance: (params) => client.get("/reports/delivery-performance", { params }),
};
