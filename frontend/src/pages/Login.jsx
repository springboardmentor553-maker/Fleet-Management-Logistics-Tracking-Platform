import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSignup, setIsSignup] = useState(
    location.pathname === "/register"
  );

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Registration
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("dispatcher");

  const [showLoginPassword, setShowLoginPassword] =
    useState(false);

  const [showSignupPassword, setShowSignupPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // =========================================================
  // SWITCH LOGIN / SIGNUP
  // =========================================================

  const switchMode = (signup) => {
    setIsSignup(signup);

    setMessage("");
    setMessageType("");

    navigate(signup ? "/register" : "/");
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setMessage("Please enter your email and password.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      const formData = new URLSearchParams();

      formData.append(
        "username",
        loginEmail.trim()
      );

      formData.append(
        "password",
        loginPassword
      );

      const response = await axios.post(
        `${API_URL}/auth/login`,
        formData,
        {
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
        }
      );

      const data = response.data;

      localStorage.setItem(
        "token",
        data.access_token
      );

      localStorage.setItem(
        "role",
        data.role
      );

      localStorage.setItem(
        "email",
        data.email
      );

      localStorage.setItem(
        "full_name",
        data.full_name || ""
      );

      setMessage("Login successful.");
      setMessageType("success");

      setTimeout(() => {
        navigate("/dashboard");
      }, 500);

    } catch (error) {
      console.error("Login Error:", error);

      let errorMessage =
        "Invalid email or password.";

      if (error.response?.data?.detail) {
        const detail =
          error.response.data.detail;

        if (typeof detail === "string") {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail
            .map(
              (item) =>
                item?.msg || "Invalid input"
            )
            .join(", ");
        }
      }

      setMessage(errorMessage);
      setMessageType("error");

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // REGISTER
  // =========================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    if (!fullName.trim()) {
      setMessage("Please enter your full name.");
      setMessageType("error");
      return;
    }

    if (!signupEmail.trim()) {
      setMessage("Please enter your email address.");
      setMessageType("error");
      return;
    }

    if (!signupPassword) {
      setMessage("Please enter a password.");
      setMessageType("error");
      return;
    }

    if (signupPassword.length < 6) {
      setMessage(
        "Password must contain at least 6 characters."
      );
      setMessageType("error");
      return;
    }

    if (signupPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/auth/register`,
        {
          full_name: fullName.trim(),
          email: signupEmail.trim(),
          password: signupPassword,
          role: role,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        "Registration successful:",
        response.data
      );

      setMessage(
        "Account created successfully. Please sign in."
      );

      setMessageType("success");

      setFullName("");
      setSignupEmail("");
      setSignupPassword("");
      setConfirmPassword("");
      setRole("dispatcher");

      setTimeout(() => {
        setIsSignup(false);
        navigate("/");
      }, 1200);

    } catch (error) {
      console.error(
        "Registration Error:",
        error
      );

      let errorMessage =
        "Registration failed.";

      if (error.response?.data?.detail) {
        const detail =
          error.response.data.detail;

        if (typeof detail === "string") {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail
            .map(
              (item) =>
                item?.msg ||
                "Invalid registration data"
            )
            .join(", ");
        } else if (
          typeof detail === "object"
        ) {
          errorMessage =
            detail.msg ||
            "Invalid registration data.";
        }
      }

      setMessage(errorMessage);
      setMessageType("error");

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SHARED STYLES
  // =========================================================

  const inputWrapper = {
    position: "relative",
    marginBottom: "18px",
  };

  const inputIcon = {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "17px",
    color: "#64748b",
    pointerEvents: "none",
  };

  const inputStyle = {
    width: "100%",
    height: "52px",
    padding:
      "0 48px 0 45px",
    boxSizing: "border-box",
    border: "1px solid #d8dee8",
    borderRadius: "10px",
    outline: "none",
    fontSize: "15px",
    color: "#0f172a",
    background: "#ffffff",
    transition: "all 0.2s ease",
  };

  const passwordButton = {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "16px",
    color: "#64748b",
    padding: "5px",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "7px",
  };

  const primaryButton = {
    width: "100%",
    height: "52px",
    border: "none",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: loading
      ? "not-allowed"
      : "pointer",
    opacity: loading ? 0.75 : 1,
    boxShadow:
      "0 8px 20px rgba(37, 99, 235, 0.22)",
    transition: "all 0.2s ease",
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #eef2ff 100%)",
        padding: "30px",
        boxSizing: "border-box",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >

      {/* =====================================================
          MAIN CONTAINER
      ===================================================== */}

      <div
        style={{
          width: "100%",
          maxWidth: "1050px",
          minHeight: "620px",
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          background: "#ffffff",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow:
            "0 25px 70px rgba(15, 23, 42, 0.12)",
          border:
            "1px solid rgba(226,232,240,0.8)",
        }}
      >

        {/* ===================================================
            LEFT BRANDING SECTION
        =================================================== */}

        <div
          style={{
            position: "relative",
            padding: "55px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background:
              "linear-gradient(145deg, #0f3d91 0%, #1558c0 48%, #2563eb 100%)",
            color: "#ffffff",
            overflow: "hidden",
          }}
        >

          {/* Decorative circles */}

          <div
            style={{
              position: "absolute",
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              background:
                "rgba(255,255,255,0.06)",
              right: "-130px",
              top: "-100px",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background:
                "rgba(255,255,255,0.05)",
              left: "-100px",
              bottom: "-80px",
            }}
          />

          {/* Brand */}

          <div
            style={{
              position: "relative",
              zIndex: 2,
            }}
          >

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "13px",
                marginBottom: "65px",
              }}
            >

              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "13px",
                  background:
                    "rgba(255,255,255,0.16)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "25px",
                  border:
                    "1px solid rgba(255,255,255,0.2)",
                }}
              >
                🚚
              </div>

              <div>
                <div
                  style={{
                    fontSize: "25px",
                    fontWeight: "800",
                    letterSpacing: "-0.5px",
                  }}
                >
                  FleetFlow
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    opacity: 0.75,
                    letterSpacing: "1px",
                    textTransform:
                      "uppercase",
                  }}
                >
                  Fleet Management Platform
                </div>
              </div>

            </div>

            <div
              style={{
                maxWidth: "420px",
              }}
            >

              <h1
                style={{
                  fontSize: "42px",
                  lineHeight: "1.1",
                  margin: "0 0 20px",
                  fontWeight: "800",
                  letterSpacing:
                    "-1.5px",
                }}
              >
                Manage your fleet.
                <br />
                Move smarter.
              </h1>

              <p
                style={{
                  fontSize: "16px",
                  lineHeight: "1.7",
                  opacity: 0.85,
                  margin: 0,
                }}
              >
                A powerful platform to manage
                vehicles, drivers, shipments,
                routes and real-time fleet
                operations from one place.
              </p>

            </div>

          </div>

          {/* Features */}

          <div
            style={{
              position: "relative",
              zIndex: 2,
              marginTop: "50px",
            }}
          >

            {[
              [
                "✓",
                "Real-time fleet tracking",
              ],
              [
                "✓",
                "Driver & vehicle management",
              ],
              [
                "✓",
                "Analytics and intelligent reports",
              ],
            ].map(
              ([icon, text]) => (
                <div
                  key={text}
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: "12px",
                    marginBottom:
                      "16px",
                    fontSize: "14px",
                    opacity: 0.92,
                  }}
                >

                  <span
                    style={{
                      width: "25px",
                      height: "25px",
                      borderRadius: "50%",
                      background:
                        "rgba(255,255,255,0.14)",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      fontSize: "13px",
                    }}
                  >
                    {icon}
                  </span>

                  {text}

                </div>
              )
            )}

          </div>

        </div>

        {/* ===================================================
            RIGHT AUTH SECTION
        =================================================== */}

        <div
          style={{
            padding:
              "55px 65px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: "400px",
            }}
          >

            {/* Header */}

            <div
              style={{
                marginBottom: "28px",
              }}
            >

              <h2
                style={{
                  margin:
                    "0 0 8px",
                  fontSize: "30px",
                  fontWeight: "750",
                  color: "#0f172a",
                  letterSpacing:
                    "-0.8px",
                }}
              >
                {isSignup
                  ? "Create your account"
                  : "Welcome back"}
              </h2>

              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#64748b",
                }}
              >
                {isSignup
                  ? "Join FleetFlow and manage your fleet smarter."
                  : "Sign in to continue to your FleetFlow workspace."}
              </p>

            </div>

            {/* Login / Signup tabs */}

            <div
              style={{
                display: "flex",
                padding: "4px",
                background: "#f1f5f9",
                borderRadius: "10px",
                marginBottom: "28px",
              }}
            >

              <button
                type="button"
                onClick={() =>
                  switchMode(false)
                }
                style={{
                  flex: 1,
                  height: "42px",
                  border: "none",
                  borderRadius: "7px",
                  background:
                    !isSignup
                      ? "#ffffff"
                      : "transparent",
                  color:
                    !isSignup
                      ? "#1d4ed8"
                      : "#64748b",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow:
                    !isSignup
                      ? "0 2px 6px rgba(15,23,42,0.08)"
                      : "none",
                }}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() =>
                  switchMode(true)
                }
                style={{
                  flex: 1,
                  height: "42px",
                  border: "none",
                  borderRadius: "7px",
                  background:
                    isSignup
                      ? "#ffffff"
                      : "transparent",
                  color:
                    isSignup
                      ? "#1d4ed8"
                      : "#64748b",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow:
                    isSignup
                      ? "0 2px 6px rgba(15,23,42,0.08)"
                      : "none",
                }}
              >
                Create Account
              </button>

            </div>

            {/* Message */}

            {message && (
              <div
                style={{
                  padding:
                    "11px 13px",
                  borderRadius: "9px",
                  marginBottom:
                    "18px",
                  fontSize: "13px",
                  lineHeight: "1.4",
                  background:
                    messageType ===
                    "success"
                      ? "#ecfdf3"
                      : "#fef2f2",
                  color:
                    messageType ===
                    "success"
                      ? "#15803d"
                      : "#dc2626",
                  border:
                    messageType ===
                    "success"
                      ? "1px solid #bbf7d0"
                      : "1px solid #fecaca",
                }}
              >
                {message}
              </div>
            )}

            {/* =================================================
                LOGIN
            ================================================= */}

            {!isSignup ? (

              <form onSubmit={handleLogin}>

                <label style={labelStyle}>
                  Email Address
                </label>

                <div style={inputWrapper}>

                  <span style={inputIcon}>
                    ✉
                  </span>

                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={loginEmail}
                    onChange={(e) =>
                      setLoginEmail(
                        e.target.value
                      )
                    }
                    style={inputStyle}
                    autoComplete="email"
                  />

                </div>

                <label style={labelStyle}>
                  Password
                </label>

                <div style={inputWrapper}>

                  <span style={inputIcon}>
                    🔒
                  </span>

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
                    style={inputStyle}
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    style={passwordButton}
                    onClick={() =>
                      setShowLoginPassword(
                        !showLoginPassword
                      )
                    }
                  >
                    {showLoginPassword
                      ? "◉"
                      : "◌"}
                  </button>

                </div>

                <div
                  style={{
                    textAlign: "right",
                    margin:
                      "-3px 0 20px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#2563eb",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                    onClick={() =>
                      setMessage(
                        "Password reset is not configured yet."
                      )
                    }
                  >
                    Forgot password?
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={primaryButton}
                >
                  {loading
                    ? "Signing in..."
                    : "Sign In"}
                </button>

                <div
                  style={{
                    textAlign:
                      "center",
                    marginTop:
                      "22px",
                    fontSize:
                      "13px",
                    color:
                      "#64748b",
                  }}
                >
                  Don't have an account?

                  <span
                    onClick={() =>
                      switchMode(true)
                    }
                    style={{
                      marginLeft:
                        "5px",
                      color:
                        "#2563eb",
                      fontWeight:
                        "700",
                      cursor:
                        "pointer",
                    }}
                  >
                    Create one
                  </span>
                </div>

              </form>

            ) : (

              /* ===============================================
                 SIGNUP
              =============================================== */

              <form onSubmit={handleRegister}>

                <label style={labelStyle}>
                  Full Name
                </label>

                <div style={inputWrapper}>

                  <span style={inputIcon}>
                    👤
                  </span>

                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(
                        e.target.value
                      )
                    }
                    style={inputStyle}
                    autoComplete="name"
                  />

                </div>

                <label style={labelStyle}>
                  Email Address
                </label>

                <div style={inputWrapper}>

                  <span style={inputIcon}>
                    ✉
                  </span>

                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={signupEmail}
                    onChange={(e) =>
                      setSignupEmail(
                        e.target.value
                      )
                    }
                    style={inputStyle}
                    autoComplete="email"
                  />

                </div>

                <label style={labelStyle}>
                  Password
                </label>

                <div style={inputWrapper}>

                  <span style={inputIcon}>
                    🔒
                  </span>

                  <input
                    type={
                      showSignupPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Create a password"
                    value={signupPassword}
                    onChange={(e) =>
                      setSignupPassword(
                        e.target.value
                      )
                    }
                    style={inputStyle}
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    style={passwordButton}
                    onClick={() =>
                      setShowSignupPassword(
                        !showSignupPassword
                      )
                    }
                  >
                    {showSignupPassword
                      ? "◉"
                      : "◌"}
                  </button>

                </div>

                <label style={labelStyle}>
                  Confirm Password
                </label>

                <div style={inputWrapper}>

                  <span style={inputIcon}>
                    🔒
                  </span>

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm your password"
                    value={
                      confirmPassword
                    }
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    style={inputStyle}
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    style={passwordButton}
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                  >
                    {showConfirmPassword
                      ? "◉"
                      : "◌"}
                  </button>

                </div>

                <label style={labelStyle}>
                  Account Role
                </label>

                <div
                  style={{
                    position:
                      "relative",
                    marginBottom:
                      "20px",
                  }}
                >

                  <span
                    style={{
                      ...inputIcon,
                      zIndex: 1,
                    }}
                  >
                    ◈
                  </span>

                  <select
                    value={role}
                    onChange={(e) =>
                      setRole(
                        e.target.value
                      )
                    }
                    style={{
                      ...inputStyle,
                      paddingLeft:
                        "45px",
                      cursor:
                        "pointer",
                    }}
                  >
                    <option value="dispatcher">
                      Dispatcher
                    </option>

                    <option value="driver">
                      Driver
                    </option>

                    <option value="manager">
                      Fleet Manager
                    </option>

                    <option value="admin">
                      Administrator
                    </option>
                  </select>

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={primaryButton}
                >
                  {loading
                    ? "Creating account..."
                    : "Create Account"}
                </button>

                <div
                  style={{
                    textAlign:
                      "center",
                    marginTop:
                      "22px",
                    fontSize:
                      "13px",
                    color:
                      "#64748b",
                  }}
                >
                  Already have an account?

                  <span
                    onClick={() =>
                      switchMode(false)
                    }
                    style={{
                      marginLeft:
                        "5px",
                      color:
                        "#2563eb",
                      fontWeight:
                        "700",
                      cursor:
                        "pointer",
                    }}
                  >
                    Sign in
                  </span>
                </div>

              </form>
            )}

            {/* Footer */}

            <div
              style={{
                textAlign: "center",
                marginTop: "30px",
                paddingTop: "18px",
                borderTop:
                  "1px solid #eef2f7",
                fontSize: "11px",
                color: "#94a3b8",
              }}
            >
              © 2026 FleetFlow · Fleet Management &
              Logistics Platform
            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          RESPONSIVE STYLE
      ===================================================== */}

      <style>
        {`
          @media (max-width: 850px) {
            .fleetflow-auth-container {
              grid-template-columns: 1fr !important;
              max-width: 520px !important;
            }

            .fleetflow-brand-section {
              display: none !important;
            }
          }

          @media (max-width: 550px) {
            body {
              margin: 0;
            }

            .fleetflow-auth-container {
              border-radius: 16px !important;
              min-height: auto !important;
            }

            input,
            select,
            button {
              font-size: 14px;
            }
          }
        `}
      </style>

    </div>
  );
}

export default Login;