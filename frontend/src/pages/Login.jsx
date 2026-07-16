import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, token, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard or appropriate page
  useEffect(() => {
    if (token && user) {
      if (user.role === "Driver") {
        navigate("/vehicles");
      } else {
        navigate("/dashboard");
      }
    }
  }, [token, user, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const data = await loginUser(email, password);
      if (data && data.access_token) {
        login(data.access_token);
        // Page redirect will be handled by useEffect
      } else {
        setErrorMsg("Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.detail || "Invalid Email or Password";
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🚚</div>
          <h2>FleetFlow</h2>
          <p>Logistics & Fleet Tracking System</p>
        </div>
        
        {errorMsg && (
          <div className="error-banner">
            <span>⚠</span> {errorMsg}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="e.g. admin@fleetflow.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block btn-login" 
            disabled={submitting}
          >
            {submitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p>Secure Role-Based Access Control</p>
        </div>
      </div>
    </div>
  );
}

export default Login;