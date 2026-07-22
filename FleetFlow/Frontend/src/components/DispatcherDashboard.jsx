import { useEffect, useState } from 'react'
import StatCard from './StatCard'
import { getDispatcherDashboardStats } from '../api/dashboard'

const DISPATCH_CARDS = [
  { key: 'pending_shipments', label: 'Pending Dispatch Queue', icon: '🕐', color: '#8b5cf6' },
  { key: 'in_transit_shipments', label: 'Active In-Transit', icon: '🔄', color: '#06b6d4' },
  { key: 'available_drivers', label: 'Available Drivers', icon: '👤', color: '#22c55e' },
  { key: 'available_vehicles', label: 'Available Vehicles', icon: '🚛', color: '#3b82f6' },
  { key: 'total_shipments', label: 'Total Managed Shipments', icon: '📦', color: '#6366f1' },
  { key: 'delivered_shipments', label: 'Delivered', icon: '🎯', color: '#10b981' },
  { key: 'cancelled_shipments', label: 'Cancelled', icon: '❌', color: '#ef4444' },
]

export default function DispatcherDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getDispatcherDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-content">
      {/* UPPER DISPATCH OVERVIEW HERO SECTION */}
      <div className="hero-banner dispatch-hero">
        <div className="hero-overlay">
          <div className="hero-content-split">
            <div className="hero-text">
              <div className="status-tag-live">
                <span className="dot-pulse"></span> Dispatch Operations Active
              </div>
              <h1>Logistics Command & Dispatch Desk</h1>
              <h3>Streamlined Route Assignment & Fleet Resource Allocation</h3>
              <p>
                Manage pending cargo queues, match available drivers and fleet vehicles, schedule optimized trips, and track live transit ETAs.
              </p>
              <div className="hero-btn-group">
                {onNavigate && (
                  <>
                    <button className="hero-btn primary-glow" onClick={() => onNavigate('shipments')}>
                      📦 Open Shipment Desk
                    </button>
                    <button className="hero-btn secondary-glass" onClick={() => onNavigate('map')}>
                      🗺️ Monitor Live Map
                    </button>
                  </>
                )}
              </div>
            </div>

            {stats && (
              <div className="dispatch-quick-widget">
                <div className="widget-header">
                  <span className="widget-icon">⚡</span>
                  <h4>Dispatch Readiness</h4>
                </div>
                <div className="widget-stat">
                  <span className="widget-label">Pending Orders</span>
                  <span className="widget-value purple">{stats.pending_shipments}</span>
                </div>
                <div className="widget-divider" />
                <div className="widget-stat">
                  <span className="widget-label">Drivers Ready</span>
                  <span className="widget-value green">{stats.available_drivers}</span>
                </div>
                <div className="widget-divider" />
                <div className="widget-stat">
                  <span className="widget-label">Vehicles Ready</span>
                  <span className="widget-value blue">{stats.available_vehicles}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="page-header" style={{ marginTop: '20px' }}>
        <div>
          <h2>Dispatcher Real-Time Overview</h2>
          <p>Live metrics for shipment status queues and resource availability</p>
        </div>
      </div>

      {loading && <div className="status-msg">Loading Dispatcher Overview...</div>}
      {error && <div className="status-msg error">{error}</div>}

      {stats && (
        <div className="stats-grid">
          {DISPATCH_CARDS.map((card) => (
            <StatCard
              key={card.key}
              label={card.label}
              value={stats[card.key]}
              icon={card.icon}
              color={card.color}
            />
          ))}
        </div>
      )}
    </div>
  )
}
