import api from "./api";

// Decodes JWT token payload without external libraries
export const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("JWT decoding failed:", error);
    return null;
  }
};

export const loginUser = async (email, password) => {
  // FastAPI's OAuth2PasswordRequestForm expects username and password sent as application/x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append("username", email);
  params.append("password", password);

  const response = await api.post("/login", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data;
};

export const getProfile = async () => {
  const response = await api.get("/profile");
  return response.data;
};