import React from "react";
import { NavLink } from "react-router-dom";

const menus = [
  { name: "Dashboard", path: "/dashboard", icon: "▦" },
  { name: "Live GPS Tracking", path: "/tracking", icon: "◎" },
  { name: "Fleet Vehicles", path: "/vehicles", icon: "🚚" },
  { name: "Drivers", path: "/drivers", icon: "👤" },
  { name: "Trips & Routes", path: "/trips", icon: "⇄" },
  { name: "Fuel Monitoring", path: "/fuel", icon: "⛽" },
  { name: "Maintenance", path: "/maintenance", icon: "🔧" },
];

export default function Sidebar() {
  return (
    <aside style={{
      background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      padding: "24px 16px",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 8px" }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "var(--accent)", display: "flex",
          alignItems: "center", justifyContent: "center", fontWeight: 700,
        }}>⚡</div>
        <strong style={{ fontSize: 18 }}>FleetFlow</strong>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {menus.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 14,
              color: isActive ? "var(--accent)" : "var(--text-secondary)",
              background: isActive ? "var(--accent-soft)" : "transparent",
            })}
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}