import client from "./client";

export const getDrivers = () => client.get("/drivers/");
export const getDriver = (id) => client.get(`/drivers/${id}`);
export const getDriverPerformance = (id) => client.get(`/drivers/${id}/performance`);
export const createDriver = (data) => client.post("/drivers/", data);
export const updateDriver = (id, data) => client.put(`/drivers/${id}`, data);

export const getVehicles = () => client.get("/vehicles/");
export const createVehicle = (data) => client.post("/vehicles/", data);
export const updateVehicle = (id, data) => client.put(`/vehicles/${id}`, data);

export const getShipments = () => client.get("/shipments/");
export const createShipment = (data) => client.post("/shipments/", data);

export const getTrips = () => client.get("/trips/");
export const getTrip = (id) => client.get(`/trips/${id}`);
export const getTripRoute = (id) => client.get(`/trips/${id}/route`);
export const createTrip = (data) => client.post("/trips/", data);
export const updateTrip = (id, data) => client.put(`/trips/${id}`, data);

export const getAssignments = () => client.get("/driver-assignments/");
export const createAssignment = (data) => client.post("/driver-assignments/", data);
export const updateAssignment = (id, data) => client.put(`/driver-assignments/${id}`, data);

export const getAttendance = () => client.get("/driver-attendance/");
export const createAttendance = (data) => client.post("/driver-attendance/", data);

export const getMaintenance = () => client.get("/maintenance/");
export const createMaintenance = (data) => client.post("/maintenance/", data);
export const updateMaintenance = (id, data) => client.put(`/maintenance/${id}`, data);

export const getMaintenanceAlerts = () => client.get("/maintenance-alerts/");
export const createMaintenanceAlert = (maintenanceId) => client.post(`/maintenance-alerts/${maintenanceId}`);
export const updateMaintenanceAlert = (id, data) => client.put(`/maintenance-alerts/${id}`, data);

export const getFuelRecords = () => client.get("/fuel-records/");
export const getFuelAnalytics = () => client.get("/fuel-records/analytics");
export const createFuelRecord = (data) => client.post("/fuel-records/", data);

export const getDashboard = () => client.get("/dashboard/");
export const getMaintenanceReport = () => client.get("/reports/maintenance");
export const getOperationalReport = () => client.get("/reports/operations");