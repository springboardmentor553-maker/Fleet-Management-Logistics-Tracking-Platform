import { useEffect, useState } from 'react'
import StatCard from './StatCard'
import { getFleetManagerDashboardStats } from '../api/dashboard'

const FLEET_CARDS = [
  { key: 'total_vehicles', label: 'Total Fleet Vehicles', icon: '🚛', color: '#6366f1' },
  { key: 'available_vehicles', label: 'Ready for Assignment', icon: '✅', color: '#22c55e' },
  { key: 'in_transit_vehicles', label: 'Vehicles In Transit', icon: '🚚', color: '#f97316' },
  { key: 'in_maintenance_vehicles', label: 'In Maintenance', icon: '🔧', color: '#ef4444' },
  { key: 'total_drivers', label: 'Total Fleet Drivers', icon: '👥', color: '#64748b' },
  { key: 'available_drivers', label: 'Available Drivers', icon: '👤', color: '#10b981' },
  { key: 'on_trip_drivers', label: 'Drivers On Active Trip', icon: '🛣️', color: '#f59e0b' },
]

export default function FleetManagerDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getFleetManagerDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-content">
      <div className="hero-banner">
        <div className="hero-overlay">
          <div className="hero-text">
            <span className="hero-badge">Fleet Management</span>
            <h1>Fleet Operations Center</h1>
            <h3>Vehicle Health & Driver Resource Management</h3>
            <p>
              Monitor vehicle readiness, track maintenance status, manage driver availability, and optimize vehicle deployment across logistics routes.
            </p>
            {onNavigate && (
              <button className="hero-btn" onClick={() => onNavigate('vehicles')}>
                Manage Fleet Vehicles
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-header">
        <div>
          <h2>Fleet Manager Dashboard</h2>
          <p>Real-time inventory and availability metrics</p>
        </div>
      </div>

      {loading && <div className="status-msg">Loading Fleet Dashboard...</div>}
      {error && <div className="status-msg error">{error}</div>}

      {stats && (
        <div className="stats-grid">
          {FLEET_CARDS.map((card) => (
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
