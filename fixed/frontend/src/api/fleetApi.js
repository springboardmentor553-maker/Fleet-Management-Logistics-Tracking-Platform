import { api } from "./client.js";

// Vehicles Service
export const vehiclesApi = {
  getAll: () => api.get("/vehicles/"),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post("/vehicles/", data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

// Drivers Service
export const driversApi = {
  getAll: () => api.get("/drivers/"),
  getById: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post("/drivers/", data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
};

// Routes Service
export const routesApi = {
  getAll: () => api.get("/routes/"),
  getById: (id) => api.get(`/routes/${id}`),
  create: (data) => api.post("/routes/", data),
  update: (id, data) => api.put(`/routes/${id}`, data),
  delete: (id) => api.delete(`/routes/${id}`),
};

// Shipments Service
export const shipmentsApi = {
  getAll: () => api.get("/shipments/"),
  getById: (id) => api.get(`/shipments/${id}`),
  create: (data) => api.post("/shipments/", data),
  update: (id, data) => api.put(`/shipments/${id}`, data),
  delete: (id) => api.delete(`/shipments/${id}`),
  track: (trackingNumber) => api.get(`/shipments/tracking/${trackingNumber}/status`),
};

// Maintenance Service
export const maintenanceApi = {
  getAll: () => api.get("/maintenance/"),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post("/maintenance/", data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
  getAlerts: () => api.get("/maintenance-alerts/"),
};

// Fuel Service
export const fuelApi = {
  getAll: () => api.get("/fuel/"),
  getById: (id) => api.get(`/fuel/${id}`),
  create: (data) => api.post("/fuel/", data),
  update: (id, data) => api.put(`/fuel/${id}`, data),
  delete: (id) => api.delete(`/fuel/${id}`),
};

// Trips Service
export const tripsApi = {
  getAll: () => api.get("/trips/"),
  getById: (id) => api.get(`/trips/${id}`),
  create: (data) => api.post("/trips/", data),
  update: (id, data) => api.put(`/trips/${id}`, data),
  delete: (id) => api.delete(`/trips/${id}`),
};

// Users Service
export const usersApi = {
  getAll: () => api.get("/users/"),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users/", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Notifications Service
export const notificationsApi = {
  getAll: () => api.get("/notifications/"),
  create: (data) => api.post("/notifications/", data),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Dashboard & Analytics Service
export const dashboardApi = {
  getSummary: () => api.get("/dashboard/summary"),
  getReport: () => api.get("/reports/operations"),
  getAnalyticsKPIs: () => api.get("/analytics/kpis"),
};

// Auth Service
export const authApi = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
};

