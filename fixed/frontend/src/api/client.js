const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/**
 * Format any API error response into a clean, human-readable string.
 * Prevents raw [object Object] from ever being rendered in the UI.
 */
export function formatErrorMessage(error) {
  if (!error) return "An unexpected error occurred.";
  if (typeof error === "string") return error;

  // Handle Fetch / Error objects
  const message = error.message || error.detail || error;

  // If message is an array (FastAPI 422 Pydantic validation errors)
  if (Array.isArray(message)) {
    return message
      .map((err) => {
        if (typeof err === "string") return err;
        const field = err.loc ? err.loc.filter((l) => l !== "body").join(" → ") : "";
        return field ? `${field}: ${err.msg}` : err.msg || "Invalid field value";
      })
      .join(" | ");
  }

  // If message is a nested object
  if (typeof message === "object") {
    if (message.msg) return message.msg;
    try {
      return JSON.stringify(message);
    } catch {
      return "Validation or database error occurred.";
    }
  }

  return String(message);
}

export async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = localStorage.getItem("fleetflow_token");
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // 204 No Content
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let errorDetail = data;
      if (typeof data === "object" && data !== null) {
        errorDetail = data.detail || data.message || data;
      }
      const formatted = formatErrorMessage(errorDetail);
      throw new Error(formatted);
    }

    return data;
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Unable to connect to FleetFlow backend server (http://127.0.0.1:8000). Please ensure the backend server is running.");
    }
    throw error;
  }
}

export const api = {
  get: (endpoint) => request(endpoint, { method: "GET" }),
  post: (endpoint, body) =>
    request(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body) =>
    request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};
