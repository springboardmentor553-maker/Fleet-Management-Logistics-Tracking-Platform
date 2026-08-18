import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import { Toast } from "./components/common/Toast.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { VehiclesPage } from "./pages/VehiclesPage.jsx";
import { DriversPage } from "./pages/DriversPage.jsx";
import { RoutesPage } from "./pages/RoutesPage.jsx";
import { ShipmentsPage } from "./pages/ShipmentsPage.jsx";
import { MaintenancePage } from "./pages/MaintenancePage.jsx";
import { FuelPage } from "./pages/FuelPage.jsx";
import { TripsPage } from "./pages/TripsPage.jsx";
import { UsersPage } from "./pages/UsersPage.jsx";
import { NotificationsPage } from "./pages/NotificationsPage.jsx";

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "shipments", label: "Shipments", icon: "📦" },
  { key: "vehicles", label: "Vehicles", icon: "🚛" },
  { key: "drivers", label: "Drivers", icon: "👤" },
  { key: "routes", label: "Routes", icon: "🗺️" },
  { key: "trips", label: "Active Trips", icon: "⚡" },
  { key: "maintenance", label: "Maintenance", icon: "🛠️" },
  { key: "fuel", label: "Fuel Logs", icon: "⛽" },
  { key: "users", label: "Users & Access", icon: "🔐" },
  { key: "notifications", label: "Notifications", icon: "🔔" },
];

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const [token, setToken] = useState(() => localStorage.getItem("fleetflow_token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("fleetflow_user");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  function handleLoginSuccess(data) {
    const accessToken = data.access_token;
    const userData = {
      id: data.user_id,
      email: data.email,
      name: data.name,
      role: data.role,
    };

    localStorage.setItem("fleetflow_token", accessToken);
    localStorage.setItem("fleetflow_user", JSON.stringify(userData));

    setToken(accessToken);
    setUser(userData);
    showToast(`Welcome back, ${userData.name}!`, "success");
  }

  function handleLogout() {
    localStorage.removeItem("fleetflow_token");
    localStorage.removeItem("fleetflow_user");
    setToken(null);
    setUser(null);
    showToast("Signed out successfully", "info");
  }

  function showToast(message, type = "info") {
    setToast({ message, type });
  }

  if (!token) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  function handleNavClick(key) {
    setActiveTab(key);
    setIsMobileNavOpen(false);
  }

  function renderPage() {
    switch (activeTab) {
      case "dashboard":
        return <DashboardPage onNavigate={handleNavClick} showToast={showToast} />;
      case "vehicles":
        return <VehiclesPage showToast={showToast} />;
      case "drivers":
        return <DriversPage showToast={showToast} />;
      case "routes":
        return <RoutesPage showToast={showToast} />;
      case "shipments":
        return <ShipmentsPage showToast={showToast} />;
      case "maintenance":
        return <MaintenancePage showToast={showToast} />;
      case "fuel":
        return <FuelPage showToast={showToast} />;
      case "trips":
        return <TripsPage showToast={showToast} />;
      case "users":
        return <UsersPage showToast={showToast} />;
      case "notifications":
        return <NotificationsPage showToast={showToast} />;
      default:
        return <DashboardPage onNavigate={handleNavClick} showToast={showToast} />;
    }
  }

  return (
    <div className="app-layout">
      {/* Mobile Sticky Top Header */}
      <header className="mobile-top-bar">
        <div className="mobile-brand">
          <span>🚚</span>
          <span>FleetFlow</span>
        </div>
        <button
          type="button"
          className="hamburger-btn"
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {isMobileNavOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      <div
        className={`sidebar-overlay ${isMobileNavOpen ? "mobile-open" : ""}`}
        onClick={() => setIsMobileNavOpen(false)}
      />

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isMobileNavOpen ? "mobile-open" : ""}`}>
        <div className="brand-section">
          <span className="brand-logo">🚚</span>
          <div>
            <h2 className="brand-name">FleetFlow</h2>
            <p className="brand-sub">Logistics & Tracking</p>
          </div>
        </div>

        {/* Logged in User Profile Bar */}
        {user && (
          <div style={{ padding: "0.75rem", margin: "0 0.5rem 1rem", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#f8fafc" }}>{user.name}</div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "capitalize" }}>{user.role} ({user.email})</div>
            <button
              type="button"
              onClick={handleLogout}
              style={{ marginTop: "0.5rem", width: "100%", padding: "0.35rem", fontSize: "0.75rem", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Sign Out
            </button>
          </div>
        )}

        <nav className="nav-menu">
          {navItems.map((item) => (
            <button
              className={`nav-btn ${activeTab === item.key ? "active" : ""}`}
              key={item.key}
              onClick={() => handleNavClick(item.key)}
              type="button"
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-indicator">
            <span className="pulse-dot" />
            <span>FastAPI JWT Auth Active</span>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="main-content">
        {renderPage()}
      </main>

      {/* Global Toast Alert */}
      <Toast onClose={() => setToast(null)} toast={toast} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);

