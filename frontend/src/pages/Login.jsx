import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Login.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        // Remove unnecessary spaces
        const cleanEmail = email.trim();
        const cleanPassword = password.trim();

        // Basic validation
        if (!cleanEmail || !cleanPassword) {
            alert("Please enter email and password.");
            return;
        }

        setLoading(true);

        try {
            console.log("Sending login request...");
            console.log("Email:", cleanEmail);

            const response = await api.post("/auth/login", {
                email: cleanEmail,
                password: cleanPassword,
            });

            console.log("Login Success:", response.data);

            // Check whether token was received
            if (!response.data.access_token) {
                console.error(
                    "Access token missing:",
                    response.data
                );

                alert("Login failed: Access token not received.");
                return;
            }

            // Save JWT token
            localStorage.setItem(
                "token",
                response.data.access_token
            );

            // Optional: save user email
            localStorage.setItem(
                "user_email",
                cleanEmail
            );

            // Go to dashboard
            navigate("/dashboard");

        } catch (error) {
            console.error("Login Error:", error);

            if (error.response) {
                console.error(
                    "Status:",
                    error.response.status
                );

                console.error(
                    "Response:",
                    error.response.data
                );

                const message =
                    error.response.data?.detail ||
                    error.response.data?.message ||
                    "Invalid email or password";

                alert(message);

            } else if (error.request) {
                console.error(
                    "No response received:",
                    error.request
                );

                alert(
                    "Unable to connect to the server. Please make sure FastAPI is running."
                );

            } else {
                console.error(
                    "Request Error:",
                    error.message
                );

                alert("Something went wrong. Please try again.");
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">

            <form
                className="login-box"
                onSubmit={handleLogin}
            >

                <h1>FleetFlow</h1>

                <h3>
                    Fleet Management System
                </h3>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                    required
                    autoComplete="email"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                    required
                    autoComplete="current-password"
                />

                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>

            </form>

        </div>
    );
}

export default Login;