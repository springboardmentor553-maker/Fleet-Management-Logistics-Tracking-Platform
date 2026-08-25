import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Package, Calendar, Wrench } from 'lucide-react'
import { buildNotifications, getUnreadCount, markNotificationsSeen } from '../utils/notifications'
import api from '../api/axios'

const formatRelativeTime = (isoString) => {
  if (!isoString) return ''
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export default function NotificationDropdown({ shipments, trips, maintenanceAlerts = [], onMaintenanceAlertRead }) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const ref = useRef(null)
  const navigate = useNavigate()

  const notifications = buildNotifications(shipments, trips).slice(0, 8)
  const unreadAlerts = maintenanceAlerts.filter(a => !a.is_read)
  const alertsToShow = unreadAlerts.slice(0, 3)

  useEffect(() => {
    setUnread(getUnreadCount(buildNotifications(shipments, trips)) + unreadAlerts.length)
  }, [shipments, trips, maintenanceAlerts])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next) {
      markNotificationsSeen()
      setUnread(unreadAlerts.length)
    }
  }

  const handleAlertClick = async (alert) => {
    try {
      await api.put(`/maintenance-alerts/${alert.id}/read`)
      onMaintenanceAlertRead && onMaintenanceAlertRead(alert.id)
    } catch (err) {
      console.log('Failed to mark alert as read:', err)
    }
    navigate('/maintenance')
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className="ff-icon-btn" onClick={handleToggle} title="Notifications" style={{ cursor: 'pointer' }}>
        <Bell size={16} />
        {unread > 0 && <span className="ff-notif-dot">{unread > 9 ? '9+' : unread}</span>}
      </div>

      {open && (
        <div className="ff-notif-dropdown">
          <div className="ff-notif-dropdown-header">
            <span>Notifications</span>
          </div>

          {alertsToShow.length > 0 && (
            <div className="ff-notif-list" style={{ borderBottom: '1px solid var(--border)' }}>
              {alertsToShow.map(a => (
                <div key={`alert-${a.id}`} className="ff-notif-item" style={{ cursor: 'pointer' }} onClick={() => handleAlertClick(a)}>
                  <div className="ff-notif-icon maintenance">
                    <Wrench size={13} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                      {a.alert_type === 'overdue' ? 'Maintenance Overdue' : 'Maintenance Due Soon'}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{a.message}</div>
                  </div>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatRelativeTime(a.created_at)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="ff-notif-list">
            {notifications.length === 0 && alertsToShow.length === 0 && (
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '16px', textAlign: 'center' }}>
                No notifications yet
              </p>
            )}
            {notifications.map(n => (
              <div key={n.id} className="ff-notif-item">
                <div className={`ff-notif-icon ${n.type}`}>
                  {n.type === 'shipment' ? <Package size={13} /> : <Calendar size={13} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{n.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{n.message}</div>
                </div>
                <span style={{ fontSize: 10.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{n.time}</span>
              </div>
            ))}
          </div>
          <div className="ff-notif-dropdown-footer" onClick={() => { navigate('/notifications'); setOpen(false) }}>
            View all notifications
          </div>
        </div>
      )}
    </div>
  )
}
