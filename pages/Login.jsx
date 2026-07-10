import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Login.css";

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const handleLogin = async (e) => {

        e.preventDefault();

        try {

            const response = await api.post("/auth/login", {
                email: email,
                password: password,
            });

            console.log("Login Success:", response.data);

            localStorage.setItem(
                "token",
                response.data.access_token
            );

            navigate("/dashboard");

        } catch (error) {

            console.error("Login Error:", error);

            if (error.response) {
                console.error("Response:", error.response.data);
                alert(error.response.data.detail || "Invalid Credentials");
            } else {
                alert("Unable to connect to the server.");
            }

        }

    };

    return (

        <div className="login-container">

            <form className="login-box" onSubmit={handleLogin}>

                <h1>FleetFlow</h1>

                <h3>Fleet Management System</h3>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit">
                    Login
                </button>

            </form>

        </div>

    );
}

export default Login;