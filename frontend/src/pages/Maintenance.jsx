import { useEffect, useState } from 'react'
import { vehicleService, driverService, getApiErrorMessage } from '../services/api'
import { 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  Check, 
  CheckSquare, 
  AlertTriangle,
  ClipboardList
} from 'lucide-react'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Toast Overlay */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="toast-icon toast-icon--success" aria-hidden="true" />
            ) : (
              <AlertCircle className="toast-icon toast-icon--error" aria-hidden="true" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header Panel */}
      <div>
        <h1 className="page-title">Maintenance Log</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Track and authorize repairs, inspections, and active vehicle maintenance schedules.
        </p>
      </div>

      {error ? (
        <div className="error-card">
          <AlertTriangle className="error-card__icon" />
          <h2 className="error-card__title">Retrieve Failed</h2>
          <p className="error-card__desc">{error}</p>
          <button className="btn btn--primary" onClick={loadData}>
            Retry Load
          </button>
        </div>
      ) : loading ? (
        <div className="loading-container" style={{ minHeight: '40vh' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        /* DataGrid Style Container */
        <div className="datagrid-container">
          <div className="datagrid-header-bar">
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
              Vehicles currently out-of-service
            </span>
            <span className="badge badge--warning" style={{ fontSize: '12px', fontWeight: 600 }}>
              <Wrench style={{ width: '13px', height: '13px' }} />
              <span>{maintenanceVehicles.length} Vehicles</span>
            </span>
          </div>

          <div className="datagrid-wrapper">
            <table className="datagrid">
              <thead>
                <tr>
                  <th>Vehicle / Plate</th>
                  <th>Type</th>
                  <th>Assigned Driver</th>
                  <th>Maintenance Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceVehicles.length > 0 ? (
                  maintenanceVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td style={{ fontWeight: 600 }}>{vehicle.vehicle_number}</td>
                      <td>{vehicle.vehicle_type}</td>
                      <td>{getDriverName(vehicle.driver_id)}</td>
                      <td>
                        <span className="badge badge--danger" style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <Wrench style={{ width: '12px', height: '12px' }} />
                          <span>{vehicle.status}</span>
                        </span>
                      </td>
                      <td>
                        <div className="datagrid-actions">
                          <button
                            className="btn btn--primary"
                            style={{ 
                              padding: '6px 12px', 
                              fontSize: '12px', 
                              backgroundColor: 'var(--success)', 
                              borderColor: 'transparent',
                              color: '#FFFFFF'
                            }}
                            disabled={submittingId === vehicle.id}
                            onClick={() => handleReleaseToService(vehicle)}
                          >
                            <Check style={{ width: '14px', height: '14px' }} />
                            <span>{submittingId === vehicle.id ? 'Releasing...' : 'Release to Service'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">
                      <div className="empty-state">
                        <CheckCircle2 className="empty-state__icon" style={{ color: 'var(--success)' }} />
                        <p className="empty-state__title">All vehicles are active</p>
                        <p className="empty-state__desc">No pending vehicle maintenance schedules or repairs.</p>
                      </div>
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