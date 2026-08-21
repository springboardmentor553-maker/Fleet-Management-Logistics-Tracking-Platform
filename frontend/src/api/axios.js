import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://fleetflow-backend-bwsj.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically inject the access token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch auth errors (e.g. expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Force reload to login if not already there
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Standardized Error Message Parser
export const getErrorMessage = (error) => {
  if (!error.response) return "Unable to connect to the server.";
  if (error.response.status === 403) return "You are not authorized to access this page.";
  if (error.response.status === 404) return "No data available.";
  if (error.response.status === 401) return "Please login again.";
  if (error.response.status === 500) return "Internal server error. Please try again later.";
  return error.response?.data?.detail || "An unexpected error occurred.";
};

export default api;
