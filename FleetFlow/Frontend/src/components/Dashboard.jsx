import { useEffect, useState } from 'react'
import StatCard from './StatCard'
import AdminDashboard from './AdminDashboard'
import FleetManagerDashboard from './FleetManagerDashboard'
import DispatcherDashboard from './DispatcherDashboard'
import DriverDashboard from './DriverDashboard'
import { getDashboardStats } from '../api/dashboard'

const CARDS = [
  { key: 'total_vehicles', label: 'Total Vehicles', icon: '🚛', color: '#6366f1' },
  { key: 'available_vehicles', label: 'Available Vehicles', icon: '✅', color: '#22c55e' },
  { key: 'in_transit_vehicles', label: 'Vehicles In Transit', icon: '🚚', color: '#f97316' },
  { key: 'total_drivers', label: 'Total Drivers', icon: '👥', color: '#64748b' },
  { key: 'active_drivers', label: 'Active Drivers', icon: '👤', color: '#f59e0b' },
  { key: 'total_shipments', label: 'Total Shipments', icon: '📦', color: '#3b82f6' },
  { key: 'pending_shipments', label: 'Pending', icon: '🕐', color: '#8b5cf6' },
  { key: 'in_transit_shipments', label: 'In Transit', icon: '🔄', color: '#06b6d4' },
  { key: 'delivered_shipments', label: 'Delivered', icon: '🎯', color: '#10b981' },
  { key: 'cancelled_shipments', label: 'Cancelled', icon: '❌', color: '#ef4444' },
]

function DefaultDashboard({ onViewLive }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-content">
      <div className="hero-banner">
        <div className="hero-overlay">
          <div className="hero-text">
            <span className="hero-badge" />
            <h1>FleetFlow</h1>
            <h3>Smart Fleet & Logistics Tracking Platform</h3>
            <p>
              Monitor vehicles, drivers, shipments and GPS locations in one
              centralized dashboard with real-time tracking and intelligent fleet
              management.
            </p>
            <button className="hero-btn" onClick={onViewLive}>
              View Live Fleet
            </button>
          </div>
        </div>
      </div>

      <div className="page-header">
        <div>
          <h2>Fleet Dashboard</h2>
          <p>Real-time overview of your fleet operations</p>
        </div>
      </div>

      {loading && <div className="status-msg">Loading Dashboard...</div>}
      {error && <div className="status-msg error">{error}</div>}

      {stats && (
        <div className="stats-grid">
          {CARDS.map(card => (
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

export default function Dashboard({ user, onNavigate, onViewTripMap, onViewLive }) {
  const role = user?.role

  if (role === 'admin') {
    return <AdminDashboard onNavigate={onNavigate} />
  }

  if (role === 'fleet_manager') {
    return <FleetManagerDashboard onNavigate={onNavigate} />
  }

  if (role === 'dispatcher') {
    return <DispatcherDashboard onNavigate={onNavigate} />
  }

  if (role === 'driver') {
    return <DriverDashboard onNavigate={onNavigate} onViewTripMap={onViewTripMap} />
  }

  return <DefaultDashboard onViewLive={onViewLive} />
}