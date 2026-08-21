import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

// ======================================================
// AUTH
// ======================================================

import Login from "./pages/Login";
import Register from "./pages/Register";

// ======================================================
// DASHBOARDS
// ======================================================

import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import ManagerDashboard from "./pages/ManagerDashboard";

// ======================================================
// MANAGEMENT
// ======================================================

import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import DriverAssignment from "./pages/DriverAssignment";
import DriverAttendance from "./pages/DriverAttendance";
import DriverPerformance from "./pages/DriverPerformance";

import Shipments from "./pages/Shipments";
import Trips from "./pages/Trips";

import Fuel from "./pages/Fuel";
import FuelAnalytics from "./pages/FuelAnalytics";

import Maintenance from "./pages/Maintenance";
import MaintenanceAlerts from "./pages/MaintenanceAlerts";
import MaintenanceReports from "./pages/MaintenanceReports";

import AuditLogs from "./pages/AuditLogs";

// ======================================================
// ANALYTICS
// ======================================================

import Analytics from "./pages/Analytics";
import FleetAnalytics from "./pages/FleetAnalytics";
import OperationsAnalytics from "./pages/OperationsAnalytics";

// ======================================================
// MAPS / TRACKING
// ======================================================

import Maps from "./pages/Maps";
import LiveTracking from "./pages/LiveTracking";
import LiveTrackingList from "./pages/LiveTrackingList";

// ======================================================
// PROTECTED ROUTE
// ======================================================

import ProtectedRoute from "./components/ProtectedRoute";

// ======================================================
// ROLE DASHBOARD
// ======================================================

function RoleDashboard() {

    const token = localStorage.getItem("token");

    const role = (
        localStorage.getItem("role") || ""
    )
        .toLowerCase()
        .trim();

    // Not logged in
    if (!token) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    // Admin
    if (role === "admin") {
        return (
            <Navigate
                to="/admin"
                replace
            />
        );
    }

    // Manager
    if (role === "manager") {
        return (
            <Navigate
                to="/manager-dashboard"
                replace
            />
        );
    }

    // User / Driver
    if (
        role === "user" ||
        role === "driver"
    ) {
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    // Invalid role
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");

    return (
        <Navigate
            to="/"
            replace
        />
    );
}

// ======================================================
// ROLE ROUTE
// ======================================================

function RoleRoute({
    children,
    allowedRoles
}) {

    const token =
        localStorage.getItem("token");

    const role = (
        localStorage.getItem("role") || ""
    )
        .toLowerCase()
        .trim();

    // Not logged in
    if (!token) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    // Invalid role
    if (!allowedRoles.includes(role)) {
        return (
            <Navigate
                to="/home"
                replace
            />
        );
    }

    return children;
}

// ======================================================
// APP
// ======================================================

function App() {

    return (
        <BrowserRouter>

            <Routes>

                {/* ==================================================
                    PUBLIC ROUTES
                ================================================== */}

                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                {/* ==================================================
                    HOME / ROLE REDIRECT
                ================================================== */}

                <Route
                    path="/home"
                    element={<RoleDashboard />}
                />

                {/* ==================================================
                    USER DASHBOARD
                ================================================== */}

                <Route
                    path="/dashboard"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "user",
                                "driver"
                            ]}
                        >
                            <Dashboard />
                        </RoleRoute>
                    }
                />

                {/* ==================================================
                    ADMIN
                ================================================== */}

                <Route
                    path="/admin"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "admin"
                            ]}
                        >
                            <AdminPanel />
                        </RoleRoute>
                    }
                />

                {/* ==================================================
                    MANAGER
                ================================================== */}

                <Route
                    path="/manager-dashboard"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "manager"
                            ]}
                        >
                            <ManagerDashboard />
                        </RoleRoute>
                    }
                />

                <Route
                    path="/manager"
                    element={
                        <Navigate
                            to="/manager-dashboard"
                            replace
                        />
                    }
                />

                {/* ==================================================
                    VEHICLES
                ================================================== */}

                <Route
                    path="/vehicles"
                    element={
                        <ProtectedRoute>
                            <Vehicles />
                        </ProtectedRoute>
                    }
                />

                {/* ==================================================
                    DRIVERS
                ================================================== */}

                <Route
                    path="/drivers"
                    element={
                        <ProtectedRoute>
                            <Drivers />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/driver-assignments"
                    element={
                        <ProtectedRoute>
                            <DriverAssignment />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/driver-attendance"
                    element={
                        <ProtectedRoute>
                            <DriverAttendance />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/driver-performance"
                    element={
                        <ProtectedRoute>
                            <DriverPerformance />
                        </ProtectedRoute>
                    }
                />

                {/* ==================================================
                    SHIPMENTS
                ================================================== */}

                <Route
                    path="/shipments"
                    element={
                        <ProtectedRoute>
                            <Shipments />
                        </ProtectedRoute>
                    }
                />

                {/* ==================================================
                    TRIPS
                ================================================== */}

                <Route
                    path="/trips"
                    element={
                        <ProtectedRoute>
                            <Trips />
                        </ProtectedRoute>
                    }
                />

                {/* ==================================================
                    LIVE TRACKING LIST
                ================================================== */}

                <Route
                    path="/live-tracking"
                    element={
                        <ProtectedRoute>
                            <LiveTrackingList />
                        </ProtectedRoute>
                    }
                />

                {/* ==================================================
                    LIVE TRACKING MAP
                ================================================== */}

                <Route
                    path="/tracking/:id"
                    element={
                        <ProtectedRoute>
                            <LiveTracking />
                        </ProtectedRoute>
                    }
                />

                {/* ==================================================
                    FUEL
                ================================================== */}

                <Route
                    path="/fuel"
                    element={
                        <ProtectedRoute>
                            <Fuel />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/fuel-analytics"
                    element={
                        <ProtectedRoute>
                            <FuelAnalytics />
                        </ProtectedRoute>
                    }
                />

                {/* ==================================================
                    MAINTENANCE
                ================================================== */}

                <Route
                    path="/maintenance"
                    element={
                        <ProtectedRoute>
                            <Maintenance />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/maintenance-alerts"
                    element={
                        <ProtectedRoute>
                            <MaintenanceAlerts />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/maintenance-reports"
                    element={
                        <ProtectedRoute>
                            <MaintenanceReports />
                        </ProtectedRoute>
                    }
                />

                {/* ==================================================
                    AUDIT LOGS
                ================================================== */}

                <Route
                    path="/audit-logs"
                    element={
                        <ProtectedRoute>
                            <AuditLogs />
                        </ProtectedRoute>
                    }
                />

                {/* ==================================================
                    ANALYTICS
                ================================================== */}

                <Route
                    path="/analytics"
                    element={
                        <ProtectedRoute>
                            <Analytics />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/fleet-analytics"
                    element={
                        <ProtectedRoute>
                            <FleetAnalytics />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/operations-analytics"
                    element={
                        <ProtectedRoute>
                            <OperationsAnalytics />
                        </ProtectedRoute>
                    }
                />

                {/* ==================================================
                    MAPS
                ================================================== */}

                <Route
                    path="/maps"
                    element={
                        <ProtectedRoute>
                            <Maps />
                        </ProtectedRoute>
                    }
                />

                {/* ==================================================
                    FALLBACK
                ================================================== */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;

