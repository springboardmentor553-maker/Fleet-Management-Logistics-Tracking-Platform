import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
    FaEye,
    FaEyeSlash,
    FaTruck,
    FaArrowRight
} from "react-icons/fa";

import { loginUser } from "../services/authService";
import "../styles/login.css";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const registrationMessage = location.state?.message || "";

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        if (error) {
            setError("");
        }
    };

    // Decode JWT
    const decodeToken = (token) => {
        try {
            if (!token) return null;

            const parts = token.split(".");

            if (parts.length !== 3) {
                return null;
            }

            const base64 = parts[1]
                .replace(/-/g, "+")
                .replace(/_/g, "/");

            const padded = base64.padEnd(
                base64.length +
                    (4 - (base64.length % 4)) % 4,
                "="
            );

            return JSON.parse(atob(padded));
        } catch (error) {
            console.error("JWT decoding failed:", error);
            return null;
        }
    };

    // Redirect based on role
    const redirectByRole = (role) => {
        switch (role) {
            case "admin":
                navigate("/admin", { replace: true });
                break;

            case "manager":
                navigate("/manager-dashboard", { replace: true });
                break;

            case "driver":
            case "user":
                navigate("/dashboard", { replace: true });
                break;

            default:
                navigate("/dashboard", { replace: true });
                break;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await loginUser({
                email: formData.email.trim().toLowerCase(),
                password: formData.password
            });

            const token = response?.access_token;

            if (!token) {
                throw new Error(
                    "Authentication token was not returned by the server."
                );
            }

            const payload = decodeToken(token);

            if (!payload) {
                throw new Error("Invalid authentication token.");
            }

            console.log("JWT Payload:", payload);

            const userRole = String(
                payload.role || "user"
            )
                .toLowerCase()
                .trim();

            const userEmail =
                payload.sub || formData.email.trim().toLowerCase();

            const allowedRoles = [
                "admin",
                "manager",
                "user",
                "driver"
            ];

            if (!allowedRoles.includes(userRole)) {
                throw new Error(
                    `Invalid user role: ${userRole}`
                );
            }

            // Clear previous session
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("email");
            localStorage.removeItem("username");

            // Save new session
            localStorage.setItem("token", token);
            localStorage.setItem("role", userRole);
            localStorage.setItem("email", userEmail);

            if (payload.username) {
                localStorage.setItem(
                    "username",
                    payload.username
                );
            }

            console.log("Login successful");
            console.log("Role:", userRole);

            redirectByRole(userRole);

        } catch (error) {
            console.error("Login error:", error);

            const backendError =
                error.response?.data?.detail;

            if (backendError) {
                setError(
                    typeof backendError === "string"
                        ? backendError
                        : "Invalid email or password."
                );
            } else if (error.request) {
                setError(
                    "Unable to connect to the backend. Please make sure the server is running."
                );
            } else {
                setError(
                    error.message ||
                        "Invalid email or password. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">

            {/* ==============================
                LEFT BRANDING
            ============================== */}

            <div className="auth-brand">

                <div className="brand-content">

                    <div className="brand-logo">
                        <div className="brand-icon">
                            <FaTruck />
                        </div>

                        <span>FleetFlow</span>
                    </div>

                    <div className="brand-message">

                        <p className="brand-label">
                            FLEET MANAGEMENT PLATFORM
                        </p>

                        <h1>
                            Move smarter.
                            <br />
                            Manage better.
                        </h1>

                        <p className="brand-description">
                            Manage vehicles, drivers, trips,
                            maintenance and fleet operations
                            from one powerful platform.
                        </p>

                    </div>

                    <div className="brand-features">

                        <div>
                            <strong>Fleet Operations</strong>
                            <span>
                                Manage your entire fleet
                            </span>
                        </div>

                        <div>
                            <strong>Real-time Tracking</strong>
                            <span>
                                Stay updated on every trip
                            </span>
                        </div>

                        <div>
                            <strong>Smart Analytics</strong>
                            <span>
                                Make data-driven decisions
                            </span>
                        </div>

                    </div>

                </div>

                <div className="brand-footer">
                    © 2026 FleetFlow. Fleet management simplified.
                </div>

            </div>


            {/* ==============================
                LOGIN SECTION
            ============================== */}

            <div className="auth-form-section">

                <div className="auth-form-container">

                    {/* Mobile Logo */}

                    <div className="mobile-logo">

                        <div className="brand-icon">
                            <FaTruck />
                        </div>

                        <span>FleetFlow</span>

                    </div>


                    {/* Header */}

                    <div className="auth-header">

                        <p className="welcome-text">
                            WELCOME BACK
                        </p>

                        <h2>
                            Sign in to your account
                        </h2>

                        <p>
                            Enter your credentials to continue
                            to FleetFlow.
                        </p>

                    </div>


                    {/* Success message */}

                    {registrationMessage && (
                        <div className="auth-success">
                            {registrationMessage}
                        </div>
                    )}


                    {/* Error */}

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}


                    {/* Form */}

                    <form
                        className="auth-form"
                        onSubmit={handleSubmit}
                    >

                        {/* EMAIL */}

                        <div className="form-group">

                            <label htmlFor="email">
                                Email address
                            </label>

                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                required
                            />

                        </div>


                        {/* PASSWORD */}

                        <div className="form-group">

                            <label htmlFor="password">
                                Password
                            </label>

                            <div className="password-input">

                                <input
                                    id="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(
                                            !showPassword
                                        )
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showPassword ? (
                                        <FaEyeSlash />
                                    ) : (
                                        <FaEye />
                                    )}
                                </button>

                            </div>

                        </div>


                        {/* SUBMIT */}

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >

                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <FaArrowRight />
                                </>
                            )}

                        </button>

                    </form>


                    {/* Divider */}

                    <div className="auth-divider">
                        <span>OR</span>
                    </div>


                    {/* Register */}

                    <p className="auth-switch">
                        Don't have an account?

                        <Link to="/register">
                            Create an account
                        </Link>
                    </p>

                </div>

            </div>

        </div>
    );
}

export default Login;