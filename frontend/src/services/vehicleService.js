import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const getVehicles = async () => {
  const token = localStorage.getItem("token");

  const response = await API.get("/vehicles/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const addVehicle = async (vehicleData) => {
  const token = localStorage.getItem("token");

  const response = await API.post(
    "/vehicles/",
    vehicleData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const deleteVehicle = async (id) => {
  const token = localStorage.getItem("token");

  const response = await API.delete(`/vehicles/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const updateVehicle = async (id, vehicleData) => {
  const token = localStorage.getItem("token");

  const response = await API.put(
    `/vehicles/${id}`,
    vehicleData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};