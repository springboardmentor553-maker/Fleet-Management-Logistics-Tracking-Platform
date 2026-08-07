import axios from "axios";

const API = "http://127.0.0.1:8000";

// ----------------------------
// Register User
// ----------------------------
export const registerUser = async (userData) => {
  const response = await axios.post(`${API}/auth/register`, userData);
  return response.data;
};

// ----------------------------
// Login User
// ----------------------------
export const loginUser = async (email, password) => {
  const response = await axios.post(`${API}/auth/login`, {
    email,
    password,
  });

  // Save JWT Token
  localStorage.setItem("token", response.data.access_token);

  return response.data;
};

// ----------------------------
// Logout User
// ----------------------------
export const logoutUser = () => {
  localStorage.removeItem("token");
};

// ----------------------------
// Get JWT Token
// ----------------------------
export const getToken = () => {
  return localStorage.getItem("token");
};

// ----------------------------
// Check Authentication
// ----------------------------
export const isAuthenticated = () => {
  return localStorage.getItem("token") !== null;
};

// ----------------------------
// Get Authorization Header
// ----------------------------
export const authHeader = () => {
  const token = getToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};