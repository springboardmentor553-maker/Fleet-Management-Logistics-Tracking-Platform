import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../auth/ProtectedRoute.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import DashboardPage from "../features/dashboard/DashboardPage.jsx";
import VehiclesPage from "../features/vehicles/VehiclesPage.jsx";
import DriversPage from "../features/drivers/DriversPage.jsx";
import ShipmentsPage from "../features/shipments/ShipmentsPage.jsx";
import RoutesPage from "../features/routes/RoutesPage.jsx";
import MaintenancePage from "../features/maintenance/MaintenancePage.jsx";
import TrackingPage from "../features/tracking/TrackingPage.jsx";
import ReportsPage from "../features/reports/ReportsPage.jsx";
import UsersPage from "../features/users/UsersPage.jsx";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/vehicles" element={<ProtectedRoute><VehiclesPage /></ProtectedRoute>} />
      <Route path="/drivers" element={<ProtectedRoute><DriversPage /></ProtectedRoute>} />
      <Route path="/shipments" element={<ProtectedRoute><ShipmentsPage /></ProtectedRoute>} />
      <Route path="/routes" element={<ProtectedRoute><RoutesPage /></ProtectedRoute>} />
      <Route path="/maintenance" element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />
      <Route path="/tracking" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <UsersPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
