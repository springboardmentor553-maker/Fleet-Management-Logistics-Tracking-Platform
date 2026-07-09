import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getApiErrorMessage } from '../services/api'

export default function Dashboard() {
  const [data, setData] = useState({
    drivers: [],
    vehicles: [],
    shipments: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      setError('')

      const [driversRes, vehiclesRes, shipmentsRes] = await Promise.all([
        api.get('/drivers/'),
        api.get('/vehicles/'),
        api.get('/shipments/'),
      ])

      setData({
        drivers: driversRes.data || [],
        vehicles: vehiclesRes.data || [],
        shipments: shipmentsRes.data || [],
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to connect to the server. Please check if the backend is running.'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading dashboard data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f8d7da', margin: '20px 0' }}>
        <h2 style={{ color: 'var(--danger-color)', marginBottom: '12px' }}>Connection Error</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 20px auto' }}>{error}</p>
        <button className="btn btn--primary" onClick={fetchDashboardData}>
          Retry Connection
        </button>
      </div>
    )
  }

  // Calculate dynamic stats
  const totalDrivers = data.drivers.length
  const totalVehicles = data.vehicles.length
  const totalShipments = data.shipments.length
  const availableVehicles = data.vehicles.filter((v) => v.status?.toLowerCase() === 'available').length
  const maintenanceVehicles = data.vehicles.filter((v) => v.status?.toLowerCase() === 'maintenance' || v.status?.toLowerCase() === 'under maintenance').length
  const deliveredShipments = data.shipments.filter((s) => s.status?.toLowerCase() === 'delivered').length

  // Latest records
  const latestShipments = [...data.shipments].reverse().slice(0, 5)
  const latestDrivers = [...data.drivers].reverse().slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '6px' }}>Operational Overview</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Real-time statistics fetched directly from the FleetFlow telemetry server.</p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div style={kpiCardStyle}>
          <div style={kpiIconBg('#eff6ff', '#2563eb')}>🚚</div>
          <div>
            <p style={kpiLabelStyle}>Total Vehicles</p>
            <h3 style={kpiValueStyle}>{totalVehicles}</h3>
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div style={kpiIconBg('#ecfdf5', '#10b981')}>👨‍✈️</div>
          <div>
            <p style={kpiLabelStyle}>Total Drivers</p>
            <h3 style={kpiValueStyle}>{totalDrivers}</h3>
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div style={kpiIconBg('#fef3c7', '#f59e0b')}>📦</div>
          <div>
            <p style={kpiLabelStyle}>Total Shipments</p>
            <h3 style={kpiValueStyle}>{totalShipments}</h3>
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div style={kpiIconBg('#e0f2fe', '#0284c7')}>✅</div>
          <div>
            <p style={kpiLabelStyle}>Available Fleets</p>
            <h3 style={kpiValueStyle}>{availableVehicles}</h3>
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div style={kpiIconBg('#fef2f2', '#ef4444')}>🔧</div>
          <div>
            <p style={kpiLabelStyle}>In Maintenance</p>
            <h3 style={kpiValueStyle}>{maintenanceVehicles}</h3>
          </div>
        </div>

        <div style={kpiCardStyle}>
          <div style={kpiIconBg('#f0fdf4', '#15803d')}>🏁</div>
          <div>
            <p style={kpiLabelStyle}>Delivered Orders</p>
            <h3 style={kpiValueStyle}>{deliveredShipments}</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Data Tables & Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Side: Recent Shipments */}
        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>Recent Shipments</h2>
            <Link to="/shipments" style={panelLinkStyle}>View All</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Source</th>
                  <th style={thStyle}>Destination</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {latestShipments.length > 0 ? (
                  latestShipments.map((shipment) => (
                    <tr key={shipment.id} style={trStyle}>
                      <td style={tdStyle}>{shipment.shipment_name}</td>
                      <td style={tdStyle}>{shipment.source}</td>
                      <td style={tdStyle}>{shipment.destination}</td>
                      <td style={tdStyle}>
                        <span className={`badge badge--${shipment.status?.toLowerCase()}`}>
                          {shipment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '24px', textStyle: 'italic', color: 'var(--text-secondary)', textAlign: 'center' }}>
                      No shipments created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Side: Quick Actions & Drivers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Quick Actions */}
          <section style={panelStyle}>
            <h2 style={{ ...panelTitleStyle, marginBottom: '16px' }}>Quick Operations</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/shipments" className="btn btn--secondary" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                📦 Create Shipment
              </Link>
              <Link to="/vehicles" className="btn btn--secondary" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                🚚 Register Vehicle
              </Link>
              <Link to="/drivers" className="btn btn--secondary" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                👨‍✈️ Register Driver
              </Link>
            </div>
          </section>

          {/* Recent Drivers */}
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Recent Drivers</h2>
              <Link to="/drivers" style={panelLinkStyle}>View All</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {latestDrivers.length > 0 ? (
                latestDrivers.map((driver) => (
                  <div key={driver.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '0.9rem' }}>{driver.name}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{driver.phone}</p>
                    </div>
                    <span className={`badge badge--${driver.status?.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                      {driver.status}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No registered drivers.</p>
              )}
            </div>
          </section>

        </div>

      </div>
    </div>
  )
}

// Inline styles designed for strict clean look, complementing main.css
const kpiCardStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '20px',
  backgroundColor: '#fff',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
  boxShadow: 'var(--shadow-sm)',
  gap: '16px',
}

const kpiIconBg = (bg, color) => ({
  width: '46px',
  height: '46px',
  borderRadius: '8px',
  backgroundColor: bg,
  color: color,
  display: 'flex',
  alignItems: 'center',
  justifycontent: 'center',
  justifyContent: 'center',
  fontSize: '1.4rem',
  flexShrink: 0,
})

const kpiLabelStyle = {
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '2px',
}

const kpiValueStyle = {
  fontSize: '1.5rem',
  fontWeight: 700,
  lineHeight: 1.1,
}

const panelStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
  padding: '24px',
  boxShadow: 'var(--shadow-sm)',
}

const panelHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
}

const panelTitleStyle = {
  fontSize: '1rem',
  fontWeight: 600,
}

const panelLinkStyle = {
  fontSize: '0.85rem',
  color: 'var(--primary-color)',
  textDecoration: 'none',
  fontWeight: 500,
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
}

const thStyle = {
  textAlign: 'left',
  padding: '12px 10px',
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  color: 'var(--text-secondary)',
  borderBottom: '1px solid var(--border-color)',
  fontWeight: 600,
}

const tdStyle = {
  padding: '12px 10px',
  borderBottom: '1px solid var(--border-color)',
  fontSize: '0.875rem',
}

const trStyle = {
  transition: 'background-color 0.2s',
}
