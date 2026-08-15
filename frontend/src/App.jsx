import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './pages/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';

// Dashboard Views
import AdminDashboard from './pages/dashboards/AdminDashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import DispatcherDashboard from './pages/dashboards/DispatcherDashboard';
import DriverDashboard from './pages/dashboards/DriverDashboard';
import PerformanceDashboard from './pages/dashboards/PerformanceDashboard';
import FuelDashboard from './pages/FuelDashboard';
import FuelMonitoring from './pages/FuelMonitoring';
import SystemMonitoring from './pages/SystemMonitoring';
import DriverAssignments from './pages/DriverAssignments';
import Attendance from './pages/Attendance';

// Shipment, Trip & Route workspace pages
import ShipmentManagement from './pages/ShipmentManagement';
import TripManagement from './pages/TripManagement';
import RouteDetails from './pages/RouteDetails';
import ShipmentTracking from './pages/ShipmentTracking';
import MaintenanceManagement from './pages/MaintenanceManagement';
import MaintenanceReports from './pages/MaintenanceReports';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import FleetPerformanceDashboard from './pages/FleetPerformanceDashboard';
import DriverMonitoring from './pages/DriverMonitoring';

// Helper component to redirect root "/" access based on the user's role
const HomeRedirect = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'manager':
      return <Navigate to="/manager" replace />;
    case 'dispatcher':
      return <Navigate to="/dispatcher" replace />;
    case 'driver':
      return <Navigate to="/driver" replace />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes nested in DashboardLayout */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<HomeRedirect />} />
            
            {/* Admin only routes */}
            <Route 
              path="admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="register" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Register />
                </ProtectedRoute>
              } 
            />

            {/* Fleet Manager workspace */}
            <Route 
              path="manager" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Performance Dashboard */}
            <Route 
              path="performance" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <PerformanceDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Operational Analytics Dashboard */}
            <Route 
              path="analytics-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'dispatcher']}>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Fleet Performance Dashboard */}
            <Route 
              path="fleet-performance" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'dispatcher']}>
                  <FleetPerformanceDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Fuel Dashboard (legacy) */}
            <Route 
              path="fuel" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'dispatcher']}>
                  <FuelDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Fuel Monitoring (new) */}
            <Route 
              path="fuel-records" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'dispatcher', 'driver']}>
                  <FuelMonitoring />
                </ProtectedRoute>
              } 
            />

            {/* System Monitoring */}
            <Route 
              path="system-monitoring" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <SystemMonitoring />
                </ProtectedRoute>
              } 
            />

            {/* Driver Assignments */}
            <Route 
              path="driver-assignments" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'dispatcher', 'driver']}>
                  <DriverAssignments />
                </ProtectedRoute>
              } 
            />

            {/* Driver Attendance */}
            <Route 
              path="attendance" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'dispatcher', 'driver']}>
                  <Attendance />
                </ProtectedRoute>
              } 
            />

            {/* Dispatcher workspace */}
            <Route 
              path="dispatcher" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'dispatcher']}>
                  <DispatcherDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Driver workspace */}
            <Route 
              path="driver" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'driver']}>
                  <DriverDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Shipment Management (Shared CRUD) */}
            <Route 
              path="shipments" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'dispatcher']}>
                  <ShipmentManagement />
                </ProtectedRoute>
              } 
            />

            {/* Shipment Tracking details */}
            <Route 
              path="shipments/:shipmentId/track" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'dispatcher', 'driver']}>
                  <ShipmentTracking />
                </ProtectedRoute>
              } 
            />

            {/* Trip Assignment / Route Planning */}
            <Route 
              path="trips" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'dispatcher']}>
                  <TripManagement />
                </ProtectedRoute>
              } 
            />

            {/* Google Route Details */}
            <Route 
              path="trips/:tripId/route" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'dispatcher', 'driver']}>
                  <RouteDetails />
                </ProtectedRoute>
              } 
            />

            {/* Maintenance Management */}
            <Route 
              path="maintenance" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <MaintenanceManagement />
                </ProtectedRoute>
              } 
            />

            {/* Maintenance Reports */}
            <Route 
              path="maintenance-reports" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'dispatcher']}>
                  <MaintenanceReports />
                </ProtectedRoute>
              } 
            />

            {/* Driver Monitoring */}
            <Route 
              path="drivers/monitor" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <DriverMonitoring />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
