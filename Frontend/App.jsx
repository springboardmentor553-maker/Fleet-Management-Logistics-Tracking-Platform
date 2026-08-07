import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardPage from "./pages/DashboardPage";
import VehiclePage from "./pages/VehiclePage";
import DriverPage from "./pages/DriverPage";
import ShipmentPage from "./pages/ShipmentPage";
import RoutePage from "./pages/RoutePage";
import DeliveryPage from "./pages/DeliveryPage";
import ReportPage from "./pages/ReportPage";
import Unauthorized from "./pages/Unauthorized";
import Trips from "./pages/Trips";
import Tracking from "./pages/Tracking";
import RoutePlanner from "./components/RoutePlanner";
import MaintenancePage from "./pages/MaintenancePage";
import DriverAssignmentPage from "./pages/DriverAssignmentPage";
import MaintenanceAlertPage from "./pages/MaintenanceAlertPage";
import MaintenanceReportPage from "./pages/MaintenanceReportPage";
import OperationalAnalyticsPage from "./pages/OperationalAnalyticsPage";
import FuelAnalyticsPage from "./pages/FuelAnalyticsPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>

      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            allowedRoles={["Admin", "Fleet Manager", "Dispatcher", "Driver"]}
          >
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Vehicles */}
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Fleet Manager"]}>
            <VehiclePage />
          </ProtectedRoute>
        }
      />

      {/* Drivers */}
      <Route
        path="/drivers"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <DriverPage />
          </ProtectedRoute>
        }
      />

      {/* Shipments */}
      <Route
        path="/shipments"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Dispatcher"]}>
            <ShipmentPage />
          </ProtectedRoute>
        }
      />

      {/* Route Management */}
      <Route
        path="/routes"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Dispatcher"]}>
            <RoutePage />
          </ProtectedRoute>
        }
      />

      {/* Route Planner */}
      <Route
        path="/route-planner"
        element={
          <ProtectedRoute
            allowedRoles={["Admin", "Fleet Manager", "Dispatcher"]}
          >
            <RoutePlanner />
          </ProtectedRoute>
        }
      />

      {/* Trips */}
      <Route
        path="/trips"
        element={
          <ProtectedRoute
            allowedRoles={["Admin", "Fleet Manager", "Dispatcher"]}
          >
            <Trips />
          </ProtectedRoute>
        }
      />

      {/* Live Tracking */}
      <Route
        path="/tracking"
        element={
          <ProtectedRoute
            allowedRoles={["Admin", "Fleet Manager", "Dispatcher", "Driver"]}
          >
            <Tracking />
          </ProtectedRoute>
        }
      />

      {/* Deliveries */}
      <Route
        path="/my-deliveries"
        element={
          <ProtectedRoute allowedRoles={["Driver"]}>
            <DeliveryPage />
          </ProtectedRoute>
        }
      />

      {/* Reports */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <ReportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Fleet Manager"]}>
           <MaintenancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver-assignment"
        element={
          <ProtectedRoute allowedRoles={["Admin","Fleet Manager", "Dispatcher"]}>
            <DriverAssignmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance-alerts"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Fleet Manager"]}>
            <MaintenanceAlertPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance-reports"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Fleet Manager"]}>
            <MaintenanceReportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operational-analytics"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Fleet Manager"]}>
            <OperationalAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fuel-analytics"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Fleet Manager"]}>
            <FuelAnalyticsPage />
          </ProtectedRoute>
        }
      />


      

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
}

export default App;