import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const getDashboard = async () => {
  const token = localStorage.getItem("token");

  const response = await API.get("/dashboard/fleet", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};