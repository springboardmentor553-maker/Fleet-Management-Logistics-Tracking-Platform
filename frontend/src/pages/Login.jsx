import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";
import { toast } from "react-toastify";

import {
  FaTruck,
  FaEnvelope,
  FaLock,
  FaSignInAlt,
} from "react-icons/fa";


function Login() {

  // =====================================================
  // STATES
  // =====================================================

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const navigate =
    useNavigate();


  // =====================================================
  // LOGIN
  // =====================================================

  const login = async (e) => {

    e.preventDefault();

    // Prevent empty submission
    if (!email.trim() || !password.trim()) {

      toast.error(
        "Please enter email and password"
      );

      return;
    }


    try {

      setLoading(true);


      // =================================================
      // FastAPI OAuth2 Form Data
      // =================================================

      const formData =
        new URLSearchParams();

      formData.append(
        "username",
        email.trim()
      );

      formData.append(
        "password",
        password
      );


      // =================================================
      // LOGIN API
      // =================================================

      const response =
        await api.post(
          "/auth/login",
          formData,
          {
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
            },
          }
        );


      console.log(
        "Login Response:",
        response.data
      );


      // =================================================
      // CHECK ACCESS TOKEN
      // =================================================

      if (
        !response.data ||
        !response.data.access_token
      ) {

        toast.error(
          "Login failed. Access token not received."
        );

        return;
      }


      // =================================================
      // SAVE AUTHENTICATION DATA
      // =================================================

      localStorage.setItem(
        "token",
        response.data.access_token
      );


      if (response.data.role) {

        localStorage.setItem(
          "role",
          response.data.role
        );

      }


      if (response.data.name) {

        localStorage.setItem(
          "name",
          response.data.name
        );

      }


      if (response.data.email) {

        localStorage.setItem(
          "email",
          response.data.email
        );

      }


      // =================================================
      // SUCCESS
      // =================================================

      toast.success(
        "Login Successful"
      );


      // =================================================
      // GO TO DASHBOARD
      // =================================================

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


      // =================================================
      // ERROR MESSAGE
      // =================================================

      let message =
        "Invalid Email or Password";


      if (
        error.response?.data?.detail
      ) {

        const detail =
          error.response.data.detail;


        if (
          typeof detail ===
          "string"
        ) {

          message =
            detail;

        }

      }


      toast.error(
        message
      );


    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // UI
  // =====================================================

  return (

    <div
      style={{
        minHeight:
          "100vh",

        background:
          "linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #e0e7ff 100%)",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        padding:
          "20px",

        position:
          "relative",

        overflow:
          "hidden",
      }}
    >


      {/* =================================================
          BACKGROUND DECORATION
      ================================================= */}

      <div
        style={{
          position:
            "absolute",

          width:
            "350px",

          height:
            "350px",

          background:
            "rgba(37, 99, 235, 0.08)",

          borderRadius:
            "50%",

          top:
            "-120px",

          left:
            "-100px",

          pointerEvents:
            "none",
        }}
      />


      <div
        style={{
          position:
            "absolute",

          width:
            "300px",

          height:
            "300px",

          background:
            "rgba(99, 102, 241, 0.08)",

          borderRadius:
            "50%",

          bottom:
            "-100px",

          right:
            "-80px",

          pointerEvents:
            "none",
        }}
      />


      {/* =================================================
          LOGIN CARD
      ================================================= */}

      <div
        className="card border-0"
        style={{
          width:
            "430px",

          maxWidth:
            "100%",

          borderRadius:
            "20px",

          boxShadow:
            "0 20px 50px rgba(15, 23, 42, 0.12)",

          position:
            "relative",

          zIndex:
            2,

          overflow:
            "hidden",
        }}
      >


        {/* =================================================
            TOP BRAND SECTION
        ================================================= */}

        <div
          style={{
            background:
              "linear-gradient(135deg, #2563eb, #1d4ed8)",

            padding:
              "32px 25px",

            textAlign:
              "center",

            color:
              "white",
          }}
        >

          {/* LOGO */}

          <div
            style={{
              width:
                "65px",

              height:
                "65px",

              background:
                "rgba(255,255,255,0.15)",

              borderRadius:
                "18px",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              margin:
                "0 auto 15px",

              fontSize:
                "30px",

              boxShadow:
                "0 8px 20px rgba(0,0,0,0.12)",
            }}
          >

            <FaTruck />

          </div>


          {/* TITLE */}

          <h2
            className="fw-bold mb-1"
            style={{
              letterSpacing:
                "0.5px",
            }}
          >
            FleetFlow
          </h2>


          {/* SUBTITLE */}

          <p
            className="mb-0"
            style={{
              opacity:
                0.85,

              fontSize:
                "14px",
            }}
          >
            Fleet Management &
            Logistics Platform
          </p>

        </div>


        {/* =================================================
            FORM SECTION
        ================================================= */}

        <div
          className="card-body p-4 p-md-5"
        >


          {/* WELCOME */}

          <div
            className="text-center mb-4"
          >

            <h4
              className="fw-bold mb-1"
              style={{
                color:
                  "#172033",
              }}
            >
              Welcome Back
            </h4>


            <p
              className="text-muted mb-0"
            >
              Sign in to manage your fleet
            </p>

          </div>


          {/* =================================================
              LOGIN FORM
          ================================================= */}

          <form
            onSubmit={
              login
            }
          >


            {/* =================================================
                EMAIL
            ================================================= */}

            <div
              className="mb-4"
            >

              <label
                htmlFor="login-email"
                className="form-label fw-semibold"
                style={{
                  color:
                    "#334155",
                }}
              >
                Email Address
              </label>


              <div
                style={{
                  position:
                    "relative",
                }}
              >

                <FaEnvelope
                  style={{
                    position:
                      "absolute",

                    left:
                      "15px",

                    top:
                      "50%",

                    transform:
                      "translateY(-50%)",

                    color:
                      "#64748b",

                    zIndex:
                      2,
                  }}
                />


                <input
                  id="login-email"
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={
                    email
                  }
                  onChange={
                    (e) =>
                      setEmail(
                        e.target.value
                      )
                  }
                  autoComplete="email"
                  required
                  disabled={
                    loading
                  }
                  style={{
                    height:
                      "50px",

                    paddingLeft:
                      "43px",

                    borderRadius:
                      "10px",

                    border:
                      "1px solid #dbe3ef",
                  }}
                />

              </div>

            </div>


            {/* =================================================
                PASSWORD
            ================================================= */}

            <div
              className="mb-4"
            >

              <label
                htmlFor="login-password"
                className="form-label fw-semibold"
                style={{
                  color:
                    "#334155",
                }}
              >
                Password
              </label>


              <div
                style={{
                  position:
                    "relative",
                }}
              >

                <FaLock
                  style={{
                    position:
                      "absolute",

                    left:
                      "15px",

                    top:
                      "50%",

                    transform:
                      "translateY(-50%)",

                    color:
                      "#64748b",

                    zIndex:
                      2,
                  }}
                />


                <input
                  id="login-password"
                  type="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={
                    password
                  }
                  onChange={
                    (e) =>
                      setPassword(
                        e.target.value
                      )
                  }
                  autoComplete="current-password"
                  required
                  disabled={
                    loading
                  }
                  style={{
                    height:
                      "50px",

                    paddingLeft:
                      "43px",

                    borderRadius:
                      "10px",

                    border:
                      "1px solid #dbe3ef",
                  }}
                />

              </div>

            </div>


            {/* =================================================
                LOGIN BUTTON
            ================================================= */}

            <button
              type="submit"
              className="btn w-100"
              disabled={
                loading
              }
              style={{
                height:
                  "50px",

                borderRadius:
                  "10px",

                background:
                  loading
                    ? "#64748b"
                    : "linear-gradient(135deg, #2563eb, #1d4ed8)",

                color:
                  "white",

                border:
                  "none",

                fontWeight:
                  "600",

                fontSize:
                  "15px",

                boxShadow:
                  "0 6px 15px rgba(37,99,235,0.25)",

                cursor:
                  loading
                    ? "not-allowed"
                    : "pointer",
              }}
            >

              {loading ? (

                <>

                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />

                  Signing In...

                </>

              ) : (

                <>

                  <FaSignInAlt
                    className="me-2"
                  />

                  Sign In

                </>

              )}

            </button>

          </form>


          {/* =================================================
              FOOTER
          ================================================= */}

          <div
            className="text-center mt-4"
          >

            <small
              className="text-muted"
            >
              FleetFlow Fleet Management System
            </small>

          </div>

        </div>

      </div>

    </div>
  );
}


export default Login;