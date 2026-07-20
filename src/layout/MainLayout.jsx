import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar/Sidebar";
import Navbar from "../components/Navbar/Navbar";

import "./MainLayout.css";

function MainLayout() {
  return (
    <div className="layout">

      {/* Sidebar */}

      <Sidebar />

      {/* Main Content */}

      <div className="main-container">

        {/* Navbar */}

        <Navbar />

        {/* Page */}

        <main className="page-container">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default MainLayout;