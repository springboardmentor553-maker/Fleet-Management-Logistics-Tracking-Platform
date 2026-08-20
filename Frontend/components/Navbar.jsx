import { Link } from "react-router-dom";
import { logoutUser } from "../services/authService";
import { jwtDecode } from "jwt-decode";

import {
  FaTachometerAlt,
  FaTruck,
  FaUsers,
  FaBoxOpen,
  FaRoute,
  FaChartBar,
  FaTools,
  FaBell,
  FaClipboardList,
  FaGasPump,
  FaUserCheck,
  FaSignOutAlt,
} from "react-icons/fa";

import "./Navbar.css";

export default function Navbar() {
  const token = localStorage.getItem("token");

  let role = "";

  if (token) {
    const decoded = jwtDecode(token);
    role = decoded.role;
  }

  const logout = () => {
    logoutUser();
    window.location.href = "/login";
  };

  return (
    <div className="sidebar">
      <h2 className="logo">🚛 FleetFlow</h2>

      <Link to="/dashboard">
        <FaTachometerAlt /> Dashboard
      </Link>

      {(role === "Admin" || role === "Fleet Manager") && (
        <Link to="/vehicles">
          <FaTruck /> Vehicles
        </Link>
      )}

      {role === "Admin" && (
        <Link to="/drivers">
          <FaUsers /> Drivers
        </Link>
      )}

      {(role === "Admin" || role === "Dispatcher") && (
        <Link to="/shipments">
          <FaBoxOpen /> Shipments
        </Link>
      )}

      {(role === "Admin" || role === "Dispatcher") && (
        <Link to="/routes">
          <FaRoute /> Routes
        </Link>
      )}

      {(role === "Admin" || role === "Fleet Manager") && (
        <Link to="/driver-assignment">
          <FaUserCheck /> Driver Assignment
        </Link>
      )}

      {(role === "Admin" || role === "Fleet Manager") && (
        <Link to="/maintenance-alerts">
          <FaBell /> Maintenance Alerts
        </Link>
      )}

      {(role === "Admin" || role === "Fleet Manager") && (
        <Link to="/maintenance-reports">
          <FaClipboardList /> Maintenance Reports
        </Link>
      )}

      {(role === "Admin" || role === "Fleet Manager") && (
        <Link to="/operational-analytics">
          <FaChartBar /> Operational Analytics
        </Link>
      )}

      {(role === "Admin" || role === "Fleet Manager") && (
        <Link to="/fuel-analytics">
          <FaGasPump /> Fuel Analytics
        </Link>
      )}

      {role === "Admin" && (
        <Link to="/reports">
          <FaChartBar /> Reports
        </Link>
      )}

      {role === "Driver" && (
        <Link to="/my-deliveries">
          <FaTruck /> My Deliveries
        </Link>
      )}

      <button className="logout-btn" onClick={logout}>
        <FaSignOutAlt /> Logout
      </button>
    </div>
  );
}