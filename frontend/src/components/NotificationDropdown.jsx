import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Package, Calendar } from 'lucide-react'
import { buildNotifications, getUnreadCount, markNotificationsSeen } from '../utils/notifications'

export default function NotificationDropdown({ shipments, trips }) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const ref = useRef(null)
  const navigate = useNavigate()

  const notifications = buildNotifications(shipments, trips).slice(0, 8)

  useEffect(() => {
    setUnread(getUnreadCount(buildNotifications(shipments, trips)))
  }, [shipments, trips])

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
      setUnread(0)
    }
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
          <div className="ff-notif-list">
            {notifications.length === 0 && (
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