import { useState } from "react";

import {
  FaCog,
  FaBuilding,
  FaUser,
  FaEnvelope,
  FaLock,
  FaSave,
  FaShieldAlt,
} from "react-icons/fa";

function Settings() {

  const [showPassword, setShowPassword] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  // =====================================================
  // SAVE SETTINGS
  // =====================================================

  const handleSave = () => {

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 3000);

  };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <main
      className="settings-page"
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
      }}
    >

      <div
        className="container-fluid p-4"
      >

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="mb-4">

          <h2
            className="fw-bold mb-1"
            style={{
              color: "#172033",
            }}
          >

            <FaCog
              className="me-2"
              style={{
                color: "#2563eb",
              }}
            />

            Settings

          </h2>

          <p className="text-muted mb-0">
            Manage your FleetFlow account
            and company settings.
          </p>

        </div>


        {/* =================================================
            SETTINGS CONTENT
        ================================================= */}

        <div className="row g-4">

          {/* =================================================
              SETTINGS MENU
          ================================================= */}

          <div className="col-lg-3">

            <div
              className="card border-0"
              style={{
                borderRadius: "16px",
                boxShadow:
                  "0 6px 20px rgba(15,23,42,0.08)",
              }}
            >

              <div className="card-body p-3">

                {/* GENERAL */}

                <div
                  className="p-3 mb-2"
                  style={{
                    background:
                      "#eff6ff",
                    color:
                      "#2563eb",
                    borderRadius:
                      "10px",
                    fontWeight:
                      "600",
                  }}
                >

                  <FaCog className="me-2" />

                  General Settings

                </div>


                {/* PROFILE */}

                <div
                  className="p-3 mb-2"
                  style={{
                    color:
                      "#64748b",
                    borderRadius:
                      "10px",
                  }}
                >

                  <FaUser className="me-2" />

                  Profile

                </div>


                {/* SECURITY */}

                <div
                  className="p-3"
                  style={{
                    color:
                      "#64748b",
                    borderRadius:
                      "10px",
                  }}
                >

                  <FaShieldAlt className="me-2" />

                  Security

                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              MAIN SETTINGS
          ================================================= */}

          <div className="col-lg-9">

            <div
              className="card border-0"
              style={{
                borderRadius: "16px",
                boxShadow:
                  "0 6px 22px rgba(15,23,42,0.08)",
              }}
            >

              <div className="card-body p-4">

                {/* =================================================
                    GENERAL INFORMATION
                ================================================= */}

                <div className="mb-4">

                  <h5
                    className="fw-bold mb-1"
                    style={{
                      color:
                        "#172033",
                    }}
                  >
                    General Information
                  </h5>

                  <p className="text-muted small">
                    Update your company and
                    administrator information.
                  </p>

                </div>


                {/* =================================================
                    COMPANY NAME
                ================================================= */}

                <div className="mb-4">

                  <label
                    className="form-label fw-semibold"
                  >
                    Company Name
                  </label>

                  <div
                    style={{
                      position:
                        "relative",
                    }}
                  >

                    <FaBuilding
                      style={{
                        position:
                          "absolute",
                        left:
                          "14px",
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
                      type="text"
                      className="form-control"
                      defaultValue="FleetFlow"
                      style={{
                        height:
                          "48px",
                        paddingLeft:
                          "42px",
                        borderRadius:
                          "10px",
                      }}
                    />

                  </div>

                </div>


                {/* =================================================
                    ADMIN NAME
                ================================================= */}

                <div className="mb-4">

                  <label
                    className="form-label fw-semibold"
                  >
                    Admin Name
                  </label>

                  <div
                    style={{
                      position:
                        "relative",
                    }}
                  >

                    <FaUser
                      style={{
                        position:
                          "absolute",
                        left:
                          "14px",
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
                      type="text"
                      className="form-control"
                      defaultValue="Admin"
                      style={{
                        height:
                          "48px",
                        paddingLeft:
                          "42px",
                        borderRadius:
                          "10px",
                      }}
                    />

                  </div>

                </div>


                {/* =================================================
                    EMAIL
                ================================================= */}

                <div className="mb-4">

                  <label
                    className="form-label fw-semibold"
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
                          "14px",
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
                      type="email"
                      className="form-control"
                      defaultValue="admin@gmail.com"
                      style={{
                        height:
                          "48px",
                        paddingLeft:
                          "42px",
                        borderRadius:
                          "10px",
                      }}
                    />

                  </div>

                </div>


                <hr className="my-4" />


                {/* =================================================
                    SECURITY
                ================================================= */}

                <div className="mb-4">

                  <h5
                    className="fw-bold mb-1"
                    style={{
                      color:
                        "#172033",
                    }}
                  >
                    Security
                  </h5>

                  <p className="text-muted small">
                    Update your account password.
                  </p>

                </div>


                {/* =================================================
                    PASSWORD
                ================================================= */}

                <div className="mb-4">

                  <label
                    className="form-label fw-semibold"
                  >
                    Change Password
                  </label>

                  <div
                    className="input-group"
                  >

                    <span
                      className="input-group-text bg-white"
                    >

                      <FaLock
                        style={{
                          color:
                            "#64748b",
                        }}
                      />

                    </span>


                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      className="form-control"
                      placeholder="Enter New Password"
                      style={{
                        height:
                          "48px",
                      }}
                    />


                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() =>
                        setShowPassword(
                          (previous) =>
                            !previous
                        )
                      }
                    >

                      {showPassword
                        ? "Hide"
                        : "Show"}

                    </button>

                  </div>

                </div>


                {/* =================================================
                    SAVE BUTTON
                ================================================= */}

                <div
                  className="d-flex justify-content-end align-items-center gap-3"
                >

                  {saved && (

                    <span
                      style={{
                        color:
                          "#10b981",
                        fontWeight:
                          "600",
                      }}
                    >
                      ✓ Changes saved
                    </span>

                  )}


                  <button
                    type="button"
                    className="btn"
                    onClick={
                      handleSave
                    }
                    style={{
                      background:
                        "#2563eb",
                      color:
                        "white",
                      borderRadius:
                        "9px",
                      padding:
                        "10px 20px",
                      fontWeight:
                        "600",
                    }}
                  >

                    <FaSave className="me-2" />

                    Save Changes

                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

export default Settings;