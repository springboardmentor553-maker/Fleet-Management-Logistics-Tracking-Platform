export function getCurrentUser() {
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
}

export function canEdit() {
  const user = getCurrentUser()
  if (!user) return false
  return ['admin', 'fleet_manager'].includes(user.role)
}

export function isAdmin() {
  const user = getCurrentUser()
  return user?.role === 'admin'
}