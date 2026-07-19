import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, IdCard, Truck, Package, User, Calendar, CheckCircle2, Star } from 'lucide-react'

// Same calculation used on the Drivers list page — kept in sync so the number
// shown here always matches what's shown in the table.
function calculateRating(driverId, shipments) {
  const relevant = (shipments || []).filter(s => s.driver_id === driverId && s.status !== 'cancelled')
  if (relevant.length === 0) return null
  const delivered = relevant.filter(s => s.status === 'delivered').length
  return Math.round((delivered / relevant.length) * 5 * 10) / 10
}

function StarRating({ rating }) {
  if (rating === null || rating === undefined) {
    return <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No data yet</span>
  }
  const rounded = Math.round(rating)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
      <div style={{ display: 'flex', gap: 1 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={14}
            fill={i <= rounded ? '#f5a623' : 'none'}
            color={i <= rounded ? '#f5a623' : 'var(--border)'}
          />
        ))}
      </div>
      <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 600 }}>{rating}</span>
    </div>
  )
}

export default function DriverDetail({ drivers = [], vehicles = [], shipments = [] }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const driver = drivers.find(d => d.id === parseInt(id))
const driverShipments = shipments.filter(s => s.driver_id === parseInt(id))

// Since vehicles aren't directly linked to drivers, we infer the "current" vehicle
// from the driver's most recent shipment that has a vehicle assigned
const mostRecentShipmentWithVehicle = [...driverShipments]
  .filter(s => s.vehicle_id)
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]

const assignedVehicle = mostRecentShipmentWithVehicle
  ? vehicles.find(v => v.id === mostRecentShipmentWithVehicle.vehicle_id)
  : null

  const initials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase()
  }

  if (!driver) {
    return (
      <div className="ff-section">
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Driver not found.</p>
        <button className="ff-btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/drivers')}>
          Back to Drivers
        </button>
      </div>
    )
  }

  const deliveredCount = driverShipments.filter(s => s.status === 'delivered').length
  const inTransitCount = driverShipments.filter(s => s.status === 'in_transit').length
  const rating = calculateRating(driver.id, shipments)

  return (
    <div className="ff-section">
      <div className="ff-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ArrowLeft size={18} style={{ cursor: 'pointer' }} onClick={() => navigate('/drivers')} />
          <div>
            <div className="ff-section-title"><User size={16} /><span>Driver Profile</span></div>
            <p className="ff-page-subtitle">Full details and trip history</p>
          </div>
        </div>
      </div>

      <div className="ff-profile-layout">
        {/* Left: driver info card */}
        <div className="ff-profile-card">
          <div className="ff-avatar" style={{ width: 64, height: 64, fontSize: 22, margin: '0 auto' }}>
            {initials(driver.name)}
          </div>
          <h3 style={{ textAlign: 'center', margin: '12px 0 4px' }}>{driver.name}</h3>
          <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10 }}>
            <span className={`ff-badge status-${driver.status}`}>{driver.status}</span>
          </p>

          <div style={{ marginBottom: 16 }}>
            <StarRating rating={rating} />
          </div>

          <div className="ff-profile-detail-row">
            <IdCard size={14} />
            <span>{driver.license_number}</span>
          </div>
          <div className="ff-profile-detail-row">
            <Phone size={14} />
            <span>{driver.phone || 'No phone on record'}</span>
          </div>
          <div className="ff-profile-detail-row">
            <Truck size={14} />
            <span>{assignedVehicle ? assignedVehicle.registration_number : 'No vehicle assigned'}</span>
          </div>
          <div className="ff-profile-detail-row">
            <Calendar size={14} />
            <span>{driver.experience_years != null ? `${driver.experience_years} years experience` : 'Experience not recorded'}</span>
          </div>
          <div className="ff-profile-detail-row">
            <CheckCircle2 size={14} />
            <span>{driver.attendance_percentage != null ? `${driver.attendance_percentage}% attendance` : 'Attendance not recorded'}</span>
          </div>
        </div>

        {/* Right: stats + trip history */}
        <div>
          <div className="ff-driver-stats" style={{ marginBottom: 16 }}>
            <div className="ff-mini-stat">
              <span className="ff-mini-stat-label">Total Shipments</span>
              <span className="ff-mini-stat-value">{driverShipments.length}</span>
            </div>
            <div className="ff-mini-stat">
              <span className="ff-mini-stat-label">Delivered</span>
              <span className="ff-mini-stat-value" style={{ color: 'var(--green)' }}>{deliveredCount}</span>
            </div>
            <div className="ff-mini-stat">
              <span className="ff-mini-stat-label">In Transit</span>
              <span className="ff-mini-stat-value" style={{ color: 'var(--accent)' }}>{inTransitCount}</span>
            </div>
          </div>

          <div className="ff-widget-card">
            <div className="ff-widget-title"><span><Package size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Shipment History</span></div>
            {driverShipments.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No shipments assigned to this driver yet.</p>
            ) : (
              <table className="ff-mini-table">
                <thead>
                  <tr><th>Tracking ID</th><th>Route</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {driverShipments.map(s => (
                    <tr key={s.id}>
                      <td>{s.tracking_id}</td>
                      <td>{s.origin} &rarr; {s.destination}</td>
                      <td><span className={`ff-badge status-${s.status}`}>{s.status.replace('_', ' ')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
