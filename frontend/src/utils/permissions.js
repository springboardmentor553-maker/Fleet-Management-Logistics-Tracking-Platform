export function getCurrentUser() {
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
}

export function canEdit() {
  const user = getCurrentUser()
  if (!user) return false
  return ['admin', 'fleet_manager'].includes(user.role)
}