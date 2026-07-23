import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Drivers from './pages/Drivers'
import Vehicles from './pages/Vehicles'
import Shipments from './pages/Shipments'
import Maintenance from './pages/Maintenance'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Users from './pages/Users'
import Trips from './pages/Trips'
import Tracking from './pages/Tracking'
import AccessDenied from './pages/AccessDenied'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/403" element={<AccessDenied />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Role Protected Paths */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Fleet Manager']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Dispatcher']} />}>
            <Route path="/shipments" element={<Shipments />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Dispatcher', 'Driver']} />}>
            <Route path="/trips" element={<Trips />} />
          </Route>

          <Route path="/tracking" element={<Tracking />} />
          
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/users" element={<Users />} />
          </Route>

          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

