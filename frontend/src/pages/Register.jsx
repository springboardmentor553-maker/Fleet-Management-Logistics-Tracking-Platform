import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    FaEye,
    FaEyeSlash,
    FaTruck,
    FaArrowRight
} from "react-icons/fa";

import { registerUser } from "../services/authService";
import "../styles/register.css";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

    const validateForm = () => {
        if (!formData.username.trim()) {
            return "Please enter your username.";
        }

        if (!formData.email.trim()) {
            return "Please enter your email address.";
        }

        if (!formData.password) {
            return "Please enter a password.";
        }

        if (formData.password.length < 6) {
            return "Password must contain at least 6 characters.";
        }

        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            const registrationData = {
                username: formData.username.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                role: "driver"
            };

            await registerUser(registrationData);

            navigate("/", {
                replace: true,
                state: {
                    message:
                        "Registration successful. Please sign in."
                }
            });

        } catch (error) {
            console.error(
                "Registration error:",
                error
            );

            const detail =
                error.response?.data?.detail;

            if (typeof detail === "string") {
                setError(detail);
            } else if (error.request) {
                setError(
                    "Unable to connect to the backend. Please make sure the server is running."
                );
            } else {
                setError(
                    error.message ||
                        "Registration failed. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page register-page">

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
                            Build your fleet.
                            <br />
                            Drive your future.
                        </h1>

                        <p className="brand-description">
                            Join FleetFlow and manage your
                            vehicles, drivers, maintenance,
                            shipments and operations efficiently.
                        </p>

                    </div>


                    <div className="brand-features">

                        <div>
                            <strong>
                                Centralized Management
                            </strong>

                            <span>
                                Everything in one place
                            </span>
                        </div>

                        <div>
                            <strong>
                                Operational Visibility
                            </strong>

                            <span>
                                Monitor your fleet efficiently
                            </span>
                        </div>

                        <div>
                            <strong>
                                Actionable Insights
                            </strong>

                            <span>
                                Turn fleet data into decisions
                            </span>
                        </div>

                    </div>

                </div>


                <div className="brand-footer">
                    © 2026 FleetFlow. Fleet management simplified.
                </div>

            </div>


            {/* ==============================
                REGISTER SECTION
            ============================== */}

            <div className="auth-form-section">

                <div className="auth-form-container register-form-container">

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
                            GET STARTED
                        </p>

                        <h2>
                            Create your account
                        </h2>

                        <p>
                            Create your FleetFlow account
                            to get started.
                        </p>

                    </div>


                    {/* Error */}

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}


                    <form
                        className="auth-form"
                        onSubmit={handleSubmit}
                    >

                        {/* USERNAME */}

                        <div className="form-group">

                            <label htmlFor="username">
                                Username
                            </label>

                            <input
                                id="username"
                                type="text"
                                name="username"
                                placeholder="Enter your username"
                                value={formData.username}
                                onChange={handleChange}
                                autoComplete="username"
                                required
                            />

                        </div>


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
                                    placeholder="Create a password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
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

                            <small className="form-hint">
                                Password must contain at least
                                6 characters.
                            </small>

                        </div>


                        {/* ACCOUNT TYPE */}

                        <div className="form-group">

                            <label htmlFor="role">
                                Account type
                            </label>

                            <select
                                id="role"
                                className="account-select"
                                value="driver"
                                disabled
                            >
                                <option value="driver">
                                    User / Driver
                                </option>
                            </select>

                            <small className="form-hint">
                                Admin and Manager accounts are
                                created by authorized administrators.
                            </small>

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
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create account
                                    <FaArrowRight />
                                </>
                            )}

                        </button>

                    </form>


                    {/* Divider */}

                    <div className="auth-divider">
                        <span>OR</span>
                    </div>


                    {/* Login */}

                    <p className="auth-switch">
                        Already have an account?

                        <Link to="/">
                            Sign in
                        </Link>
                    </p>

                </div>

            </div>

        </div>
    );
}

export default Register;