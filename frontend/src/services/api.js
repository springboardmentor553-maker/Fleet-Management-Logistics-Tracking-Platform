import axios from "axios";

// ==========================================================
// API BASE URL
// ==========================================================

const api = axios.create({
    baseURL: "http://127.0.0.1:8000",

    headers: {
        "Content-Type": "application/json",
    },
});


// ==========================================================
// REQUEST INTERCEPTOR
// ==========================================================

api.interceptors.request.use(
    (config) => {

        const token = sessionStorage.getItem("token");

        // --------------------------------------------------
        // Attach JWT
        // --------------------------------------------------

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


// ==========================================================
// RESPONSE INTERCEPTOR
// ==========================================================

api.interceptors.response.use(

    (response) => {
        return response;
    },

    (error) => {

        const status =
            error.response?.status;

        const requestUrl =
            error.config?.url || "";


        // ==================================================
        // HANDLE 401
        // ==================================================

        if (status === 401) {

            console.warn(
                "Authentication expired or invalid."
            );


            // ------------------------------------------------
            // Clear current session
            // ------------------------------------------------

            sessionStorage.removeItem("token");

            sessionStorage.removeItem("token_type");

            sessionStorage.removeItem("user");

            sessionStorage.removeItem("user_email");


            // ------------------------------------------------
            // Do NOT force redirect while already on login
            // ------------------------------------------------

            const isLoginPage =
                window.location.pathname === "/login";


            if (!isLoginPage) {

                window.location.replace(
                    "/login"
                );
            }
        }


        return Promise.reject(error);
    }
);


export default api;