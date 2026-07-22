import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import Drivers from './pages/Drivers'
import Shipments from './pages/Shipments'
import Trips from './pages/Trips'
import LiveTracking from './pages/LiveTracking'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/vehicles"  element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
          <Route path="/drivers"   element={<ProtectedRoute><Drivers /></ProtectedRoute>} />
          <Route path="/shipments" element={<ProtectedRoute><Shipments /></ProtectedRoute>} />
          <Route path="/trips"     element={<ProtectedRoute><Trips /></ProtectedRoute>} />
          <Route path="/tracking"  element={<ProtectedRoute><LiveTracking /></ProtectedRoute>} />
          <Route path="/tracking/:tripId" element={<ProtectedRoute><LiveTracking /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
