import axios from "axios";


const API_URL = "https://fleetflow-backend-90o5.onrender.com";


// Get all assignments

export const getAssignments = async()=>{

    const response =
    await axios.get(
        `${API_URL}/assignments/`
    );

    return response.data;

};



// Create assignment

export const createAssignment = async(data)=>{


    const response =
    await axios.post(
        `${API_URL}/assignments/`,
        data
    );


    return response.data;

};



// Delete assignment

export const deleteAssignment = async(id)=>{


    const response =
    await axios.delete(
        `${API_URL}/assignments/${id}`
    );


    return response.data;

};