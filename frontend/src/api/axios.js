import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:8000",

    headers: {
        "Content-Type": "application/json"
    },

    withCredentials: true
});


// ============================================================
// REQUEST INTERCEPTOR
// Automatically attach JWT token
// ============================================================

API.interceptors.request.use(
    (config) => {

        const token = localStorage.getItem("token");

        if (token) {

            config.headers = config.headers || {};

            config.headers.Authorization =
                `Bearer ${token}`;

        }

        return config;

    },

    (error) => {

        return Promise.reject(error);

    }
);


// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

API.interceptors.response.use(

    (response) => {

        return response;

    },

    (error) => {

        console.error(
            "API Error:",
            error.response?.status,
            error.response?.data || error.message
        );

        return Promise.reject(error);

    }

);


export default API;