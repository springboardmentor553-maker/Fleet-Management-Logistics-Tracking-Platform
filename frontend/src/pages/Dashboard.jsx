import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getApiErrorMessage } from '../services/api'
import { 
  Truck, 
  Users, 
  Package, 
  CheckCircle2, 
  Wrench, 
  ClipboardCheck, 
  Plus, 
  UserPlus, 
  ArrowRight,
  AlertTriangle
} from 'lucide-react'

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

  const storedUser = localStorage.getItem('fleetflow_user')
  let role = 'Fleet Manager'
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser)
      role = parsedUser?.role || 'Fleet Manager'
    } catch (e) {
      // ignore
    }
  }

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
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading dashboard telemetry...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-card">
        <AlertTriangle className="error-card__icon" />
        <h2 className="error-card__title">Connection Failure</h2>
        <p className="error-card__desc">{error}</p>
        <button className="btn btn--primary" onClick={fetchDashboardData} style={{ marginTop: '12px' }}>
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
  const deliveredShipments = data.shipments.filter((s) => s.current_status?.toLowerCase() === 'delivered').length

  // Latest records
  const latestShipments = [...data.shipments].reverse().slice(0, 5)
  const latestDrivers = [...data.drivers].reverse().slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Title Header */}
      <div>
        <h1 className="page-title">Welcome back, {role}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Operational Overview &bull; Real-time logistics telemetry data.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {/* Total Vehicles */}
        <div className="kpi-card">
          <div className="kpi-card__icon-container" style={{ backgroundColor: '#EFF6FF', color: 'var(--primary)' }}>
            <Truck className="kpi-card__icon" />
          </div>
          <div className="kpi-card__details">
            <span className="kpi-card__label">Total Vehicles</span>
            <span className="kpi-card__value">{totalVehicles}</span>
          </div>
        </div>

        {/* Total Drivers */}
        <div className="kpi-card">
          <div className="kpi-card__icon-container" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>
            <Users className="kpi-card__icon" />
          </div>
          <div className="kpi-card__details">
            <span className="kpi-card__label">Total Drivers</span>
            <span className="kpi-card__value">{totalDrivers}</span>
          </div>
        </div>

        {/* Total Shipments */}
        <div className="kpi-card">
          <div className="kpi-card__icon-container" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <Package className="kpi-card__icon" />
          </div>
          <div className="kpi-card__details">
            <span className="kpi-card__label">Total Shipments</span>
            <span className="kpi-card__value">{totalShipments}</span>
          </div>
        </div>

        {/* Available Fleets */}
        <div className="kpi-card">
          <div className="kpi-card__icon-container" style={{ backgroundColor: '#E0F2FE', color: '#0284C7' }}>
            <CheckCircle2 className="kpi-card__icon" />
          </div>
          <div className="kpi-card__details">
            <span className="kpi-card__label">Available Fleets</span>
            <span className="kpi-card__value">{availableVehicles}</span>
          </div>
        </div>

        {/* In Maintenance */}
        <div className="kpi-card">
          <div className="kpi-card__icon-container" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
            <Wrench className="kpi-card__icon" />
          </div>
          <div className="kpi-card__details">
            <span className="kpi-card__label">In Maintenance</span>
            <span className="kpi-card__value">{maintenanceVehicles}</span>
          </div>
        </div>

        {/* Delivered Orders */}
        <div className="kpi-card">
          <div className="kpi-card__icon-container" style={{ backgroundColor: '#F0FDF4', color: '#15803D' }}>
            <ClipboardCheck className="kpi-card__icon" />
          </div>
          <div className="kpi-card__details">
            <span className="kpi-card__label">Delivered Orders</span>
            <span className="kpi-card__value">{deliveredShipments}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Data Tables & Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Column: Recent Shipments DataGrid */}
        <section className="datagrid-container">
          <div className="datagrid-header-bar">
            <h2 className="section-title" style={{ fontSize: '16px' }}>Recent Shipments</h2>
            <Link to="/shipments" className="btn btn--secondary" style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}>
              <span>View All</span>
              <ArrowRight style={{ width: '14px', height: '14px' }} />
            </Link>
          </div>
          <div className="datagrid-wrapper">
            <table className="datagrid">
              <thead>
                <tr>
                  <th>Tracking / Sender</th>
                  <th>Origin</th>
                  <th>Destination</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {latestShipments.length > 0 ? (
                  latestShipments.map((shipment) => (
                    <tr key={shipment.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div>{shipment.tracking_number}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400 }}>
                          {shipment.sender_name}
                        </div>
                      </td>
                      <td>{shipment.pickup_location}</td>
                      <td>{shipment.delivery_location}</td>
                      <td>
                        <span className={`badge badge--${shipment.current_status?.toLowerCase().replace(' ', '') || 'created'}`}>
                          {shipment.current_status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">
                      <div className="empty-state">
                        <Package className="empty-state__icon" />
                        <p className="empty-state__title">No shipments dispatched yet</p>
                        <p className="empty-state__desc">Dispatched cargo logs will list here.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Quick Actions & Drivers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Quick Operations Panel */}
          <section className="card" style={{ padding: '20px' }}>
            <div className="card__header" style={{ marginBottom: '16px' }}>
              <h3 className="card__title" style={{ fontSize: '15px' }}>Quick Operations</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/shipments" className="btn btn--secondary" style={{ justifyContent: 'flex-start', textDecoration: 'none' }}>
                <Plus className="btn-icon" style={{ color: 'var(--primary)' }} />
                <span>Create Shipment</span>
              </Link>
              <Link to="/vehicles" className="btn btn--secondary" style={{ justifyContent: 'flex-start', textDecoration: 'none' }}>
                <Truck className="btn-icon" style={{ color: 'var(--success)' }} />
                <span>Register Vehicle</span>
              </Link>
              <Link to="/drivers" className="btn btn--secondary" style={{ justifyContent: 'flex-start', textDecoration: 'none' }}>
                <UserPlus className="btn-icon" style={{ color: 'var(--warning)' }} />
                <span>Register Driver</span>
              </Link>
            </div>
          </section>

          {/* Recent Drivers List */}
          <section className="card" style={{ padding: '20px' }}>
            <div className="card__header" style={{ marginBottom: '16px' }}>
              <h3 className="card__title" style={{ fontSize: '15px' }}>Recent Drivers</h3>
              <Link to="/drivers" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>View All</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {latestDrivers.length > 0 ? (
                latestDrivers.map((driver) => (
                  <div key={driver.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-main)' }}>{driver.name}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{driver.phone}</p>
                    </div>
                    <span className={`badge badge--${driver.status?.toLowerCase().replace(' ', '')}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                      {driver.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '16px' }}>
                  <Users className="empty-state__icon" style={{ width: '32px', height: '32px' }} />
                  <p className="empty-state__title" style={{ fontSize: '13px' }}>No active drivers</p>
                </div>
              )}
            </div>
          </section>

        </div>

      </div>
    </div>
  )
}
