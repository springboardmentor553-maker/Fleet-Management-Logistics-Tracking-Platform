import { useEffect, useState } from 'react'
import StatCard from './StatCard'
import { getAdminDashboardStats } from '../api/dashboard'

const ADMIN_CARDS = [
  { key: 'total_users', label: 'Total Registered Users', icon: '👥', color: '#6366f1' },
  { key: 'active_users', label: 'Active Users', icon: '⚡', color: '#22c55e' },
  { key: 'admin_count', label: 'Administrators', icon: '👑', color: '#f59e0b' },
  { key: 'fleet_manager_count', label: 'Fleet Managers', icon: '🛠️', color: '#3b82f6' },
  { key: 'dispatcher_count', label: 'Dispatchers', icon: '📡', color: '#8b5cf6' },
  { key: 'driver_count', label: 'Drivers', icon: '🚛', color: '#06b6d4' },
  { key: 'total_vehicles', label: 'Total Fleet Vehicles', icon: '🚐', color: '#64748b' },
  { key: 'total_shipments', label: 'Total System Shipments', icon: '📦', color: '#ec4899' },
  { key: 'delivered_shipments', label: 'Successful Deliveries', icon: '🎯', color: '#10b981' },
]

export default function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-content">
      <div className="hero-banner">
        <div className="hero-overlay">
          <div className="hero-text">
            <span className="hero-badge">System Administration</span>
            <h1>FleetFlow Control Center</h1>
            <h3>Admin & User Governance Dashboard</h3>
            <p>
              Manage system permissions, oversee user roles, monitor overall fleet logistics performance, and keep tabs on infrastructure status.
            </p>
          </div>
        </div>
      </div>

      <div className="page-header">
        <div>
          <h2>Administrator Overview</h2>
          <p>Global system statistics and platform governance</p>
        </div>
      </div>

      {loading && <div className="status-msg">Loading Admin Dashboard...</div>}
      {error && <div className="status-msg error">{error}</div>}

      {stats && (
        <div className="stats-grid">
          {ADMIN_CARDS.map((card) => (
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
