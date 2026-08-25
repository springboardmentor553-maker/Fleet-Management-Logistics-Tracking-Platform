import { getCurrentUser } from './authStorage'

export { getCurrentUser }

export function canEdit() {
  const user = getCurrentUser()
  if (!user) return false
  return ['admin', 'fleet_manager'].includes(user.role)
}

export function isAdmin() {
  const user = getCurrentUser()
  return user?.role === 'admin'
}