import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import { useEffect, useState } from "react";

import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Shipments from "./pages/Shipments";
import Trips from "./pages/Trips";
import Maintenance from "./pages/Maintenance";
import Fuel from "./pages/Fuel";
import Analytics from "./pages/Analytics";
import DriverAssignments from "./pages/DriverAssignments";
import DriverAttendance from "./pages/DriverAttendance";
import MaintenanceAlerts from "./pages/MaintenanceAlerts";


function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


function AppLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("fleetflow-theme") === "dark";
  });


  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("fleetflow-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("fleetflow-theme", "light");
    }
  }, [darkMode]);


  const handleLogout = () => {
    logout();
    navigate("/login");
  };


  const closeSidebar = () => {
    setSidebarOpen(false);
  };


  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "📊",
    },
    {
      name: "Vehicles",
      path: "/vehicles",
      icon: "🚚",
    },
    {
      name: "Drivers",
      path: "/drivers",
      icon: "👤",
    },
    {
      name: "Shipments",
      path: "/shipments",
      icon: "📦",
    },
    {
      name: "Trips",
      path: "/trips",
      icon: "🛣️",
    },
    {
      name: "Driver Assignments",
      path: "/driver-assignments",
      icon: "👥",
    },
    {
      name: "Driver Attendance",
      path: "/driver-attendance",
      icon: "📋",
    },
    {
      name: "Maintenance",
      path: "/maintenance",
      icon: "🔧",
    },
    {
      name: "Maintenance Alerts",
      path: "/maintenance-alerts",
      icon: "⚠️",
    },
    {
      name: "Fuel",
      path: "/fuel",
      icon: "⛽",
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: "📈",
    },
  ];


  return (
    <div className="app-layout">

      {/* Mobile overlay */}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
        />
      )}


      {/* Sidebar */}

      <aside
        className={`sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >

        <div className="logo">

          <span>Fleet</span>
          <span className="logo-text">Flow</span>


          {/* Mobile close button */}

          <button
            className="mobile-sidebar-close"
            onClick={closeSidebar}
            aria-label="Close navigation"
          >
            ×
          </button>

        </div>


        <div className="nav-section">

          <div className="nav-title">
            Main
          </div>


          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              onClick={closeSidebar}
            >

              <span className="nav-icon">
                {item.icon}
              </span>

              <span>
                {item.name}
              </span>

            </NavLink>
          ))}

        </div>


        <div className="sidebar-bottom">

          <button
            className="nav-link"
            onClick={handleLogout}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              textAlign: "left",
            }}
          >

            <span className="nav-icon">
              ↪️
            </span>

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>


      {/* Main content */}

      <main className="main-content">

        <header className="topbar">

          <div className="topbar-left">

            {/* Mobile hamburger */}

            <button
              className="mobile-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>


            <h2 className="page-title">
              Fleet Management
            </h2>

          </div>


          <div className="user-area">

            {/* Dark mode */}

            <button
              className="theme-toggle"
              onClick={() => setDarkMode((value) => !value)}
              aria-label={
                darkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              title={
                darkMode
                  ? "Light mode"
                  : "Dark mode"
              }
            >
              {darkMode ? "☀️" : "🌙"}
            </button>


            <div className="user-name">
              Administrator
            </div>


            <div className="user-avatar">
              A
            </div>

          </div>

        </header>


        <section className="content">
          {children}
        </section>

      </main>

    </div>
  );
}


function AppRoutes() {
  return (
    <Routes>

      <Route
        path="/login"
        element={<Login />}
      />


      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Vehicles />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="/drivers"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Drivers />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="/shipments"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Shipments />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="/trips"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Trips />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="/maintenance"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Maintenance />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="/maintenance-alerts"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MaintenanceAlerts />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="/fuel"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Fuel />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Analytics />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="/driver-assignments"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DriverAssignments />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="/driver-attendance"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DriverAttendance />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}


function App() {
  return (
    <BrowserRouter>

      <AuthProvider>
        <AppRoutes />
      </AuthProvider>

    </BrowserRouter>
  );
}


export default App;