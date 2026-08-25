import axios from "axios";
import { API_BASE_URL } from "../config";
import { clearAuth, getToken } from "../utils/authStorage";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      clearAuth();
      window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export default api;