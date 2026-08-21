import axios from "axios";

const API = "http://127.0.0.1:8000/activities";

const getHeaders = () => ({
    headers: {
        Authorization:
            `Bearer ${localStorage.getItem("token")}`
    }
});

export const getActivities = async () => {

    const response = await axios.get(
        API,
        getHeaders()
    );

    return response.data;
};