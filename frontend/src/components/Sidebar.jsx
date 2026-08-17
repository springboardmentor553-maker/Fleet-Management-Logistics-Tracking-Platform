import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer when screen resizes beyond mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!user) return null;
  const role = user.role;
  const hasAccess = (allowedRoles) => allowedRoles.includes(role);

  const closeMobile = () => setMobileOpen(false);

  const navItems = (
    <nav className="sidebar-nav">
      {hasAccess(["Admin", "Fleet Manager"]) && (
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobile}>
          <span className="nav-icon">📊</span> Dashboard
        </NavLink>
      )}
      {hasAccess(["Admin", "Fleet Manager"]) && (
        <NavLink to="/maintenance" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobile}>
          <span className="nav-icon">🔧</span> Maintenance
        </NavLink>
      )}
      {hasAccess(["Admin", "Fleet Manager", "Dispatcher"]) && (
        <NavLink to="/drivers" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobile}>
          <span className="nav-icon">👥</span> Drivers
        </NavLink>
      )}
      {hasAccess(["Admin", "Fleet Manager", "Dispatcher", "Driver"]) && (
        <NavLink to="/vehicles" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobile}>
          <span className="nav-icon">🚚</span> Vehicles
        </NavLink>
      )}
      {hasAccess(["Admin", "Fleet Manager", "Dispatcher"]) && (
        <NavLink to="/shipments" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobile}>
          <span className="nav-icon">📦</span> Shipments
        </NavLink>
      )}
      {hasAccess(["Admin", "Fleet Manager", "Dispatcher"]) && (
        <NavLink to="/driver-assignments" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobile}>
          <span className="nav-icon">📋</span> Driver Assignments
        </NavLink>
      )}
      {hasAccess(["Admin", "Fleet Manager", "Dispatcher"]) && (
        <NavLink to="/trips" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobile}>
          <span className="nav-icon">🗺️</span> Trips
        </NavLink>
      )}
      {hasAccess(["Admin", "Fleet Manager", "Dispatcher"]) && (
        <NavLink to="/fuel-records" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobile}>
          <span className="nav-icon">⛽</span> Fuel Records
        </NavLink>
      )}
      {hasAccess(["Admin", "Fleet Manager", "Dispatcher"]) && (
        <NavLink to="/analytics" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobile}>
          <span className="nav-icon">📈</span> Analytics
        </NavLink>
      )}
      <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobile}>
        <span className="nav-icon">👤</span> Profile
      </NavLink>
    </nav>
  );

  return (
    <>
      {/* Hamburger Button — mobile only */}
      <button
        className="sidebar-hamburger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        ☰
      </button>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={closeMobile} aria-hidden="true" />
      )}

      {/* Sidebar — desktop always visible, mobile as drawer */}
      <aside className={`sidebar${mobileOpen ? " sidebar-open" : ""}`}>
        <div className="sidebar-logo">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>FleetFlow</h2>
            {/* Close button inside drawer on mobile */}
            <button
              className="sidebar-close-btn"
              onClick={closeMobile}
              aria-label="Close navigation menu"
            >
              ✕
            </button>
          </div>
          <span className="user-role-badge">{role}</span>
        </div>
        {navItems}
        <div className="sidebar-footer">
          <p className="footer-title">FleetFlow Logistics</p>
          <p className="footer-sub">v1.0.0</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
