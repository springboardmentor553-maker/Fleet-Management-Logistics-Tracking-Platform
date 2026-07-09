import { useEffect, useState } from 'react'
import { vehicleService, driverService, getApiErrorMessage } from '../services/api'

export default function Maintenance() {
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // State to manage release operations
  const [submittingId, setSubmittingId] = useState(null)
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts((curr) => [...curr, { id, message, type }])
    setTimeout(() => {
      setToasts((curr) => curr.filter((t) => t.id !== id))
    }, 4000)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const [vehiclesRes, driversRes] = await Promise.all([
        vehicleService.getAll(),
        driverService.getAll(),
      ])
      setVehicles(vehiclesRes.data || [])
      setDrivers(driversRes.data || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to retrieve vehicle fleet details.'))
    } finally {
      setLoading(false)
    }
  }

  // Filter vehicles with maintenance status
  const maintenanceVehicles = vehicles.filter(
    (v) =>
      v.status?.toLowerCase() === 'maintenance' ||
      v.status?.toLowerCase() === 'under maintenance'
  )

  const getDriverName = (driverId) => {
    if (!driverId) return 'No Driver Assigned'
    const driverObj = drivers.find((d) => d.id === driverId)
    return driverObj ? driverObj.name : `ID: ${driverId}`
  }

  const handleReleaseToService = async (vehicle) => {
    setSubmittingId(vehicle.id)
    try {
      const payload = {
        ...vehicle,
        status: 'Available',
      }
      const res = await vehicleService.update(vehicle.id, payload)
      // Update local state
      setVehicles((curr) => curr.map((v) => (v.id === vehicle.id ? res.data : v)))
      addToast(`Vehicle ${vehicle.vehicle_number} has been released back into active service.`)
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Failed to update vehicle status.'), 'error')
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Overlay */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <span>{toast.type === 'success' ? '✅' : '❌'}</span>
            {toast.message}
          </div>
        ))}
      </div>

      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '6px' }}>Maintenance Log</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Track and authorize repairs, inspections, and active vehicle maintenance schedules.</p>
      </div>

      {error ? (
        <div style={errorCardStyle}>
          <p style={{ color: 'var(--danger-color)', fontWeight: 500 }}>{error}</p>
        </div>
      ) : loading ? (
        <div className="loading-container" style={{ minHeight: '40vh' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafbfd' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Vehicles currently out-of-service</span>
            <span className="badge badge--maintenance" style={{ fontSize: '0.75rem' }}>
              {maintenanceVehicles.length} Vehicles
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafbfd' }}>
                  <th style={thStyle}>Vehicle / Plate</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Assigned Driver</th>
                  <th style={thStyle}>Maintenance Status</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceVehicles.length > 0 ? (
                  maintenanceVehicles.map((vehicle) => (
                    <tr key={vehicle.id} style={trStyle}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{vehicle.vehicle_number}</td>
                      <td style={tdStyle}>{vehicle.vehicle_type}</td>
                      <td style={tdStyle}>{getDriverName(vehicle.driver_id)}</td>
                      <td style={tdStyle}>
                        <span className="badge badge--maintenance" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                          🔧 {vehicle.status}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button
                          className="btn btn--primary"
                          style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: 'var(--success-color)' }}
                          disabled={submittingId === vehicle.id}
                          onClick={() => handleReleaseToService(vehicle)}
                        >
                          {submittingId === vehicle.id ? 'Releasing...' : '✅ Release to Service'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      🎉 All fleet vehicles are currently active and available. No pending maintenance logs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle = {
  textAlign: 'left',
  padding: '14px 20px',
  fontSize: '0.825rem',
  textTransform: 'uppercase',
  color: 'var(--text-secondary)',
  borderBottom: '1px solid var(--border-color)',
  fontWeight: 600,
  letterSpacing: '0.02em',
}

const tdStyle = {
  padding: '14px 20px',
  borderBottom: '1px solid var(--border-color)',
  fontSize: '0.9rem',
}

const trStyle = {
  borderBottom: '1px solid var(--border-color)',
  transition: 'background-color 0.15s ease',
}

const errorCardStyle = {
  padding: '24px',
  backgroundColor: '#fef2f2',
  border: '1px solid #fee2e2',
  borderRadius: '12px',
  textAlign: 'center',
}