import { useState, useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Truck, Menu } from 'lucide-react'
import './App.css'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Sidebar from './components/Sidebar'
import DashboardHome from './pages/DashboardHome'
import Shipments from './pages/Shipments'
import Fleet from './pages/Fleet'
import Drivers from './pages/Drivers'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import api from './api/axios'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import DriverDetail from './pages/DriverDetail'
import Profile from './pages/Profile'
import RoutesPage from './pages/Routes'
import Trips from './pages/Trips'
import UsersManagement from './pages/UsersManagement'
import Maintenance from './pages/Maintenance'
import DriverAssignments from './pages/DriverAssignments'
import FuelRecords from './pages/FuelRecords'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import { WS_BASE_URL } from "./config";
import Topbar from './components/Topbar'

function DashboardLayout({
  vehicles, drivers, shipments, trips, maintenanceRecords, driverAssignments, driverAttendance, maintenanceAlerts, loading,
  darkMode, setDarkMode, search, setSearch,
  menuOpen, setMenuOpen, onVehicleAdded, onVehicleDeleted, onShipmentAdded, onDriverAdded, onDriverDeleted, onShipmentStatusUpdate, onRefresh, onTripAdded, onTripDeleted, onMaintenanceAdded, onMaintenanceDeleted,
  onAssignmentAdded, onAssignmentDeleted, onAttendanceAdded, onAttendanceDeleted, onMaintenanceAlertRead
}) {
  return (
    <div className={`ff-app ${darkMode ? 'dark' : ''}`}>

      <header className="ff-mobile-header">
        <button className="ff-menu-trigger" onClick={() => setMenuOpen(!menuOpen)}>
          <Menu size={22} />
        </button>
        <div className="ff-logo-mobile">
          <div className="ff-logo-icon"><Truck size={15} /></div>
          <span className="ff-logo-text">FleetFlow</span>
        </div>
        <div style={{ width: 22 }} />
      </header>

      {menuOpen && <div className="ff-sidebar-overlay" onClick={() => setMenuOpen(false)} />}

      <Sidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <main className="ff-main">

        <Topbar
          search={search}
          setSearch={setSearch}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          shipments={shipments}
          trips={trips}
          maintenanceAlerts={maintenanceAlerts}
          onMaintenanceAlertRead={onMaintenanceAlertRead}
        />

        <Routes>
          <Route
            path="/"
            element={
              <DashboardHome
                vehicles={vehicles}
                drivers={drivers}
                shipments={shipments}
                trips={trips}
                maintenanceRecords={maintenanceRecords}
                loading={loading}
                search={search}
                onRefresh={onRefresh}
              />
            }
          />
          <Route
            path="/shipments"
            element={<Shipments shipments={shipments} vehicles={vehicles} drivers={drivers} loading={loading} search={search} onShipmentAdded={onShipmentAdded} onStatusUpdate={onShipmentStatusUpdate} />}
          />
          <Route
            path="/fleet"
            element={<Fleet vehicles={vehicles} loading={loading} search={search} onVehicleAdded={onVehicleAdded} onVehicleDeleted={onVehicleDeleted} />}
          />
          <Route
            path="/drivers"
            element={<Drivers drivers={drivers} shipments={shipments} trips={trips} driverAttendance={driverAttendance} loading={loading} search={search} onDriverAdded={onDriverAdded} onDriverDeleted={onDriverDeleted} />}
          />
          <Route
            path="/drivers/:id"
            element={<DriverDetail drivers={drivers} vehicles={vehicles} shipments={shipments} driverAttendance={driverAttendance} />}
          />
          <Route path="/routes" element={<RoutesPage />} />
          <Route
            path="/maintenance"
            element={<Maintenance vehicles={vehicles} maintenanceRecords={maintenanceRecords} loading={loading} search={search} onRecordAdded={onMaintenanceAdded} onRecordDeleted={onMaintenanceDeleted} />}
          />
          <Route
            path="/driver-assignments"
            element={<DriverAssignments drivers={drivers} vehicles={vehicles} driverAssignments={driverAssignments} driverAttendance={driverAttendance} loading={loading} search={search} onAssignmentAdded={onAssignmentAdded} onAssignmentDeleted={onAssignmentDeleted} onAttendanceAdded={onAttendanceAdded} onAttendanceDeleted={onAttendanceDeleted} />}
          />
          <Route
            path="/fuel-records"
            element={<FuelRecords vehicles={vehicles} drivers={drivers} search={search} />}
          />
          <Route path="/analytics" element={<Analytics />} />
          <Route
            path="/trips"
            element={<Trips trips={trips} vehicles={vehicles} drivers={drivers} shipments={shipments} loading={loading} search={search} onTripAdded={onTripAdded} onTripDeleted={onTripDeleted} />}
          />
          <Route
            path="/reports"
            element={<Reports vehicles={vehicles} drivers={drivers} trips={trips} shipments={shipments} maintenanceRecords={maintenanceRecords} />}
          />
          
          <Route path="/notifications" element={<Notifications shipments={shipments} trips={trips} maintenanceAlerts={maintenanceAlerts} onMaintenanceAlertRead={onMaintenanceAlertRead} />} />
          <Route path="/settings" element={<Settings darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users" element={<UsersManagement />} />
        </Routes>

      </main>
    </div>
  )
}

function App() {
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [shipments, setShipments] = useState([])
  const [trips, setTrips] = useState([])
  const [maintenanceRecords, setMaintenanceRecords] = useState([])
  const [driverAssignments, setDriverAssignments] = useState([])
  const [driverAttendance, setDriverAttendance] = useState([])
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

const fetchAllData = () => {
  setLoading(true)
  Promise.allSettled([
    api.get('/vehicles/'),
    api.get('/drivers/'),
    api.get('/shipments/'),
    api.get('/trips/'),
    api.get('/maintenance/'),
    api.get('/driver-assignments/'),
    api.get('/driver-attendance/'),
    api.get('/maintenance-alerts/'),
  ])
    .then((results) => {
      const [vehiclesRes, driversRes, shipmentsRes, tripsRes, maintenanceRes, assignmentsRes, attendanceRes, alertsRes] = results
      if (vehiclesRes.status === 'fulfilled') setVehicles(vehiclesRes.value.data)
      if (driversRes.status === 'fulfilled') setDrivers(driversRes.value.data)
      if (shipmentsRes.status === 'fulfilled') setShipments(shipmentsRes.value.data)
      if (tripsRes.status === 'fulfilled') setTrips(tripsRes.value.data)
      if (maintenanceRes.status === 'fulfilled') setMaintenanceRecords(maintenanceRes.value.data)
      if (assignmentsRes.status === 'fulfilled') setDriverAssignments(assignmentsRes.value.data)
      if (attendanceRes.status === 'fulfilled') setDriverAttendance(attendanceRes.value.data)
      if (alertsRes.status === 'fulfilled') setMaintenanceAlerts(alertsRes.value.data)
    })
    .catch(error => console.log("Fetch failed: ", error))
    .finally(() => setLoading(false))
}

useEffect(() => {
  fetchAllData()
}, [])

useEffect(() => {
  const interval = setInterval(() => {
    api.get('/maintenance-alerts/')
      .then(response => {
        setMaintenanceAlerts(response.data)
      })
      .catch(error => {
        console.log("Maintenance alert refresh failed:", error)
      })
  }, 30000)

  return () => clearInterval(interval)
}, [])

const wsRef = useRef(null)

useEffect(() => {
  const ws = new WebSocket(`${WS_BASE_URL}/ws/tracking`);
  wsRef.current = ws

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'vehicle_location_update') {
      setVehicles(prev => prev.map(v =>
        v.id === data.vehicle_id
          ? { ...v, current_lat: data.current_lat, current_lng: data.current_lng, status: data.status }
          : v
      ))
    }
    if (data.type === 'shipment_status_update') {
      setShipments(prev => prev.map(s =>
        s.id === data.shipment_id
          ? { ...s, status: data.status, vehicle_id: data.vehicle_id, driver_id: data.driver_id }
          : s
      ))
    }
  }

  ws.onerror = (err) => console.log('WebSocket error:', err)

  return () => ws.close()
}, [])

  const handleVehicleAdded = (vehicle, isEdit = false) => {
    if (isEdit) {
      setVehicles(prev => prev.map(v => v.id === vehicle.id ? vehicle : v))
    } else {
      setVehicles(prev => [...prev, vehicle])
    }
  }

  const handleVehicleDeleted = (vehicleId) => {
    setVehicles(prev => prev.filter(v => v.id !== vehicleId))
  }

  const handleShipmentAdded = (newShipment) => {
    setShipments(prev => [...prev, newShipment])
  }

  const handleDriverAdded = (driver, isEdit = false) => {
    if (isEdit) {
      setDrivers(prev => prev.map(d => d.id === driver.id ? driver : d))
    } else {
      setDrivers(prev => [...prev, driver])
    }
  }

  const handleDriverDeleted = (driverId) => {
    setDrivers(prev => prev.filter(d => d.id !== driverId))
  }

  const handleShipmentStatusUpdate = (updatedShipment) => {
    setShipments(prev => prev.map(s => s.id === updatedShipment.id ? updatedShipment : s))
  }

  const handleTripAdded = (trip, isEdit = false) => {
  if (isEdit) {
    setTrips(prev => prev.map(t => t.id === trip.id ? trip : t))
  } else {
    setTrips(prev => [...prev, trip])
  }
}

const handleTripDeleted = (tripId) => {
  setTrips(prev => prev.filter(t => t.id !== tripId))
}

const handleMaintenanceAdded = (record, isEdit = false) => {
  if (isEdit) {
    setMaintenanceRecords(prev => prev.map(r => r.id === record.id ? record : r))
  } else {
    setMaintenanceRecords(prev => [...prev, record])
  }
}

const handleMaintenanceDeleted = (recordId) => {
  setMaintenanceRecords(prev => prev.filter(r => r.id !== recordId))
}

const handleAssignmentAdded = (record, isEdit = false) => {
  if (isEdit) {
    setDriverAssignments(prev => prev.map(a => a.id === record.id ? record : a))
  } else {
    setDriverAssignments(prev => [...prev, record])
  }
}

const handleAssignmentDeleted = (assignmentId) => {
  setDriverAssignments(prev => prev.filter(a => a.id !== assignmentId))
}

const handleAttendanceAdded = (record, isEdit = false) => {
  if (isEdit) {
    setDriverAttendance(prev => prev.map(r => r.id === record.id ? record : r))
  } else {
    setDriverAttendance(prev => [...prev, record])
  }
}

const handleAttendanceDeleted = (attendanceId) => {
  setDriverAttendance(prev => prev.filter(r => r.id !== attendanceId))
}

const handleMaintenanceAlertRead = (alertId) => {
  setMaintenanceAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a))
}

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout
              vehicles={vehicles} drivers={drivers} shipments={shipments} trips={trips} maintenanceRecords={maintenanceRecords} driverAssignments={driverAssignments} driverAttendance={driverAttendance} maintenanceAlerts={maintenanceAlerts} loading={loading}
              darkMode={darkMode} setDarkMode={setDarkMode}
              search={search} setSearch={setSearch}
              menuOpen={menuOpen} setMenuOpen={setMenuOpen}
              onVehicleAdded={handleVehicleAdded}
              onVehicleDeleted={handleVehicleDeleted}
              onShipmentAdded={handleShipmentAdded}
              onDriverAdded={handleDriverAdded}
              onDriverDeleted={handleDriverDeleted}
              onShipmentStatusUpdate={handleShipmentStatusUpdate}
              onRefresh={fetchAllData}
              onTripAdded={handleTripAdded}
              onTripDeleted={handleTripDeleted}
              onMaintenanceAdded={handleMaintenanceAdded}
              onMaintenanceDeleted={handleMaintenanceDeleted}
              onAssignmentAdded={handleAssignmentAdded}
              onAssignmentDeleted={handleAssignmentDeleted}
              onAttendanceAdded={handleAttendanceAdded}
              onAttendanceDeleted={handleAttendanceDeleted}
              onMaintenanceAlertRead={handleMaintenanceAlertRead}
            />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
