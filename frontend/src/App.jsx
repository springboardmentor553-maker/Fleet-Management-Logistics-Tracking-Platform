import { useState, useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Truck, Menu, Search, Sun, Moon, Bell } from 'lucide-react'
import './App.css'
import ProfileDropdown from './components/ProfileDropdown'
import Sidebar from './components/Sidebar'
import DashboardHome from './pages/DashboardHome'
import Shipments from './pages/Shipments'
import Fleet from './pages/Fleet'
import Drivers from './pages/Drivers'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import api from './api/axios'
import Register from './pages/Register'
import DriverDetail from './pages/DriverDetail'
import Profile from './pages/Profile'
import RoutesPage from './pages/Routes'
import Trips from './pages/Trips'

function DashboardLayout({
  vehicles, drivers, shipments, trips, loading,
  darkMode, setDarkMode, search, setSearch,
  menuOpen, setMenuOpen, onVehicleAdded, onVehicleDeleted, onShipmentAdded, onDriverAdded, onDriverDeleted, onShipmentStatusUpdate, onRefresh, onTripAdded, onTripDeleted
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

        <div className="ff-topbar">
          <div className="ff-search">
            <span className="ff-search-icon"><Search size={15} /></span>
            <input
              placeholder="Search vehicles, drivers, shipments..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="ff-topbar-actions">
            <div className="ff-icon-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle dark mode">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </div>
            <div className="ff-icon-btn" title="Notifications">
              <Bell size={16} />
              <span className="ff-notif-dot">5</span>
            </div>
            <ProfileDropdown />
          </div>
        </div>

        <Routes>
          <Route
            path="/"
            element={
              <DashboardHome
                vehicles={vehicles}
                drivers={drivers}
                shipments={shipments}
                trips={trips}
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
            element={<Drivers drivers={drivers} loading={loading} search={search} onDriverAdded={onDriverAdded} onDriverDeleted={onDriverDeleted} />}
          />
          <Route
            path="/drivers/:id"
            element={<DriverDetail drivers={drivers} vehicles={vehicles} shipments={shipments} />}
          />
          <Route path="/routes" element={<RoutesPage />} />
          <Route
            path="/trips"
            element={<Trips trips={trips} vehicles={vehicles} drivers={drivers} shipments={shipments} loading={loading} search={search} onTripAdded={onTripAdded} onTripDeleted={onTripDeleted} />}
          />
          <Route path="/profile" element={<Profile />} />
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
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

const fetchAllData = () => {
  setLoading(true)
  Promise.all([
    api.get('/vehicles/'),
    api.get('/drivers/'),
    api.get('/shipments/'),
    api.get('/trips/')
  ])
    .then(([vehiclesRes, driversRes, shipmentsRes, tripsRes]) => {
      setVehicles(vehiclesRes.data)
      setDrivers(driversRes.data)
      setShipments(shipmentsRes.data)
      setTrips(tripsRes.data)
    })
    .catch(error => console.log("Fetch failed: ", error))
    .finally(() => setLoading(false))
}

useEffect(() => {
  fetchAllData()
}, [])

const wsRef = useRef(null)

useEffect(() => {
  const ws = new WebSocket('ws://127.0.0.1:8000/ws/tracking')
  wsRef.current = ws

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'vehicle_location_update') {
      setVehicles(prev => prev.map(v =>
        v.id === data.vehicle_id
          ? { ...v, current_lat: data.current_lat, current_lng: data.current_lng }
          : v
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

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout
              vehicles={vehicles} drivers={drivers} shipments={shipments} trips={trips} loading={loading}
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
            />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App