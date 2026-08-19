import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { logoutUser } from "../services/authService";
import { jwtDecode } from "jwt-decode";

import {
  FaTachometerAlt,
  FaTruck,
  FaUsers,
  FaBoxOpen,
  FaRoute,
  FaChartBar,
  FaBell,
  FaClipboardList,
  FaGasPump,
  FaUserCheck,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";

import "./Navbar.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const location = useLocation();

  const token = localStorage.getItem("token");

  let role = "";

  if (token) {
    try {
      const decoded = jwtDecode(token);
      role = decoded.role;
    } catch (error) {
      console.log("Invalid token");
    }
  }

  const logout = () => {
    logoutUser();
    window.location.href = "/login";
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="mobile-topbar">
        <div className="mobile-logo">
          🚛 FleetFlow
        </div>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Overlay for Mobile */}
      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeMenu}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${
          menuOpen ? "sidebar-open" : ""
        }`}
      >

        {/* Logo */}
        <div className="sidebar-header">
          <h2 className="logo">
            🚛 FleetFlow
          </h2>

          <button
            className="mobile-close"
            onClick={closeMenu}
            aria-label="Close navigation"
          >
            <FaTimes />
          </button>
        </div>

        {/* Navigation */}

        <nav className="sidebar-nav">

          <Link
            to="/dashboard"
            className={
              location.pathname === "/dashboard"
                ? "active"
                : ""
            }
            onClick={closeMenu}
          >
            <FaTachometerAlt />
            <span>Dashboard</span>
          </Link>


          {(role === "Admin" ||
            role === "Fleet Manager") && (
            <Link
              to="/vehicles"
              className={
                location.pathname === "/vehicles"
                  ? "active"
                  : ""
              }
              onClick={closeMenu}
            >
              <FaTruck />
              <span>Vehicles</span>
            </Link>
          )}


          {role === "Admin" && (
            <Link
              to="/drivers"
              className={
                location.pathname === "/drivers"
                  ? "active"
                  : ""
              }
              onClick={closeMenu}
            >
              <FaUsers />
              <span>Drivers</span>
            </Link>
          )}


          {(role === "Admin" ||
            role === "Dispatcher") && (
            <Link
              to="/shipments"
              className={
                location.pathname === "/shipments"
                  ? "active"
                  : ""
              }
              onClick={closeMenu}
            >
              <FaBoxOpen />
              <span>Shipments</span>
            </Link>
          )}


          {(role === "Admin" ||
            role === "Dispatcher") && (
            <Link
              to="/routes"
              className={
                location.pathname === "/routes"
                  ? "active"
                  : ""
              }
              onClick={closeMenu}
            >
              <FaRoute />
              <span>Routes</span>
            </Link>
          )}


          {(role === "Admin" ||
            role === "Fleet Manager") && (
            <Link
              to="/driver-assignment"
              className={
                location.pathname === "/driver-assignment"
                  ? "active"
                  : ""
              }
              onClick={closeMenu}
            >
              <FaUserCheck />
              <span>Driver Assignment</span>
            </Link>
          )}


          {(role === "Admin" ||
            role === "Fleet Manager") && (
            <Link
              to="/maintenance-alerts"
              className={
                location.pathname === "/maintenance-alerts"
                  ? "active"
                  : ""
              }
              onClick={closeMenu}
            >
              <FaBell />
              <span>Maintenance Alerts</span>
            </Link>
          )}


          {(role === "Admin" ||
            role === "Fleet Manager") && (
            <Link
              to="/maintenance-reports"
              className={
                location.pathname === "/maintenance-reports"
                  ? "active"
                  : ""
              }
              onClick={closeMenu}
            >
              <FaClipboardList />
              <span>Maintenance Reports</span>
            </Link>
          )}


          {(role === "Admin" ||
            role === "Fleet Manager") && (
            <Link
              to="/operational-analytics"
              className={
                location.pathname === "/operational-analytics"
                  ? "active"
                  : ""
              }
              onClick={closeMenu}
            >
              <FaChartBar />
              <span>Operational Analytics</span>
            </Link>
          )}


          {(role === "Admin" ||
            role === "Fleet Manager") && (
            <Link
              to="/fuel-analytics"
              className={
                location.pathname === "/fuel-analytics"
                  ? "active"
                  : ""
              }
              onClick={closeMenu}
            >
              <FaGasPump />
              <span>Fuel Analytics</span>
            </Link>
          )}


          {role === "Admin" && (
            <Link
              to="/reports"
              className={
                location.pathname === "/reports"
                  ? "active"
                  : ""
              }
              onClick={closeMenu}
            >
              <FaChartBar />
              <span>Reports</span>
            </Link>
          )}


          {role === "Driver" && (
            <Link
              to="/my-deliveries"
              className={
                location.pathname === "/my-deliveries"
                  ? "active"
                  : ""
              }
              onClick={closeMenu}
            >
              <FaTruck />
              <span>My Deliveries</span>
            </Link>
          )}

        </nav>


        {/* Logout */}

        <div className="sidebar-footer">

          <button
            className="logout-btn"
            onClick={logout}
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>

        </div>

      </aside>
    </>
  );
}