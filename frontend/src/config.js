const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://fleetflow-production-e3cb.up.railway.app");

export const API_BASE_URL = API_URL.replace(/\/$/, "");

export const WS_BASE_URL = API_BASE_URL
  .replace(/^http:/, "ws:")
  .replace(/^https:/, "wss:");