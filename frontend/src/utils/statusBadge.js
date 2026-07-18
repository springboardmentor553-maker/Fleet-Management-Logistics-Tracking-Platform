// Shared function so all status badges across the app use the same colors
export function getStatusBadgeClass(statusString) {
  if (!statusString) return 'in_use'
  const cleanStatus = statusString.toLowerCase().replace(/_/g, ' ').trim()

  if (cleanStatus === 'delivered' || cleanStatus === 'completed') return 'delivered'
  if (
    cleanStatus === 'in transit' ||
    cleanStatus === 'assigned' ||
    cleanStatus === 'created' ||
    cleanStatus === 'picked up' ||
    cleanStatus === 'out for delivery' ||
    cleanStatus === 'scheduled' ||
    cleanStatus === 'ongoing'
  ) return 'in_use'
  if (cleanStatus === 'delayed' || cleanStatus === 'cancelled') return 'maintenance'

  return 'in_use'
}