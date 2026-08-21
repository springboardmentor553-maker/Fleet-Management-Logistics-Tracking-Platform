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

// GET ALL ATTENDANCE
export const getDriverAttendance = async () => {
  const response = await API.get(
    "/driver-attendance/",
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// GET ATTENDANCE BY ID
export const getDriverAttendanceById = async (
  attendanceId
) => {
  const response = await API.get(
    `/driver-attendance/${attendanceId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// CREATE ATTENDANCE
export const createDriverAttendance = async (
  attendanceData
) => {
  const response = await API.post(
    "/driver-attendance/",
    attendanceData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// UPDATE ATTENDANCE
export const updateDriverAttendance = async (
  attendanceId,
  attendanceData
) => {
  const response = await API.put(
    `/driver-attendance/${attendanceId}`,
    attendanceData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};
