import { NavLink, useNavigate } from "react-router-dom";
import { clearStoredAuth } from "../services/api";

const navigationItems = [
  { to: "/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/drivers", label: "Drivers", icon: "👨‍✈️" },
  { to: "/vehicles", label: "Vehicles", icon: "🚚" },
  { to: "/shipments", label: "Shipments", icon: "📦" },
  { to: "/maintenance", label: "Maintenance", icon: "🔧" },
  { to: "/reports", label: "Reports", icon: "📊" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearStoredAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className="sidebar" aria-label="Primary navigation">
      <div className="sidebar__brand">
        <div className="sidebar__logo" aria-hidden="true"></div>
        <div className="sidebar__brandText">
          <h1 className="sidebar__title">FleetFlow</h1>
          <p className="sidebar__subtitle">
            Fleet management and logistics control
          </p>
        </div>
      </div>

      <nav className="sidebar__nav">
        <ul className="sidebar__list">
          {navigationItems.map((item) => (
            <li key={item.to} className="sidebar__item">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `sidebar__link${isActive ? " sidebar__link--active" : ""}`
                }
              >
                <span className="sidebar__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="sidebar__label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar__footer">
        <button
          type="button"
          className="sidebar__logout"
          onClick={handleLogout}
        >
          <span className="sidebar__icon" aria-hidden="true">
            🚪
          </span>
          <span className="sidebar__label">Logout</span>
        </button>
      </div>
    </div>
  );
}
