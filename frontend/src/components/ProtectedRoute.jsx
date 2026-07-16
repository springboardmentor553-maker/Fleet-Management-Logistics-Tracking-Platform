import { Navigate, Outlet } from 'react-router-dom'
import { getStoredUser } from '../services/api'

export default function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem('fleetflow_token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles) {
    const user = getStoredUser()
    const userRole = user?.role
    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to="/403" replace />
    }
  }

  return <Outlet />
}