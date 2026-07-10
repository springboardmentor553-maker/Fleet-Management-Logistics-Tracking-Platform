import { Routes, Route, Navigate } from "react-router-dom";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Drivers from "./pages/Drivers";
import Vehicles from "./pages/Vehicles";
import Shipments from "./pages/Shipments";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

import MainLayout from "./layout/MainLayout";

// Protected Route
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      {/* Login */}

      <Route path="/login" element={<Login />} />

      {/* Default */}

      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected Routes */}

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/drivers" element={<Drivers />} />

        <Route path="/vehicles" element={<Vehicles />} />

        <Route path="/shipments" element={<Shipments />} />

        <Route path="/profile" element={<Profile />} />

        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      {/* Invalid URL */}

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
