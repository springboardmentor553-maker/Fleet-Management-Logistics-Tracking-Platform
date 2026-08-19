import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const [loading, setLoading] = useState(false);

  /* =====================================================
     LOAD REMEMBERED EMAIL
  ===================================================== */

  useEffect(() => {
    const savedEmail = localStorage.getItem("fleetflow_remember_email");

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);


  /* =====================================================
     LOGIN
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setInfoMessage("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      /* Remember email */

      if (rememberMe) {
        localStorage.setItem(
          "fleetflow_remember_email",
          email.trim()
        );
      } else {
        localStorage.removeItem(
          "fleetflow_remember_email"
        );
      }

      /* Existing authentication */

      await login(
        email.trim(),
        password
      );

      navigate("/dashboard");

    } catch (err) {

      console.error("Login error:", err);

      setError(
        err?.response?.data?.detail ||
          err?.detail ||
          "Unable to sign in. Please check your email and password."
      );

    } finally {

      setLoading(false);

    }
  };


  /* =====================================================
     FORGOT PASSWORD
  ===================================================== */

  const handleForgotPassword = (e) => {
    e.preventDefault();

    setError("");

    setInfoMessage(
      "Please contact your FleetFlow administrator to reset your password."
    );
  };


  return (
    <div className="login-page">

      {/* =================================================
          LEFT BRANDING SECTION
      ================================================= */}

      <section className="login-brand-section">

        <div className="brand-content">

          {/* BRAND */}

          <div className="brand-logo">

            <div className="brand-icon">
              🚚
            </div>

            <div>
              <h1>FleetFlow</h1>

              <span>
                Fleet Management Platform
              </span>
            </div>

          </div>


          {/* BRAND MESSAGE */}

          <div className="brand-message">

            <h2>
              Move smarter.
              <br />
              Deliver faster.
            </h2>

            <p>
              Manage vehicles, drivers, shipments,
              routes and fleet operations from one
              powerful platform.
            </p>

          </div>


          {/* =================================================
              FEATURES
          ================================================= */}

          <div className="login-features">

            <div className="feature-item">

              <div className="feature-icon">
                ✓
              </div>

              <div>

                <strong>
                  Real-time Fleet Monitoring
                </strong>

                <span>
                  Track your fleet operations in real time.
                </span>

              </div>

            </div>


            <div className="feature-item">

              <div className="feature-icon">
                ✓
              </div>

              <div>

                <strong>
                  Smart Logistics Management
                </strong>

                <span>
                  Manage shipments and driver assignments.
                </span>

              </div>

            </div>


            <div className="feature-item">

              <div className="feature-icon">
                ✓
              </div>

              <div>

                <strong>
                  Powerful Analytics
                </strong>

                <span>
                  Make better decisions with fleet insights.
                </span>

              </div>

            </div>

          </div>

        </div>


        {/* FOOTER */}

        <div className="brand-footer">

          © 2026 FleetFlow. All rights reserved.

        </div>

      </section>


      {/* =================================================
          RIGHT LOGIN SECTION
      ================================================= */}

      <main className="login-form-section">

        <div className="login-card">

          {/* =================================================
              MOBILE BRAND
          ================================================= */}

          <div className="mobile-brand">

            <div className="mobile-brand-icon">
              🚚
            </div>

            <div>

              <h1>
                FleetFlow
              </h1>

              <span>
                Fleet Management
              </span>

            </div>

          </div>


          {/* =================================================
              HEADER
          ================================================= */}

          <div className="login-header">

            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to your FleetFlow account
              to continue.
            </p>

          </div>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div
              className="login-error"
              role="alert"
            >

              <span className="error-icon">
                !
              </span>

              <span>
                {error}
              </span>

            </div>

          )}


          {/* =================================================
              INFORMATION MESSAGE
          ================================================= */}

          {infoMessage && (

            <div
              className="login-info"
              role="status"
            >

              <span className="info-icon">
                i
              </span>

              <span>
                {infoMessage}
              </span>

            </div>

          )}


          {/* =================================================
              LOGIN FORM
          ================================================= */}

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="email">
                Email address
              </label>

              <div className="input-wrapper">

                <span
                  className="input-icon"
                  aria-hidden="true"
                >
                  ✉
                </span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                    setInfoMessage("");
                  }}
                  disabled={loading}
                  autoComplete="email"
                  required
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="form-group">

              <div className="password-label">

                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  Forgot password?
                </button>

              </div>


              <div className="input-wrapper">

                <span
                  className="input-icon"
                  aria-hidden="true"
                >
                  🔒
                </span>

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                    setInfoMessage("");
                  }}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? "🙈" : "👁"}

                </button>

              </div>

            </div>


            {/* =================================================
                REMEMBER ME
            ================================================= */}

            <div className="login-options">

              <label className="remember-me">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(
                      e.target.checked
                    )
                  }
                  disabled={loading}
                />

                <span>
                  Remember my email
                </span>

              </label>

            </div>


            {/* =================================================
                LOGIN BUTTON
            ================================================= */}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >

              {loading ? (

                <>
                  <span className="login-spinner"></span>

                  Signing in...
                </>

              ) : (

                <>
                  Sign in

                  <span className="button-arrow">
                    →
                  </span>
                </>

              )}

            </button>

          </form>


          {/* =================================================
              REGISTER
          ================================================= */}

          <div className="register-section">

            <span>
              Don't have an account?
            </span>

            <Link to="/register">
              Create an account
            </Link>

          </div>


          {/* =================================================
              SECURITY
          ================================================= */}

          <div className="security-note">

            <span aria-hidden="true">
              🔐
            </span>

            <span>
              Secure authentication protected
              by JWT-based access control.
            </span>

          </div>

        </div>

      </main>

    </div>
  );
};

export default Login;