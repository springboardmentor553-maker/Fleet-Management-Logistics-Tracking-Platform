import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/authService";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "Driver",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const validateForm = () => {
    if (formData.full_name.trim().length < 2) {
      setError("Please enter your full name.");
      return false;
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const response = await registerUser(formData);

      setSuccess(
        response?.message || "Account created successfully!"
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      console.error("Registration error:", err);
      console.error("Response:", err.response);

      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      {/* =====================================
          LEFT BRAND SECTION
      ===================================== */}

      <section className="register-brand">

        <div className="brand-content">

          <div className="brand-logo">
            <div className="brand-icon">🚚</div>
            <span>FleetFlow</span>
          </div>

          <div className="brand-message">

            <h1>
              Manage your fleet.
              <br />
              <span>Move smarter.</span>
            </h1>

            <p>
              A complete fleet management and logistics
              tracking platform designed to help you
              manage vehicles, drivers, shipments and
              operations efficiently.
            </p>

          </div>

          <div className="brand-features">

            <div className="brand-feature">
              <span className="feature-icon">✓</span>
              <div>
                <strong>Fleet Management</strong>
                <small>Monitor vehicles and fleet activity</small>
              </div>
            </div>

            <div className="brand-feature">
              <span className="feature-icon">✓</span>
              <div>
                <strong>Shipment Tracking</strong>
                <small>Track deliveries in real time</small>
              </div>
            </div>

            <div className="brand-feature">
              <span className="feature-icon">✓</span>
              <div>
                <strong>Operational Analytics</strong>
                <small>Make data-driven decisions</small>
              </div>
            </div>

          </div>

        </div>

      </section>


      {/* =====================================
          REGISTER SECTION
      ===================================== */}

      <section className="register-section">

        <div className="register-card">

          {/* Header */}

          <div className="register-header">

            <div className="mobile-brand">
              <span className="mobile-brand-icon">🚚</span>
              FleetFlow
            </div>

            <h2>Create your account</h2>

            <p>
              Join FleetFlow and start managing your
              fleet operations.
            </p>

          </div>


          {/* Error */}

          {error && (
            <div className="register-alert error-alert">
              <span className="alert-icon">!</span>
              <span>{error}</span>
            </div>
          )}


          {/* Success */}

          {success && (
            <div className="register-alert success-alert">
              <span className="alert-icon">✓</span>
              <span>{success}</span>
            </div>
          )}


          {/* Form */}

          <form
            className="register-form"
            onSubmit={handleSubmit}
          >

            {/* Full Name */}

            <div className="form-group">

              <label htmlFor="full_name">
                Full Name
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  👤
                </span>

                <input
                  id="full_name"
                  type="text"
                  name="full_name"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={handleChange}
                  autoComplete="name"
                  disabled={loading}
                  required
                />

              </div>

            </div>


            {/* Email */}

            <div className="form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={loading}
                  required
                />

              </div>

            </div>


            {/* Password */}

            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
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

              <span className="input-hint">
                Use at least 6 characters
              </span>

            </div>


            {/* Role */}

            <div className="form-group">

              <label htmlFor="role">
                Account Role
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  💼
                </span>

                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="Driver">
                    Driver
                  </option>

                  <option value="Dispatcher">
                    Dispatcher
                  </option>

                  <option value="Fleet Manager">
                    Fleet Manager
                  </option>

                  <option value="Admin">
                    Admin
                  </option>
                </select>

              </div>

            </div>


            {/* Terms */}

            <div className="terms-row">

              <input
                type="checkbox"
                id="terms"
                required
                disabled={loading}
              />

              <label htmlFor="terms">
                I agree to the{" "}
                <span>Terms of Service</span>{" "}
                and{" "}
                <span>Privacy Policy</span>
              </label>

            </div>


            {/* Submit */}

            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <span className="button-arrow">
                    →
                  </span>
                </>
              )}

            </button>

          </form>


          {/* Login */}

          <div className="login-link">

            <span>
              Already have an account?
            </span>

            <Link to="/login">
              Sign in
            </Link>

          </div>


          <div className="security-note">
            🔒 Your information is securely protected
          </div>

        </div>

      </section>

    </div>
  );
}