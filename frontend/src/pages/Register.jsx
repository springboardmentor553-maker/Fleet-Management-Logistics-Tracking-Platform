import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    role: "dispatcher",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // HANDLE INPUT
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ============================================================
  // REGISTER
  // ============================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Basic validation
    if (
      !formData.full_name.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirm_password
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/auth/register`,
        {
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
        }
      );

      console.log("Registration successful:", response.data);

      setSuccess("Account created successfully!");

      // Clear form
      setFormData({
        full_name: "",
        email: "",
        password: "",
        confirm_password: "",
        role: "dispatcher",
      });

      // Go to login after short delay
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (err) {
      console.error("Registration error:", err);

      let message = "Registration failed. Please try again.";

      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === "string") {
          message = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          message = err.response.data.detail
            .map((item) => item.msg || "Invalid input")
            .join(", ");
        }
      } else if (err.message) {
        message = err.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // GO TO LOGIN
  // ============================================================

  const goToLogin = () => {
    navigate("/");
  };

  return (
    <>
      <style>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          background: #f3f7fc;
        }

        /* =====================================================
           PAGE
        ===================================================== */

        .register-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(
              circle at 10% 10%,
              rgba(37, 99, 235, 0.08),
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 90%,
              rgba(37, 99, 235, 0.08),
              transparent 30%
            ),
            #f5f8fc;
        }

        /* =====================================================
           MAIN CARD
        ===================================================== */

        .register-card {
          width: min(1080px, 100%);
          height: 690px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: white;
          border-radius: 22px;
          overflow: hidden;
          box-shadow:
            0 20px 60px rgba(15, 23, 42, 0.12),
            0 4px 15px rgba(15, 23, 42, 0.05);
        }

        /* =====================================================
           LEFT PANEL
        ===================================================== */

        .register-left {
          position: relative;
          overflow: hidden;
          padding: 48px 50px;
          color: white;
          background:
            linear-gradient(
              145deg,
              #17499f 0%,
              #1f5ac6 50%,
              #2563eb 100%
            );
        }

        .register-left::before {
          content: "";
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          right: -130px;
          top: -120px;
          background: rgba(255, 255, 255, 0.08);
        }

        .register-left::after {
          content: "";
          position: absolute;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          left: -130px;
          bottom: -130px;
          background: rgba(255, 255, 255, 0.06);
        }

        /* =====================================================
           BRAND
        ===================================================== */

        .brand {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .brand-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .brand-name {
          font-size: 25px;
          font-weight: 750;
          letter-spacing: -0.5px;
        }

        .brand-subtitle {
          margin-top: 3px;
          font-size: 11px;
          letter-spacing: 1px;
          opacity: 0.78;
          font-weight: 600;
        }

        /* =====================================================
           LEFT CONTENT
        ===================================================== */

        .left-content {
          position: relative;
          z-index: 2;
          margin-top: 90px;
        }

        .left-content h1 {
          margin: 0;
          max-width: 450px;
          font-size: 46px;
          line-height: 1.08;
          letter-spacing: -1.5px;
          font-weight: 800;
        }

        .left-content p {
          max-width: 430px;
          margin: 24px 0 0;
          font-size: 16px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.84);
        }

        /* =====================================================
           FEATURES
        ===================================================== */

        .features {
          position: absolute;
          z-index: 2;
          left: 50px;
          bottom: 42px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.92);
        }

        .feature-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          font-size: 14px;
        }

        /* =====================================================
           RIGHT PANEL
        ===================================================== */

        .register-right {
          padding: 42px 58px 32px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #ffffff;
        }

        .register-heading {
          margin-bottom: 20px;
        }

        .register-heading h2 {
          margin: 0;
          color: #10213f;
          font-size: 30px;
          line-height: 1.15;
          font-weight: 750;
          letter-spacing: -0.8px;
        }

        .register-heading p {
          margin: 7px 0 0;
          color: #71809a;
          font-size: 14px;
        }

        /* =====================================================
           LOGIN / REGISTER SWITCH
        ===================================================== */

        .auth-switch {
          width: 100%;
          height: 48px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          padding: 4px;
          margin-bottom: 20px;
          border-radius: 11px;
          background: #eef3f8;
        }

        .switch-button {
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #63728a;
          font-size: 14px;
          font-weight: 650;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .switch-button:hover {
          color: #2563eb;
        }

        .switch-button.active {
          background: white;
          color: #174db1;
          box-shadow:
            0 2px 7px rgba(15, 23, 42, 0.1);
        }

        /* =====================================================
           FORM
        ===================================================== */

        .register-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* =====================================================
           INPUT BOX
        ===================================================== */

        .input-box {
          width: 100%;
          height: 48px;
          display: flex;
          align-items: center;
          position: relative;
          border: 1px solid #d9e1eb;
          border-radius: 10px;
          background: #ffffff;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .input-box:focus-within {
          border-color: #2563eb;
          box-shadow:
            0 0 0 3px rgba(37, 99, 235, 0.08);
        }

        .input-icon {
          width: 46px;
          min-width: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6d7d95;
          font-size: 16px;
        }

        .input-box input,
        .input-box select {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: #17243a;
          font-size: 14px;
          padding: 0 14px 0 0;
          font-family: inherit;
        }

        .input-box input::placeholder {
          color: #8a96a8;
        }

        .input-box select {
          cursor: pointer;
          appearance: auto;
        }

        /* =====================================================
           PASSWORD BUTTON
        ===================================================== */

        .password-toggle {
          width: 42px;
          height: 100%;
          border: none;
          background: transparent;
          color: #7b899d;
          cursor: pointer;
          font-size: 14px;
          flex-shrink: 0;
        }

        .password-toggle:hover {
          color: #2563eb;
        }

        /* =====================================================
           MESSAGE
        ===================================================== */

        .message {
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 12px;
          line-height: 1.4;
          margin-top: 2px;
        }

        .error-message {
          color: #b42318;
          background: #fff1f0;
          border: 1px solid #ffd5d2;
        }

        .success-message {
          color: #137333;
          background: #edf9f0;
          border: 1px solid #c8e8cf;
        }

        /* =====================================================
           SUBMIT
        ===================================================== */

        .submit-button {
          width: 100%;
          height: 48px;
          margin-top: 5px;
          border: none;
          border-radius: 10px;
          background:
            linear-gradient(
              135deg,
              #2563eb,
              #1d4ed8
            );
          color: white;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow:
            0 8px 18px rgba(37, 99, 235, 0.18);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow:
            0 10px 22px rgba(37, 99, 235, 0.24);
        }

        .submit-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        /* =====================================================
           BOTTOM TEXT
        ===================================================== */

        .login-link {
          margin-top: 14px;
          text-align: center;
          font-size: 13px;
          color: #71809a;
        }

        .login-link button {
          border: none;
          padding: 0;
          background: transparent;
          color: #2563eb;
          font-size: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .login-link button:hover {
          text-decoration: underline;
        }

        /* =====================================================
           FOOTER
        ===================================================== */

        .footer {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid #edf0f4;
          text-align: center;
          color: #9aa6b7;
          font-size: 11px;
        }

        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 900px) {

          .register-page {
            padding: 18px;
          }

          .register-card {
            width: 100%;
            height: 660px;
          }

          .register-left {
            padding: 40px;
          }

          .left-content {
            margin-top: 70px;
          }

          .left-content h1 {
            font-size: 38px;
          }

          .register-right {
            padding: 35px 40px 28px;
          }

        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 700px) {

          .register-page {
            min-height: 100vh;
            padding: 12px;
            align-items: flex-start;
          }

          .register-card {
            height: auto;
            min-height: auto;
            grid-template-columns: 1fr;
            border-radius: 16px;
          }

          .register-left {
            display: none;
          }

          .register-right {
            padding: 30px 24px 24px;
          }

          .register-heading h2 {
            font-size: 26px;
          }

          .input-box {
            height: 46px;
          }

          .submit-button {
            height: 46px;
          }

        }

      `}</style>

      <div className="register-page">

        <div className="register-card">

          {/* ==================================================
              LEFT SIDE
          ================================================== */}

          <div className="register-left">

            <div className="brand">
              <div className="brand-icon">
                🚚
              </div>

              <div>
                <div className="brand-name">
                  FleetFlow
                </div>

                <div className="brand-subtitle">
                  FLEET MANAGEMENT PLATFORM
                </div>
              </div>
            </div>

            <div className="left-content">

              <h1>
                Manage your fleet.
                <br />
                Move smarter.
              </h1>

              <p>
                A powerful platform to manage vehicles,
                drivers, shipments, routes and real-time
                fleet operations from one place.
              </p>

            </div>

            <div className="features">

              <div className="feature">
                <span className="feature-icon">
                  ✓
                </span>
                <span>
                  Real-time fleet tracking
                </span>
              </div>

              <div className="feature">
                <span className="feature-icon">
                  ✓
                </span>
                <span>
                  Driver & vehicle management
                </span>
              </div>

              <div className="feature">
                <span className="feature-icon">
                  ✓
                </span>
                <span>
                  Analytics and intelligent reports
                </span>
              </div>

            </div>

          </div>

          {/* ==================================================
              RIGHT SIDE
          ================================================== */}

          <div className="register-right">

            <div className="register-heading">

              <h2>
                Create your account
              </h2>

              <p>
                Join FleetFlow and manage your fleet smarter.
              </p>

            </div>

            {/* LOGIN / SIGNUP SWITCH */}

            <div className="auth-switch">

              <button
                type="button"
                className="switch-button"
                onClick={goToLogin}
              >
                Sign In
              </button>

              <button
                type="button"
                className="switch-button active"
              >
                Create Account
              </button>

            </div>

            {/* ==================================================
                FORM
            ================================================== */}

            <form
              className="register-form"
              onSubmit={handleRegister}
            >

              {/* Full Name */}

              <div className="input-box">

                <span className="input-icon">
                  👤
                </span>

                <input
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  autoComplete="name"
                />

              </div>

              {/* Email */}

              <div className="input-box">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  autoComplete="email"
                />

              </div>

              {/* Password */}

              <div className="input-box">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  aria-label="Toggle password"
                >
                  {showPassword ? "◉" : "○"}
                </button>

              </div>

              {/* Confirm Password */}

              <div className="input-box">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  name="confirm_password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    formData.confirm_password
                  }
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  aria-label="Toggle confirm password"
                >
                  {showConfirmPassword
                    ? "◉"
                    : "○"}
                </button>

              </div>

              {/* Account Role */}

              <div className="input-box">

                <span className="input-icon">
                  ◈
                </span>

                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >

                  <option value="dispatcher">
                    Dispatcher
                  </option>

                  <option value="manager">
                    Fleet Manager
                  </option>

                  <option value="driver">
                    Driver
                  </option>

                  <option value="admin">
                    Admin
                  </option>

                </select>

              </div>

              {/* Error */}

              {error && (
                <div className="message error-message">
                  {error}
                </div>
              )}

              {/* Success */}

              {success && (
                <div className="message success-message">
                  {success}
                </div>
              )}

              {/* Create Account */}

              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account"}
              </button>

            </form>

            {/* Login link */}

            <div className="login-link">

              Already have an account?{" "}

              <button
                type="button"
                onClick={goToLogin}
              >
                Sign in
              </button>

            </div>

            {/* Footer */}

            <div className="footer">
              © 2026 FleetFlow · Fleet Management &
              Logistics Platform
            </div>

          </div>

        </div>

      </div>
    </>
  );
}

export default Register;