import { Bell, Package, Calendar } from 'lucide-react'
import { buildNotifications } from '../utils/notifications'

export default function Notifications({ shipments, trips }) {
  const notifications = buildNotifications(shipments, trips)

  return (
    <div className="ff-section">
      <div className="ff-page-header">
        <div>
          <div className="ff-section-title"><Bell size={16} /><span>Notifications</span></div>
          <p className="ff-page-subtitle">All recent activity across your fleet</p>
        </div>
      </div>

      <div className="ff-widget-card">
        {notifications.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No notifications yet</p>
        )}
        {notifications.map(n => (
          <div key={n.id} className="ff-notif-item" style={{ padding: '14px 4px' }}>
            <div className={`ff-notif-icon ${n.type}`}>
              {n.type === 'shipment' ? <Package size={14} /> : <Calendar size={14} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{n.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{n.message}</div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}