import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FaMapMarkedAlt } from "react-icons/fa";
import {
  FaBars,
  FaTimes,
  FaHome,
  FaUserTie,
  FaTruck,
  FaBoxOpen,
  FaRoute,
  FaBell,
  FaUserCircle,
  FaCog,
} from "react-icons/fa";

import "./Sidebar.css";

function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const menus = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <FaHome />,
    },
    {
      name: "Drivers",
      path: "/drivers",
      icon: <FaUserTie />,
    },
    {
      name: "Vehicles",
      path: "/vehicles",
      icon: <FaTruck />,
    },
    {
      name: "Shipments",
      path: "/shipments",
      icon: <FaBoxOpen />,
    },
    {
      name: "Trips",
      path: "/trips",
      icon: <FaRoute />,
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: <FaBell />,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: <FaUserCircle />,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <FaCog />,
    },
  {
  name: "Live Map",
  path: "/map",
  icon: <FaMapMarkedAlt />,
},
  ];

  return (
    <>
      {/* Mobile Menu Button */}

      <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
        <FaBars />
      </button>

      {/* Overlay */}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}

      <aside className={`sidebar ${sidebarOpen ? "show-sidebar" : ""}`}>
        {/* Close Button */}

        <button className="close-btn" onClick={() => setSidebarOpen(false)}>
          <FaTimes />
        </button>

        {/* Logo */}

        <div className="sidebar-logo">
          <h2>FleetFlow</h2>
          <p>Fleet Management</p>
        </div>

        {/* Navigation */}

        <nav className="sidebar-menu">
          <ul>
            {menus.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={closeSidebar}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <span className="menu-icon">{item.icon}</span>

                  <span className="menu-text">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}

        <div className="sidebar-footer">
          <small>FleetFlow v1.0</small>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
