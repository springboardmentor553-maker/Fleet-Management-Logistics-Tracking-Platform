import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Login.css";


// ==========================================================
// LOGIN
// ==========================================================

function Login() {

    const navigate = useNavigate();


    // ==========================================================
    // MODE
    // ==========================================================

    const [mode, setMode] = useState("login");
    // login | register | forgot


    // ==========================================================
    // LOGIN STATE
    // ==========================================================

    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");


    // ==========================================================
    // REGISTER STATE
    // ==========================================================

    const [name, setName] = useState("");
    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Public registration should always create a normal User.
    const role = "User";


    // ==========================================================
    // FORGOT PASSWORD STATE
    // ==========================================================

    const [forgotEmail, setForgotEmail] = useState("");


    // ==========================================================
    // UI STATE
    // ==========================================================

    const [showLoginPassword, setShowLoginPassword] = useState(false);

    const [showRegisterPassword, setShowRegisterPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");


    // ==========================================================
    // CLEAR AUTH SESSION
    // ==========================================================

    const clearAuthSession = () => {

        sessionStorage.removeItem("token");

        sessionStorage.removeItem("token_type");

        sessionStorage.removeItem("user");

        sessionStorage.removeItem("user_email");


        // Remove old authentication data that may have
        // been created by the previous localStorage version.

        localStorage.removeItem("token");

        localStorage.removeItem("token_type");

        localStorage.removeItem("user");

        localStorage.removeItem("user_email");
    };


    // ==========================================================
    // CLEAR MESSAGES
    // ==========================================================

    const clearMessages = () => {

        setMessage("");

        setError("");
    };


    // ==========================================================
    // SWITCH MODE
    // ==========================================================

    const switchMode = (newMode) => {

        clearMessages();

        setMode(newMode);
    };


    // ==========================================================
    // LOGIN
    // ==========================================================

    const handleLogin = async (e) => {

        e.preventDefault();

        clearMessages();


        const email =
            loginEmail.trim();

        const password =
            loginPassword.trim();


        // ======================================================
        // VALIDATION
        // ======================================================

        if (!email || !password) {

            setError(
                "Please enter email and password."
            );

            return;
        }


        setLoading(true);


        try {

            // --------------------------------------------------
            // Clear previous session
            // --------------------------------------------------

            clearAuthSession();


            // --------------------------------------------------
            // Login
            // --------------------------------------------------

            const response =
                await api.post(
                    "/auth/login",
                    {
                        email,
                        password,
                    }
                );


            console.log(
                "Login response:",
                response.data
            );


            // --------------------------------------------------
            // Validate token
            // --------------------------------------------------

            if (
                !response.data?.access_token
            ) {

                setError(
                    "Login failed: access token was not received."
                );

                return;
            }


            // --------------------------------------------------
            // Save JWT in SESSION STORAGE
            // --------------------------------------------------

            sessionStorage.setItem(
                "token",
                response.data.access_token
            );


            if (
                response.data.token_type
            ) {

                sessionStorage.setItem(
                    "token_type",
                    response.data.token_type
                );

            } else {

                sessionStorage.setItem(
                    "token_type",
                    "bearer"
                );
            }


            sessionStorage.setItem(
                "user_email",
                email
            );


            // --------------------------------------------------
            // Fetch logged-in user's profile
            // --------------------------------------------------

            let user = null;


            try {

                const profileResponse =
                    await api.get(
                        "/auth/profile"
                    );


                user =
                    profileResponse.data;


                console.log(
                    "Current user profile:",
                    user
                );


                if (user) {

                    sessionStorage.setItem(
                        "user",
                        JSON.stringify(user)
                    );
                }


            } catch (profileError) {

                console.error(
                    "Profile fetch error:",
                    profileError
                );


                // If profile cannot be fetched,
                // clear the complete session.

                clearAuthSession();


                setError(
                    "Login succeeded, but your user profile could not be loaded."
                );


                return;
            }


            // --------------------------------------------------
            // Validate user
            // --------------------------------------------------

            if (!user) {

                clearAuthSession();

                setError(
                    "Unable to load user profile."
                );

                return;
            }


            // --------------------------------------------------
            // Get role
            // --------------------------------------------------

            const userRole =
                String(
                    user?.role || "User"
                )
                    .trim()
                    .toLowerCase();


            console.log(
                "FleetFlow logged-in user:",
                user
            );

            console.log(
                "FleetFlow role:",
                userRole
            );


            // --------------------------------------------------
            // Redirect
            // --------------------------------------------------

            navigate(
                "/dashboard",
                {
                    replace: true,
                }
            );


        } catch (error) {

            console.error(
                "Login Error:",
                error
            );


            // Clear invalid session

            clearAuthSession();


            if (
                error.response
            ) {

                const detail =
                    error.response.data?.detail ||
                    error.response.data?.message ||
                    "Invalid email or password.";


                setError(
                    detail
                );


            } else if (
                error.request
            ) {

                setError(
                    "Unable to connect to the server. Please make sure FastAPI is running."
                );


            } else {

                setError(
                    "Something went wrong. Please try again."
                );
            }


        } finally {

            setLoading(false);
        }
    };


    // ==========================================================
    // REGISTER
    // ==========================================================

    const handleRegister = async (e) => {

        e.preventDefault();

        clearMessages();


        const cleanName =
            name.trim();

        const cleanEmail =
            registerEmail.trim();

        const cleanPassword =
            registerPassword.trim();

        const cleanConfirmPassword =
            confirmPassword.trim();


        if (!cleanName) {

            setError(
                "Please enter your name."
            );

            return;
        }


        if (!cleanEmail) {

            setError(
                "Please enter your email."
            );

            return;
        }


        if (!cleanPassword) {

            setError(
                "Please enter a password."
            );

            return;
        }


        if (
            cleanPassword.length < 6
        ) {

            setError(
                "Password must contain at least 6 characters."
            );

            return;
        }


        if (
            cleanPassword !==
            cleanConfirmPassword
        ) {

            setError(
                "Passwords do not match."
            );

            return;
        }


        setLoading(true);


        try {

            await api.post(
                "/auth/register",
                {
                    name:
                        cleanName,

                    email:
                        cleanEmail,

                    password:
                        cleanPassword,

                    role:
                        role,
                }
            );


            setMessage(
                "Account created successfully. You can now log in."
            );


            setName("");

            setRegisterEmail("");

            setRegisterPassword("");

            setConfirmPassword("");


            setTimeout(() => {

                setMode("login");

                setMessage(
                    "Account created successfully. Please log in."
                );

            }, 800);


        } catch (error) {

            console.error(
                "Registration Error:",
                error
            );


            if (
                error.response
            ) {

                const detail =
                    error.response.data?.detail ||
                    error.response.data?.message ||
                    "Registration failed.";


                setError(
                    detail
                );


            } else if (
                error.request
            ) {

                setError(
                    "Unable to connect to the server. Please make sure FastAPI is running."
                );


            } else {

                setError(
                    "Something went wrong. Please try again."
                );
            }


        } finally {

            setLoading(false);
        }
    };


    // ==========================================================
    // FORGOT PASSWORD
    // ==========================================================

    const handleForgotPassword =
        async (e) => {

            e.preventDefault();

            clearMessages();


            const email =
                forgotEmail.trim();


            if (!email) {

                setError(
                    "Please enter your email address."
                );

                return;
            }


            setMessage(
                "Password reset is not configured yet. Please contact the administrator to reset your password."
            );
        };


    // ==========================================================
    // LOGIN FORM
    // ==========================================================

    const renderLoginForm = () => {

        return (

            <form
                className="auth-form"
                onSubmit={handleLogin}
            >

                <div className="auth-header">

                    <h1>
                        FleetFlow
                    </h1>

                    <p>
                        Fleet Management System
                    </p>

                </div>


                <div className="form-group">

                    <label>
                        Email
                    </label>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={loginEmail}
                        onChange={(e) =>
                            setLoginEmail(
                                e.target.value
                            )
                        }
                        autoComplete="email"
                        required
                    />

                </div>


                <div className="form-group">

                    <label>
                        Password
                    </label>


                    <div className="password-wrapper">

                        <input
                            type={
                                showLoginPassword
                                    ? "text"
                                    : "password"
                            }
                            placeholder="Enter your password"
                            value={loginPassword}
                            onChange={(e) =>
                                setLoginPassword(
                                    e.target.value
                                )
                            }
                            autoComplete="current-password"
                            required
                        />


                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() =>
                                setShowLoginPassword(
                                    !showLoginPassword
                                )
                            }
                        >

                            {
                                showLoginPassword
                                    ? "Hide"
                                    : "Show"
                            }

                        </button>

                    </div>

                </div>


                <div className="forgot-row">

                    <button
                        type="button"
                        className="link-button"
                        onClick={() =>
                            switchMode(
                                "forgot"
                            )
                        }
                    >
                        Forgot Password?
                    </button>

                </div>


                {error && (

                    <div className="auth-message error-message">

                        {error}

                    </div>

                )}


                {message && (

                    <div className="auth-message success-message">

                        {message}

                    </div>

                )}


                <button
                    type="submit"
                    className="primary-button"
                    disabled={loading}
                >

                    {
                        loading
                            ? "Logging in..."
                            : "Login"
                    }

                </button>


                <div className="switch-section">

                    <span>
                        Don't have an account?
                    </span>


                    <button
                        type="button"
                        className="link-button create-link"
                        onClick={() =>
                            switchMode(
                                "register"
                            )
                        }
                    >
                        Create New Account
                    </button>

                </div>

            </form>
        );
    };


    // ==========================================================
    // REGISTER FORM
    // ==========================================================

    const renderRegisterForm = () => {

        return (

            <form
                className="auth-form"
                onSubmit={handleRegister}
            >

                <div className="auth-header">

                    <h1>
                        Create Account
                    </h1>

                    <p>
                        Join FleetFlow
                    </p>

                </div>


                <div className="form-group">

                    <label>
                        Full Name
                    </label>

                    <input
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) =>
                            setName(
                                e.target.value
                            )
                        }
                        autoComplete="name"
                        required
                    />

                </div>


                <div className="form-group">

                    <label>
                        Email
                    </label>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={registerEmail}
                        onChange={(e) =>
                            setRegisterEmail(
                                e.target.value
                            )
                        }
                        autoComplete="email"
                        required
                    />

                </div>


                <div className="form-group">

                    <label>
                        Password
                    </label>


                    <div className="password-wrapper">

                        <input
                            type={
                                showRegisterPassword
                                    ? "text"
                                    : "password"
                            }
                            placeholder="Create a password"
                            value={registerPassword}
                            onChange={(e) =>
                                setRegisterPassword(
                                    e.target.value
                                )
                            }
                            autoComplete="new-password"
                            required
                        />


                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() =>
                                setShowRegisterPassword(
                                    !showRegisterPassword
                                )
                            }
                        >

                            {
                                showRegisterPassword
                                    ? "Hide"
                                    : "Show"
                            }

                        </button>

                    </div>

                </div>


                <div className="form-group">

                    <label>
                        Confirm Password
                    </label>


                    <div className="password-wrapper">

                        <input
                            type={
                                showConfirmPassword
                                    ? "text"
                                    : "password"
                            }
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(
                                    e.target.value
                                )
                            }
                            autoComplete="new-password"
                            required
                        />


                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() =>
                                setShowConfirmPassword(
                                    !showConfirmPassword
                                )
                            }
                        >

                            {
                                showConfirmPassword
                                    ? "Hide"
                                    : "Show"
                            }

                        </button>

                    </div>

                </div>


                <div className="form-group">

                    <label>
                        Account Type
                    </label>

                    <input
                        type="text"
                        value="User"
                        readOnly
                    />

                    <small>
                        New accounts are created as User
                        accounts. Admin accounts are managed
                        by the administrator.
                    </small>

                </div>


                {error && (

                    <div className="auth-message error-message">

                        {error}

                    </div>

                )}


                {message && (

                    <div className="auth-message success-message">

                        {message}

                    </div>

                )}


                <button
                    type="submit"
                    className="primary-button"
                    disabled={loading}
                >

                    {
                        loading
                            ? "Creating Account..."
                            : "Create Account"
                    }

                </button>


                <div className="switch-section">

                    <span>
                        Already have an account?
                    </span>


                    <button
                        type="button"
                        className="link-button create-link"
                        onClick={() =>
                            switchMode(
                                "login"
                            )
                        }
                    >
                        Back to Login
                    </button>

                </div>

            </form>
        );
    };


    // ==========================================================
    // FORGOT PASSWORD FORM
    // ==========================================================

    const renderForgotForm = () => {

        return (

            <form
                className="auth-form"
                onSubmit={handleForgotPassword}
            >

                <div className="auth-header">

                    <h1>
                        Forgot Password?
                    </h1>

                    <p>
                        Enter your registered email
                    </p>

                </div>


                <div className="form-group">

                    <label>
                        Email
                    </label>

                    <input
                        type="email"
                        placeholder="Enter your registered email"
                        value={forgotEmail}
                        onChange={(e) =>
                            setForgotEmail(
                                e.target.value
                            )
                        }
                        autoComplete="email"
                        required
                    />

                </div>


                {error && (

                    <div className="auth-message error-message">

                        {error}

                    </div>

                )}


                {message && (

                    <div className="auth-message success-message">

                        {message}

                    </div>

                )}


                <button
                    type="submit"
                    className="primary-button"
                    disabled={loading}
                >
                    Send Reset Instructions
                </button>


                <div className="switch-section">

                    <button
                        type="button"
                        className="link-button create-link"
                        onClick={() =>
                            switchMode(
                                "login"
                            )
                        }
                    >
                        ← Back to Login
                    </button>

                </div>

            </form>
        );
    };


    // ==========================================================
    // MAIN UI
    // ==========================================================

    return (

        <div className="login-container">

            <div className="login-box">

                {mode === "login" &&
                    renderLoginForm()}

                {mode === "register" &&
                    renderRegisterForm()}

                {mode === "forgot" &&
                    renderForgotForm()}

            </div>

        </div>
    );
}


export default Login;