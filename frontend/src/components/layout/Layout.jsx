import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div>
        <header className="topbar">
          <span className="topbar-label">Admin Workspace</span>
          <div className="topbar-user">
            <span>Welcome, <strong>Fleet Admin</strong></span>
            <span className="role-badge">ADMIN</span>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}