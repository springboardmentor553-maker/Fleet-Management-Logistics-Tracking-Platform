import { useEffect, useState } from 'react'
import StatCard from './StatCard'
import { getDriverDashboardStats } from '../api/dashboard'

export default function DriverDashboard({ onNavigate, onViewTripMap }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getDriverDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-content">
      <div className="hero-banner">
        <div className="hero-overlay">
          <div className="hero-text">
            <span className="hero-badge">Driver Portal</span>
            <h1>Welcome, {stats?.driver_name || 'Driver'}!</h1>
            <h3>My Active Assignments & Trip Navigation</h3>
            <p>
              View your assigned delivery packages, access your trip route on the live map, and log updates as you complete your deliveries.
            </p>
            {stats?.active_trip_id && onViewTripMap && (
              <button className="hero-btn" onClick={() => onViewTripMap(stats.active_trip_id)}>
                Navigate Active Trip #{stats.active_trip_id}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-header">
        <div>
          <h2>Driver Dashboard</h2>
          <p>Personal delivery status and vehicle details</p>
        </div>
      </div>

      {loading && <div className="status-msg">Loading Driver Portal...</div>}
      {error && <div className="status-msg error">{error}</div>}

      {stats && (
        <>
          <div className="stats-grid">
            <StatCard
              label="Assigned Shipments"
              value={stats.assigned_shipments}
              icon="📦"
              color="#3b82f6"
            />
            <StatCard
              label="Pending Deliveries"
              value={stats.pending_deliveries}
              icon="🚚"
              color="#f97316"
            />
            <StatCard
              label="Completed Deliveries"
              value={stats.completed_deliveries}
              icon="🎯"
              color="#10b981"
            />
          </div>

          <div style={{ marginTop: '24px' }}>
            <div className="setting-card">
              <h3>Active Vehicle Assignment</h3>
              <p>
                <strong>Assigned Vehicle:</strong> {stats.vehicle_license_plate || 'No vehicle currently assigned'}
              </p>
              <p style={{ marginTop: '8px' }}>
                <strong>Active Trip:</strong> {stats.active_trip_id ? `Trip #${stats.active_trip_id}` : 'None'}
              </p>
              {stats.active_trip_id && onViewTripMap && (
                <button
                  className="btn-primary"
                  style={{ marginTop: '12px' }}
                  onClick={() => onViewTripMap(stats.active_trip_id)}
                >
                  Open Navigation Map
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
