// Builds a notification feed from existing shipment/trip data — no separate database table needed.

const timeAgo = (dateString) => {
  if (!dateString) return ''
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export function buildNotifications(shipments = [], trips = []) {
  const shipmentNotifs = shipments.map(s => ({
    id: `shipment-${s.id}`,
    type: 'shipment',
    title: `Shipment ${s.tracking_id}`,
    message: `${s.origin} to ${s.destination} — ${s.status.replace('_', ' ')}`,
    timestamp: s.created_at,
    time: timeAgo(s.created_at),
  }))

  const tripNotifs = trips.map(t => ({
    id: `trip-${t.id}`,
    type: 'trip',
    title: `Trip scheduled`,
    message: `${t.origin} to ${t.destination} — ${t.status}`,
    timestamp: t.created_at,
    time: timeAgo(t.created_at),
  }))

  return [...shipmentNotifs, ...tripNotifs]
    .filter(n => n.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

export function getUnreadCount(notifications) {
  const lastSeen = localStorage.getItem('notifications_last_seen')
  if (!lastSeen) return notifications.length

  const lastSeenDate = new Date(lastSeen)
  return notifications.filter(n => new Date(n.timestamp) > lastSeenDate).length
}

export function markNotificationsSeen() {
  localStorage.setItem('notifications_last_seen', new Date().toISOString())
}