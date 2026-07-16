import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user } = useAuth();
  
  if (!user) return null;

  const role = user.role;

  // Define navigation layout based on roles
  const hasAccess = (allowedRoles) => allowedRoles.includes(role);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>FleetFlow</h2>
        <span className="user-role-badge">{role}</span>
      </div>
      <nav className="sidebar-nav">
        {hasAccess(["Admin", "Fleet Manager"]) && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon">📊</span> Dashboard
          </NavLink>
        )}
        {hasAccess(["Admin", "Fleet Manager", "Dispatcher"]) && (
          <NavLink
            to="/drivers"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon">👥</span> Drivers
          </NavLink>
        )}
        {hasAccess(["Admin", "Fleet Manager", "Dispatcher", "Driver"]) && (
          <NavLink
            to="/vehicles"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon">🚚</span> Vehicles
          </NavLink>
        )}
        {hasAccess(["Admin", "Fleet Manager", "Dispatcher"]) && (
          <NavLink
            to="/shipments"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon">📦</span> Shipments
          </NavLink>
        )}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span className="nav-icon">👤</span> Profile
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <p className="footer-title">FleetFlow Logistics</p>
        <p className="footer-sub">v1.0.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
