import { useEffect, useState } from 'react'
import { vehicleService, driverService, getApiErrorMessage } from '../services/api'

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [formData, setFormData] = useState({
    vehicle_number: '',
    registration_number: '',
    vehicle_type: '',
    capacity: '',
    fuel_type: 'Diesel',
    status: 'Available',
    driver_id: '',
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
      const [vehiclesRes, driversRes] = await Promise.all([
        vehicleService.getAll(),
        driverService.getAll(),
      ])
      setVehicles(vehiclesRes.data || [])
      setDrivers(driversRes.data || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to fetch vehicles or drivers directory.'))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setEditingVehicle(null)
    setFormData({
      vehicle_number: '',
      registration_number: '',
      vehicle_type: '',
      capacity: '',
      fuel_type: 'Diesel',
      status: 'Available',
      driver_id: '',
    })
    setSubmitError('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      vehicle_number: vehicle.vehicle_number || '',
      registration_number: vehicle.registration_number || '',
      vehicle_type: vehicle.vehicle_type || '',
      capacity: vehicle.capacity || '',
      fuel_type: vehicle.fuel_type || 'Diesel',
      status: vehicle.status || 'Available',
      driver_id: vehicle.driver_id || '',
    })
    setSubmitError('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingVehicle(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((curr) => ({ ...curr, [name]: value }))
    if (submitError) setSubmitError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (
      !formData.vehicle_number.trim() ||
      !formData.registration_number.trim() ||
      !formData.vehicle_type.trim() ||
      !formData.capacity
    ) {
      setSubmitError('All primary fields are required.')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    const payload = {
      ...formData,
      capacity: parseInt(formData.capacity, 10),
      driver_id: formData.driver_id ? parseInt(formData.driver_id, 10) : null,
    }

    try {
      if (editingVehicle) {
        const res = await vehicleService.update(editingVehicle.id, payload)
        setVehicles((curr) => curr.map((v) => (v.id === editingVehicle.id ? res.data : v)))
        addToast('Vehicle parameters updated successfully.')
      } else {
        const res = await vehicleService.create(payload)
        setVehicles((curr) => [...curr, res.data])
        addToast('Vehicle registered successfully in the fleet.')
      }
      handleCloseModal()
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Failed to save vehicle details.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTrigger = (id) => {
    setDeleteConfirmId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return
    setDeleting(true)
    try {
      await vehicleService.remove(deleteConfirmId)
      setVehicles((curr) => curr.filter((v) => v.id !== deleteConfirmId))
      addToast('Vehicle removed from directory.')
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Failed to remove vehicle.'), 'error')
    } finally {
      setDeleting(false)
      setDeleteConfirmId(null)
    }
  }

  // Get driver name by ID
  const getDriverName = (driverId) => {
    if (!driverId) return <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Unassigned</span>
    const driverObj = drivers.find((d) => d.id === driverId)
    return driverObj ? driverObj.name : `ID: ${driverId}`
  }

  // Filter
  const filteredVehicles = vehicles.filter((v) => {
    const driverName = v.driver_id ? (drivers.find((d) => d.id === v.driver_id)?.name || '') : ''
    return (
      v.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicle_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driverName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedVehicles = filteredVehicles.slice(startIndex, startIndex + itemsPerPage)

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '6px' }}>Fleet Registry</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Track and manage your vehicles, transport capacity, and driver assignments.</p>
        </div>
        <button className="btn btn--primary" onClick={handleOpenAddModal}>
          ➕ Register Vehicle
        </button>
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
          {/* Search bar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: '#fafbfd' }}>
            <label className="navbar__search" style={{ maxWidth: '350px', margin: 0 }}>
              <span className="navbar__searchIcon">🔎</span>
              <input
                className="navbar__searchInput"
                type="search"
                placeholder="Search by plate, type, driver..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </label>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Showing {filteredVehicles.length} {filteredVehicles.length === 1 ? 'vehicle' : 'vehicles'}
            </span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafbfd' }}>
                  <th style={thStyle}>Vehicle ID / Plate</th>
                  <th style={thStyle}>Reg. Number</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Capacity (kg)</th>
                  <th style={thStyle}>Fuel Type</th>
                  <th style={thStyle}>Driver</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVehicles.length > 0 ? (
                  paginatedVehicles.map((vehicle) => (
                    <tr key={vehicle.id} style={trStyle}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{vehicle.vehicle_number}</td>
                      <td style={tdStyle}>{vehicle.registration_number}</td>
                      <td style={tdStyle}>{vehicle.vehicle_type}</td>
                      <td style={tdStyle}>{vehicle.capacity.toLocaleString()} kg</td>
                      <td style={tdStyle}>{vehicle.fuel_type}</td>
                      <td style={tdStyle}>{getDriverName(vehicle.driver_id)}</td>
                      <td style={tdStyle}>
                        <span className={`badge badge--${vehicle.status?.toLowerCase() || 'available'}`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button className="btn btn--secondary" style={{ padding: '4px 8px', fontSize: '0.8rem', marginRight: '6px' }} onClick={() => handleOpenEditModal(vehicle)}>
                          ✏️ Edit
                        </button>
                        <button className="btn btn--secondary" style={{ padding: '4px 8px', fontSize: '0.8rem', color: 'var(--danger-color)', borderColor: '#fee2e2' }} onClick={() => handleDeleteTrigger(vehicle.id)}>
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      No vehicles found matching search parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination" style={{ padding: '16px 20px', backgroundColor: '#fafbfd' }}>
              <span className="pagination__info">
                Page {currentPage} of {totalPages}
              </span>
              <div className="pagination__buttons">
                <button
                  className="btn btn--secondary"
                  style={{ padding: '4px 12px' }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((c) => c - 1)}
                >
                  Previous
                </button>
                <button
                  className="btn btn--secondary"
                  style={{ padding: '4px 12px' }}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((c) => c + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '480px' }}>
            <div className="modal__header">
              <h3 className="modal__title">{editingVehicle ? 'Modify Vehicle Specs' : 'Register Vehicle'}</h3>
              <button className="modal__close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                {submitError && (
                  <div className="login-form__error" style={{ marginBottom: '16px' }}>
                    {submitError}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="vehicle_number">Vehicle Plate Number</label>
                  <input
                    className="form-input"
                    type="text"
                    id="vehicle_number"
                    name="vehicle_number"
                    value={formData.vehicle_number}
                    onChange={handleInputChange}
                    placeholder="e.g. TX-9876-C"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="registration_number">Registration Number</label>
                  <input
                    className="form-input"
                    type="text"
                    id="registration_number"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleInputChange}
                    placeholder="e.g. REG-019283-X"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="vehicle_type">Vehicle Type / Model</label>
                  <input
                    className="form-input"
                    type="text"
                    id="vehicle_type"
                    name="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={handleInputChange}
                    placeholder="e.g. Heavy Duty Semi-Trailer"
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="capacity">Capacity (kg)</label>
                    <input
                      className="form-input"
                      type="number"
                      id="capacity"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      placeholder="12000"
                      min="1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="fuel_type">Fuel Type</label>
                    <select
                      className="form-select"
                      id="fuel_type"
                      name="fuel_type"
                      value={formData.fuel_type}
                      onChange={handleInputChange}
                    >
                      <option value="Diesel">Diesel</option>
                      <option value="Petrol">Petrol</option>
                      <option value="Electric">Electric</option>
                      <option value="CNG">CNG</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="status">Fleet Status</label>
                    <select
                      className="form-select"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="Available">Available</option>
                      <option value="In Use">In Use</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="driver_id">Assigned Driver</label>
                    <select
                      className="form-select"
                      id="driver_id"
                      name="driver_id"
                      value={formData.driver_id}
                      onChange={handleInputChange}
                    >
                      <option value="">None (Unassigned)</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={handleCloseModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? 'Saving changes...' : editingVehicle ? 'Update Vehicle' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal__header">
              <h3 className="modal__title" style={{ color: 'var(--danger-color)' }}>Delete Confirmation</h3>
              <button className="modal__close" onClick={() => setDeleteConfirmId(null)}>×</button>
            </div>
            <div className="modal__body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Are you sure you want to remove this vehicle? This will unassign the vehicle from any active shipment records in the database.
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setDeleteConfirmId(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn--danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? 'Removing vehicle...' : 'Confirm Removal'}
              </button>
            </div>
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
