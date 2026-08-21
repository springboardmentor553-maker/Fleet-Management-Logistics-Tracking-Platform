import axios from "axios";

// ============================================================
// API BASE URL
// ============================================================

const API = "http://127.0.0.1:8000";


// ============================================================
// LOGIN
// ============================================================

export const loginUser = async ({ email, password }) => {
    try {

        const response = await axios.post(
            `${API}/auth/login`,
            {
                email: email,
                password: password
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        console.log(
            "Login API response:",
            response.data
        );


        // ----------------------------------------------------
        // Save authentication information
        // ----------------------------------------------------

        const data = response.data;


        if (data.access_token) {

            localStorage.setItem(
                "token",
                data.access_token
            );

        }


        // ----------------------------------------------------
        // Save user information
        // ----------------------------------------------------

        if (data.user) {

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            localStorage.setItem(
                "user_id",
                String(data.user.id)
            );

            localStorage.setItem(
                "username",
                data.user.username
            );

            localStorage.setItem(
                "email",
                data.user.email
            );

            localStorage.setItem(
                "role",
                data.user.role
            );

        }


        return data;

    } catch (error) {

        console.error(
            "Login API error:",
            error.response?.data || error.message
        );

        throw error;

    }
};


// ============================================================
// REGISTER
// ============================================================

export const registerUser = async (
    username,
    email,
    password,
    role = "driver"
) => {

    try {

        const response = await axios.post(
            `${API}/auth/register`,
            {
                username: username,
                email: email,
                password: password,
                role: role
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        console.log(
            "Register API response:",
            response.data
        );

        return response.data;

    } catch (error) {

        console.error(
            "Register API error:",
            error.response?.data || error.message
        );

        throw error;

    }
};


// ============================================================
// LOGOUT
// ============================================================

export const logoutUser = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("role");

};


// ============================================================
// GET TOKEN
// ============================================================

export const getToken = () => {

    return localStorage.getItem("token");

};


// ============================================================
// GET CURRENT USER
// ============================================================

export const getCurrentUser = () => {

    const user =
        localStorage.getItem("user");

    if (!user) {
        return null;
    }

    try {

        return JSON.parse(user);

    } catch {

        return null;

    }

};


// ============================================================
// AUTHENTICATED HEADERS
// ============================================================

export const getAuthHeaders = () => {

    const token =
        localStorage.getItem("token");

    return {

        headers: {

            Authorization:
                `Bearer ${token}`

        }

    };

};