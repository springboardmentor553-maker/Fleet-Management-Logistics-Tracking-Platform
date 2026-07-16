import axios from "axios";

const api = axios.create({
  baseURL: "/", // Local route proxy configured in vite.config.js directs to http://127.0.0.1:8000
});

// Add a request interceptor to include the JWT token in all API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;