import API from "../api/axios";

// Get all assignments
export const getAssignments = async () => {
    const response = await API.get("/driver-assignments/");
    return response.data;
};

// Assign driver
export const assignDriver = async (data) => {
    const response = await API.post(
        "/driver-assignments/",
        data
    );
    return response.data;
};

// Release driver
export const releaseDriver = async (id, releaseDate) => {
    const response = await API.patch(
        `/driver-assignments/${id}/release`,
        {
            release_date: releaseDate,
        }
    );

    return response.data;
};

// Get assignment by ID
export const getAssignmentById = async (id) => {
    const response = await API.get(
        `/driver-assignments/${id}`
    );
    return response.data;
};