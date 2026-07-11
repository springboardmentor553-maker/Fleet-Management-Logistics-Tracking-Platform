import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

export const client = axios.create({
  baseURL: BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("freightflow_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized = () => {};
export function registerUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  // FastAPI validation errors (422) return `detail` as an array of objects
  // like { type, loc, msg, input, ctx } instead of a plain string. Rendering
  // that array directly crashes React ("Objects are not valid as a React
  // child"), so turn it into a readable string first.
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : null;
        return field ? `${field}: ${d.msg}` : d?.msg;
      })
      .filter(Boolean)
      .join("; ") || "Something went wrong. Please try again.";
  }

  if (typeof detail === "string") return detail;

  return "Something went wrong. Please try again.";
}