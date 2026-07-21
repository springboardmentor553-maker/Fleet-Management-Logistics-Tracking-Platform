import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/register.css";
import { registerUser } from "../services/authService";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "user"
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await registerUser(formData);

            console.log(response);

            alert("Registration Successful!");

            navigate("/");
        } catch (error) {
            console.error(error);

            if (error.response) {
                alert(error.response.data.detail);
            } else {
                alert("Unable to connect to the backend.");
            }
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <h2>FleetFlow Register</h2>

                <form onSubmit={handleSubmit}>

                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>

                    <button type="submit">
                        Register
                    </button>

                </form>

                <p>
                    Already have an account?{" "}
                    <Link to="/">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;