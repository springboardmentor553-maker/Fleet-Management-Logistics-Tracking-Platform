import axios from "axios";


const API_URL = "https://fleetflow-backend-90o5.onrender.com";



// Get all maintenance records

export const getMaintenance = async()=>{

    const response =
    await axios.get(
        `${API_URL}/maintenance/`
    );

    return response.data;

};




// Create maintenance record

export const createMaintenance = async(data)=>{


    const response =
    await axios.post(
        `${API_URL}/maintenance/`,
        data
    );


    return response.data;

};




// Delete maintenance record

export const deleteMaintenance = async(id)=>{


    const response =
    await axios.delete(
        `${API_URL}/maintenance/${id}`
    );


    return response.data;

};