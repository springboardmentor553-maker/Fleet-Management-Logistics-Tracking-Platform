import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Shipments from "./pages/Shipments";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import RoutePlanner from "./pages/RoutePlanner";
import Trips from "./pages/Trips";
import EditTrip from "./pages/EditTrip";
import Tracking from "./pages/Tracking";
import Maintenance from "./pages/Maintenance";
import Fuel from "./pages/Fuel";
import DriverAssignment from "./pages/DriverAssignment";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";

import Layout from "./Layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            LOGIN
        ========================= */}
        <Route
          path="/"
          element={<Login />}
        />

        {/* =========================
            MAIN APPLICATION
        ========================= */}

        <Route element={<Layout />}>

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/vehicles"
            element={<Vehicles />}
          />

          <Route
            path="/drivers"
            element={<Drivers />}
          />

          <Route
            path="/shipments"
            element={<Shipments />}
          />

          <Route
            path="/trips"
            element={<Trips />}
          />

          <Route
            path="/trips/edit/:id"
            element={<EditTrip />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/maintenance"
            element={<Maintenance />}
          />

          <Route
            path="/fuel"
            element={<Fuel />}
          />

          <Route
            path="/notifications"
            element={<Notifications />}
          />

          <Route
            path="/driver-assignment"
            element={<DriverAssignment />}
          />

          <Route
            path="/analytics"
            element={<Analytics />}
          />

          <Route
            path="/users"
            element={<Users />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />

          <Route
            path="/route-planner"
            element={<RoutePlanner />}
          />

          <Route
            path="/route-planner/:id"
            element={<RoutePlanner />}
          />

          <Route
            path="/tracking/:tripId"
            element={<Tracking />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;