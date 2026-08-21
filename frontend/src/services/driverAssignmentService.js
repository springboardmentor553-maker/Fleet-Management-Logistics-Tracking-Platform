import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
});

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

// GET ALL ASSIGNMENTS
export const getDriverAssignments = async () => {
  const response = await API.get(
    "/driver-assignments/",
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// GET SINGLE ASSIGNMENT
export const getDriverAssignment = async (
  assignmentId
) => {
  const response = await API.get(
    `/driver-assignments/${assignmentId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// ASSIGN DRIVER
export const createDriverAssignment = async (
  assignmentData
) => {
  const response = await API.post(
    "/driver-assignments/",
    assignmentData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// UPDATE ASSIGNMENT
export const updateDriverAssignment = async (
  assignmentId,
  assignmentData
) => {
  const response = await API.put(
    `/driver-assignments/${assignmentId}`,
    assignmentData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// REMOVE ASSIGNMENT
export const deleteDriverAssignment = async (
  assignmentId
) => {
  const response = await API.delete(
    `/driver-assignments/${assignmentId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};
