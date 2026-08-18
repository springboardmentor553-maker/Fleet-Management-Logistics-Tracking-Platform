import { Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Shipments from "./pages/Shipments";
import Trips from "./pages/Trips";
import FuelRecords from "./pages/FuelRecords";
import Maintenance from "./pages/Maintenance";
import MaintenanceAlerts from "./pages/MaintenanceAlerts";
import Reports from "./pages/Reports";
import AddVehicle from "./pages/AddVehicle";
import EditVehicle from "./pages/EditVehicle";
import AddDriver from "./pages/AddDriver";
import EditDriver from "./pages/EditDriver";
import AddShipment from "./pages/AddShipment";
import EditShipment from "./pages/EditShipment";
import ShipmentTracking from "./pages/ShipmentTracking";
import AddTrip from "./pages/AddTrip";
import EditTrip from "./pages/EditTrip";
import TripETA from "./pages/TripETA";
import AddFuelRecord from "./pages/AddFuelRecord";
import AddMaintenance from "./pages/AddMaintenance";
import EditMaintenance from "./pages/EditMaintenance";
import DriverAssignments from "./pages/DriverAssignments";
import AddDriverAssignment from "./pages/AddDriverAssignment";
import DriverAttendance from "./pages/DriverAttendance";
import AddDriverAttendance from "./pages/AddDriverAttendance";
import EditDriverAttendance from "./pages/EditDriverAttendance";
import DriverPerformance from "./pages/DriverPerformance";
import AddMaintenanceAlert from "./pages/AddMaintenanceAlert";
import EditMaintenanceAlert from "./pages/EditMaintenanceAlert";
import EditDriverAssignment from "./pages/EditDriverAssignment";
import Profile from "./pages/profile";
import RouteGeneration from "./pages/RouteGeneration";
import LiveTracking from "./pages/LiveTracking";
import EditFuelRecord from "./pages/EditFuelRecord";
import Register from "./pages/Register";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/vehicles" element={<Vehicles />} />
      <Route path="/drivers" element={<Drivers />} />
      <Route path="/shipments" element={<Shipments />} />
      <Route path="/trips" element={<Trips />} />
      <Route path="/fuel-records" element={<FuelRecords />} />
      <Route path="/maintenance" element={<Maintenance />} />
      <Route path="/maintenance-alerts" element={<MaintenanceAlerts />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/add-vehicle" element={<AddVehicle />} />
      <Route path="/edit-vehicle/:id" element={<EditVehicle />} />
      <Route path="/add-driver" element={<AddDriver />} />
      <Route path="/edit-driver/:id" element={<EditDriver />} />
      <Route path="/add-shipment" element={<AddShipment />} />
      <Route path="/edit-shipment/:id" element={<EditShipment />} />
      <Route
    path="/track-shipment/:trackingNumber" element={<ShipmentTracking />} />
      <Route path="/add-trip" element={<AddTrip />} />
      <Route path="/edit-trip/:id" element={<EditTrip />} />
      <Route path="/trip-eta/:id" element={<TripETA />} />
      <Route path="/add-fuel" element={<AddFuelRecord />} />
      <Route path="/add-maintenance" element={<AddMaintenance />} />
      <Route path="/edit-maintenance/:id" element={<EditMaintenance />} />

      <Route path="/driver-assignments" element={<DriverAssignments />} />
      <Route path="/add-driver-assignment" element={<AddDriverAssignment />} />

      <Route path="/driver-attendance" element={<DriverAttendance />} />
      <Route path="/add-driver-attendance" element={<AddDriverAttendance />} />
      <Route path="/edit-driver-attendance/:id" element={<EditDriverAttendance />} />
      <Route path="/driver-performance" element={<DriverPerformance />} />
      <Route path="/add-maintenance-alert" element={<AddMaintenanceAlert />} />
      <Route path="/edit-maintenance-alert/:id" element={<EditMaintenanceAlert />} />
      <Route path="/edit-driver-assignment/:id" element={<EditDriverAssignment />} />
      <Route path="/profile" element={<Profile />} />
      <Route
  path="/route-generation"
  element={<RouteGeneration />}
/>
      <Route
  path="/live-tracking"
  element={<LiveTracking />}
  />
  <Route
  path="/edit-fuel/:id"
  element={<EditFuelRecord />}
/>
<Route path="/register" element={<Register />} />

    </Routes>
  );
}

export default App;