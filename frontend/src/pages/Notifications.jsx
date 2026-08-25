import { Bell, Package, Calendar, Wrench } from 'lucide-react'
import { buildNotifications } from '../utils/notifications'
import api from '../api/axios'

const formatRelativeTime = (isoString) => {
  if (!isoString) return ''
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

export default function Notifications({ shipments, trips, maintenanceAlerts = [], onMaintenanceAlertRead }) {
  const notifications = buildNotifications(shipments, trips)

  const handleAlertClick = async (alert) => {
    if (alert.is_read) return
    try {
      await api.put(`/maintenance-alerts/${alert.id}/read`)
      onMaintenanceAlertRead && onMaintenanceAlertRead(alert.id)
    } catch (err) {
      console.log('Failed to mark alert as read:', err)
    }
  }

  return (
    <div className="ff-section">
      <div className="ff-page-header">
        <div>
          <div className="ff-section-title"><Bell size={16} /><span>Notifications</span></div>
          <p className="ff-page-subtitle">All recent activity across your fleet</p>
        </div>
      </div>

      {maintenanceAlerts.length > 0 && (
        <div className="ff-widget-card" style={{ marginBottom: 16 }}>
          <div className="ff-widget-title"><span><Wrench size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Maintenance Alerts</span></div>
          {maintenanceAlerts.map(a => (
            <div
              key={`alert-${a.id}`}
              className="ff-notif-item"
              style={{ padding: '14px 4px', cursor: a.is_read ? 'default' : 'pointer', opacity: a.is_read ? 0.6 : 1 }}
              onClick={() => handleAlertClick(a)}
            >
              <div className="ff-notif-icon maintenance">
                <Wrench size={14} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: a.is_read ? 500 : 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`ff-badge ${a.alert_type === 'overdue' ? 'status-cancelled' : 'status-delayed'}`}>
                    {a.alert_type === 'overdue' ? 'Overdue' : 'Due Soon'}
                  </span>
                  {!a.is_read && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} />
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{a.message}</div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatRelativeTime(a.created_at)}</span>
            </div>
          ))}
        </div>
      )}

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
