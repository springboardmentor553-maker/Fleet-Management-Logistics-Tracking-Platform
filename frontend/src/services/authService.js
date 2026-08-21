import API from "./api";

export const login = async (email, password) => {
  const formData = new URLSearchParams();

  formData.append("username", email);
  formData.append("password", password);

  const response = await API.post("/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  localStorage.setItem("token", response.data.access_token);

  // Get logged-in user's profile/role
  const profile = await API.get("/auth/profile");

  localStorage.setItem("user", JSON.stringify(profile.data));

  return {
    ...response.data,
    user: profile.data,
  };
};

export const register = async (userData) => {
  const response = await API.post("/auth/register", userData);

  return response.data;
};

export const getProfile = async () => {
  const response = await API.get("/auth/profile");

  localStorage.setItem("user", JSON.stringify(response.data));

  return response.data;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};