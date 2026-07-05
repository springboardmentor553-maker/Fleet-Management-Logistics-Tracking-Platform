import { useEffect, useState } from 'react'
import StatCard from './StatCard'
import { getDashboardStats } from '../api/dashboard'

const CARDS = [
  { key: 'total_vehicles',       label: 'Total Vehicles',     icon: '🚛', color: '#6366f1' },
  { key: 'available_vehicles',   label: 'Available Vehicles', icon: '✅', color: '#22c55e' },
  { key: 'active_drivers',       label: 'Active Drivers',     icon: '👤', color: '#f59e0b' },
  { key: 'total_shipments',      label: 'Total Shipments',    icon: '📦', color: '#3b82f6' },
  { key: 'pending_shipments',    label: 'Pending',            icon: '🕐', color: '#8b5cf6' },
  { key: 'in_transit_shipments', label: 'In Transit',         icon: '🔄', color: '#06b6d4' },
  { key: 'delivered_shipments',  label: 'Delivered',          icon: '🎯', color: '#10b981' },
]

export default function Dashboard() {
  const [stats,   setStats]   = useState(null)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Fleet Dashboard</h2>
        <p>Live overview of your fleet operations</p>
      </div>

      {loading && <div className="status-msg">Loading stats...</div>}
      {error   && <div className="status-msg error">{error}</div>}

      {stats && (
        <div className="stats-grid">
          {CARDS.map(({ key, label, icon, color }) => (
            <StatCard key={key} label={label} value={stats[key]} icon={icon} color={color} />
          ))}
        </div>
      )}
    </div>
  )
}
