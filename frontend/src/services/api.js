import axios from "axios";

const api = axios.create({
  baseURL: "/", // Local route proxy configured in vite.config.js directs to http://127.0.0.1:8000
});

// Add a request interceptor to include the JWT token in all API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      if (typeof config.headers.set === "function") {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 Unauthorized errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Global API Interceptor: Received 401 Unauthorized. Clearing session and redirecting.");
      localStorage.removeItem("token");
      if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;