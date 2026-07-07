import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { dashboardApi, vehicleApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, v] = await Promise.all([dashboardApi.summary(), vehicleApi.list()])
        setStats(s.data)
        setVehicles(v.data.slice(0, 6)) // show latest 6
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const now = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="top-bar">
          <div>
            <div className="top-bar-title">Fleet Dashboard</div>
            <div className="top-bar-subtitle">{now}</div>
          </div>
          <div className="top-bar-right">
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Signed in as <strong>{user?.email}</strong>
            </span>
          </div>
        </header>

        <main className="page-content">
          {/* Stat cards */}
          <div className="stat-grid">
            <StatCard
              label="Total Vehicles"
              value={loading ? '…' : stats?.totalVehicles}
              variant="total"
              desc="Registered in the system"
              icon={<TruckIcon color="var(--stat-total)" />}
            />
            <StatCard
              label="On Trip"
              value={loading ? '…' : stats?.active}
              variant="active"
              desc="Currently in use"
              icon={<ActiveIcon />}
            />
            <StatCard
              label="Maintenance"
              value={loading ? '…' : stats?.maintenance}
              variant="maint"
              desc="Under service"
              icon={<WrenchIcon />}
            />
            <StatCard
              label="Available"
              value={loading ? '…' : stats?.available}
              variant="avail"
              desc="Ready to deploy"
              icon={<CheckIcon />}
            />
          </div>

          {/* Quick fleet overview */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Recent Fleet Activity</div>
                <div className="card-subtitle">Last 6 registered vehicles</div>
              </div>
              <Link to="/vehicles" className="btn btn-outline btn-sm">View All →</Link>
            </div>
            <div className="table-wrapper">
              {loading ? (
                <div style={{ padding: 24 }}>
                  {[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
                </div>
              ) : vehicles.length === 0 ? (
                <div className="table-empty">
                  <div className="table-empty-icon">🚛</div>
                  <p>No vehicles registered yet.</p>
                  <Link to="/vehicles" className="btn btn-primary btn-sm" style={{ marginTop: 12, display: 'inline-flex' }}>
                    Register first vehicle
                  </Link>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Registration</th>
                      <th>Type</th>
                      <th>Fuel</th>
                      <th>Capacity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v) => (
                      <tr key={v.id}>
                        <td><strong>{v.registration_number}</strong></td>
                        <td>{v.vehicle_type}</td>
                        <td>{v.fuel_type}</td>
                        <td>{v.capacity}t</td>
                        <td><StatusBadge status={v.current_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Icons
function TruckIcon({ color }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>
}
function ActiveIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--stat-active)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
}
function WrenchIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--stat-maint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
}
function CheckIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--stat-available)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
}
