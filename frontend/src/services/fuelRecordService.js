import api from "./api";

export const extractErrorMessage = (err, fallback = "An error occurred.") => {
  if (!err) return fallback;
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.msg) {
          const loc = Array.isArray(item.loc) ? item.loc.filter((l) => l !== "body").join(".") : "";
          return loc ? `${loc}: ${item.msg}` : item.msg;
        }
        return JSON.stringify(item);
      })
      .join("; ");
  }
  if (detail && typeof detail === "object") {
    return JSON.stringify(detail);
  }
  if (err.response?.data?.message && typeof err.response.data.message === "string") {
    return err.response.data.message;
  }
  if (err.message && typeof err.message === "string") {
    return err.message;
  }
  return fallback;
};

export const getFuelRecords = async () => {
  const response = await api.get("/fuel-records/");
  return response.data;
};

export const getFuelRecordById = async (id) => {
  const response = await api.get(`/fuel-records/${id}`);
  return response.data;
};

export const createFuelRecord = async (data) => {
  const response = await api.post("/fuel-records/", data);
  return response.data;
};

export const updateFuelRecord = async (id, data) => {
  const response = await api.put(`/fuel-records/${id}`, data);
  return response.data;
};

export const deleteFuelRecord = async (id) => {
  const response = await api.delete(`/fuel-records/${id}`);
  return response.data;
};
