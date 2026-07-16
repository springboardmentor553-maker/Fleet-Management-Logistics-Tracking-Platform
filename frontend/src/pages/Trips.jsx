import { useEffect, useState } from 'react'
import { tripService, shipmentService, driverService, vehicleService, getApiErrorMessage, getStoredUser } from '../services/api'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Compass
} from 'lucide-react'

export default function Trips() {
  const [trips, setTrips] = useState([])
  const [shipments, setShipments] = useState([])
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // User status
  const user = getStoredUser()
  const role = user?.role || 'Guest'
  const isDriver = role === 'Driver'
  const canModify = role === 'Admin' || role === 'Dispatcher'

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState(null)
  const [formData, setFormData] = useState({
    shipment_id: '',
    driver_id: '',
    vehicle_id: '',
    pickup_location: '',
    destination: '',
    scheduled_start_time: '',
    scheduled_end_time: '',
    trip_status: 'Created',
  })
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Confirm Delete
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Toasts
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
      
      // Load trips
      const tripsRes = await tripService.getAll()
      setTrips(tripsRes.data || [])

      // Load selections if the user can manage trips
      if (canModify) {
        const [shipmentsRes, driversRes, vehiclesRes] = await Promise.all([
          shipmentService.getAll(),
          driverService.getAll(),
          vehicleService.getAll(),
        ])
        setShipments(shipmentsRes.data || [])
        setDrivers(driversRes.data || [])
        setVehicles(vehiclesRes.data || [])
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to fetch trips or related resources.'))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setEditingTrip(null)
    setFormData({
      shipment_id: shipments.length > 0 ? shipments[0].id.toString() : '',
      driver_id: drivers.length > 0 ? drivers[0].id.toString() : '',
      vehicle_id: vehicles.length > 0 ? vehicles[0].id.toString() : '',
      pickup_location: '',
      destination: '',
      scheduled_start_time: '',
      scheduled_end_time: '',
      trip_status: 'Created',
    })
    setSubmitError('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (trip) => {
    setEditingTrip(trip)
    
    // Format dates to YYYY-MM-DDThh:mm for datetime-local input field
    const formatDate = (isoString) => {
      if (!isoString) return ''
      const date = new Date(isoString)
      const pad = (num) => num.toString().padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
    }

    setFormData({
      shipment_id: trip.shipment_id.toString(),
      driver_id: trip.driver_id.toString(),
      vehicle_id: trip.vehicle_id.toString(),
      pickup_location: trip.pickup_location,
      destination: trip.destination,
      scheduled_start_time: formatDate(trip.scheduled_start_time),
      scheduled_end_time: formatDate(trip.scheduled_end_time),
      trip_status: trip.trip_status,
    })
    setSubmitError('')
    setIsModalOpen(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((curr) => ({ ...curr, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)

    try {
      const payload = {
        shipment_id: parseInt(formData.shipment_id),
        driver_id: parseInt(formData.driver_id),
        vehicle_id: parseInt(formData.vehicle_id),
        pickup_location: formData.pickup_location,
        destination: formData.destination,
        scheduled_start_time: new Date(formData.scheduled_start_time).toISOString(),
        scheduled_end_time: new Date(formData.scheduled_end_time).toISOString(),
        trip_status: formData.trip_status,
      }

      if (editingTrip) {
        await tripService.update(editingTrip.id, payload)
        addToast('Trip assignment updated successfully!')
      } else {
        await tripService.create(payload)
        addToast('Trip created and assigned successfully!')
      }
      setIsModalOpen(false)
      loadData()
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Failed to save trip.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleting(true)
    try {
      await tripService.remove(id)
      addToast('Trip deleted successfully!')
      setDeleteConfirmId(null)
      loadData()
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Failed to delete trip.'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  // Filtered trips for list display
  const filteredTrips = trips.filter((t) => {
    const search = searchTerm.toLowerCase()
    return (
      t.pickup_location.toLowerCase().includes(search) ||
      t.destination.toLowerCase().includes(search) ||
      t.trip_status.toLowerCase().includes(search)
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage) || 1
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredTrips.slice(indexOfFirstItem, indexOfLastItem)

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading trips and schedules...</p>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast Notification Container */}
      <div className="toast-container" style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`} role="alert" style={{ display: 'flex', alignItems: 'center', gap: '10px', animation: 'slideIn 0.2s ease-out' }}>
            {t.type === 'success' ? <CheckCircle2 style={{ width: '18px', height: '18px' }} /> : <AlertCircle style={{ width: '18px', height: '18px' }} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Trips & Assignments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {isDriver ? 'Your assigned delivery trips and status.' : 'Schedule, assign, and manage fleet dispatch trips.'}
          </p>
        </div>
        {canModify && (
          <button className="btn btn--primary" onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>Schedule Trip</span>
          </button>
        )}
      </header>

      {error && (
        <div className="login-form__error" style={{ marginBottom: '24px' }}>
          <AlertCircle className="toast-icon" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Datagrid */}
      <section className="datagrid-container">
        <div className="datagrid-header-bar">
          <div style={{ position: 'relative', maxWidth: '320px', width: '100%' }}>
            <Search style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94A3B8' }} />
            <input
              type="search"
              className="navbar__searchInput"
              style={{ width: '100%', paddingLeft: '36px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
              placeholder="Search location or status..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
        </div>

        <div className="datagrid-wrapper">
          <table className="datagrid">
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Shipment ID</th>
                <th>Pickup Location</th>
                <th>Destination</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Status</th>
                {canModify && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((trip) => (
                  <tr key={trip.id}>
                    <td style={{ fontWeight: 600 }}>#TRP{trip.id}</td>
                    <td>#SHP{trip.shipment_id}</td>
                    <td>{trip.pickup_location}</td>
                    <td>{trip.destination}</td>
                    <td style={{ fontSize: '13px' }}>{new Date(trip.scheduled_start_time).toLocaleString()}</td>
                    <td style={{ fontSize: '13px' }}>{new Date(trip.scheduled_end_time).toLocaleString()}</td>
                    <td>
                      <span className={`badge badge--${trip.trip_status?.toLowerCase().replace(' ', '') || 'created'}`}>
                        {trip.trip_status}
                      </span>
                    </td>
                    {canModify && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn--secondary"
                            style={{ padding: '6px' }}
                            onClick={() => handleOpenEditModal(trip)}
                          >
                            <Edit2 style={{ width: '14px', height: '14px', color: 'var(--primary)' }} />
                          </button>
                          <button
                            type="button"
                            className="btn btn--secondary"
                            style={{ padding: '6px' }}
                            onClick={() => setDeleteConfirmId(trip.id)}
                          >
                            <Trash2 style={{ width: '14px', height: '14px', color: 'var(--danger)' }} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canModify ? 8 : 7}>
                    <div className="empty-state">
                      <Compass className="empty-state__icon" style={{ width: '48px', height: '48px', color: 'var(--text-secondary)' }} />
                      <p className="empty-state__title">No trips found</p>
                      <p className="empty-state__desc">Scheduled fleet trips will show up here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="datagrid-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn--secondary" style={{ padding: '6px 12px' }} disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
                <ChevronLeft style={{ width: '16px', height: '16px' }} />
                <span>Prev</span>
              </button>
              <button className="btn btn--secondary" style={{ padding: '6px 12px' }} disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                <span>Next</span>
                <ChevronRight style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
          <div className="modal__backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setDeleteConfirmId(null)}></div>
          <div className="modal__container" style={{ position: 'relative', width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xl)', animation: 'scaleUp 0.15s ease-out' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Trash2 style={{ width: '24px', height: '24px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>Confirm Trip Deletion</h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '6px' }}>Are you sure you want to cancel and delete this trip schedule?</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button className="btn btn--secondary" style={{ flex: 1 }} disabled={deleting} onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                <button className="btn btn--danger" style={{ flex: 1 }} disabled={deleting} onClick={() => handleDelete(deleteConfirmId)}>{deleting ? 'Deleting...' : 'Delete'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
          <div className="modal__backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setIsModalOpen(false)}></div>
          <div className="modal__container" style={{ position: 'relative', width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', animation: 'scaleUp 0.15s ease-out' }}>
            <header className="modal__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="modal__title" style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>{editingTrip ? 'Edit Trip Assignment' : 'Schedule New Dispatch Trip'}</h3>
              <button className="modal__close" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }} onClick={() => setIsModalOpen(false)}>
                <X style={{ width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="modal__body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
                {submitError && (
                  <div className="login-form__error" style={{ margin: 0 }}>
                    <AlertCircle className="toast-icon" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Select Cargo Shipment</label>
                  <select name="shipment_id" className="form-select" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)' }} value={formData.shipment_id} onChange={handleInputChange} required>
                    <option value="" disabled>-- Select Shipment --</option>
                    {shipments.map((s) => (
                      <option key={s.id} value={s.id}>#SHP{s.id} ({s.sender_name} to {s.receiver_name})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Assigned Driver</label>
                  <select name="driver_id" className="form-select" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)' }} value={formData.driver_id} onChange={handleInputChange} required>
                    <option value="" disabled>-- Select Driver --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Assigned Telemetry Vehicle</label>
                  <select name="vehicle_id" className="form-select" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)' }} value={formData.vehicle_id} onChange={handleInputChange} required>
                    <option value="" disabled>-- Select Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.vehicle_number} - {v.vehicle_type} ({v.status})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Pickup Origin</label>
                    <input type="text" name="pickup_location" className="form-input" style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)' }} placeholder="E.g. Port Terminal A" value={formData.pickup_location} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Destination Hub</label>
                    <input type="text" name="destination" className="form-input" style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)' }} placeholder="E.g. Logistics Warehousing" value={formData.destination} onChange={handleInputChange} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Scheduled Start</label>
                    <input type="datetime-local" name="scheduled_start_time" className="form-input" style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)' }} value={formData.scheduled_start_time} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Scheduled Arrival</label>
                    <input type="datetime-local" name="scheduled_end_time" className="form-input" style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)' }} value={formData.scheduled_end_time} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Current Status</label>
                  <select name="trip_status" className="form-select" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)' }} value={formData.trip_status} onChange={handleInputChange}>
                    <option value="Created">Created</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <footer className="modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                <button type="button" className="btn btn--secondary" disabled={submitting} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>{submitting ? 'Saving changes...' : 'Save Schedule'}</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
