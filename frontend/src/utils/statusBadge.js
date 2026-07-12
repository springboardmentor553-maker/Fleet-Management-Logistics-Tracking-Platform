// Shared function so all status badges across the app use the same colors
export function getStatusBadgeClass(statusString) {
  if (!statusString) return 'in_use'
  const cleanStatus = statusString.toLowerCase().replace('_', ' ').trim()

  if (cleanStatus === 'delivered') return 'delivered'
  if (cleanStatus === 'in transit' || cleanStatus === 'assigned' || cleanStatus === 'created') return 'in_use'
  if (cleanStatus === 'delayed' || cleanStatus === 'cancelled') return 'maintenance'

  return 'in_use'
}