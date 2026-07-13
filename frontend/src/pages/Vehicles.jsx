import { useEffect, useState } from 'react'
import { vehicleService, driverService, getApiErrorMessage } from '../services/api'
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
  Truck
} from 'lucide-react'

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
    if (!driverId) {
      return <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '13px' }}>Unassigned</span>
    }
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

      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Fleet Registry</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Track and manage your vehicles, transport capacity, and driver assignments.
          </p>
        </div>
        <button className="btn btn--primary" onClick={handleOpenAddModal}>
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>Register Vehicle</span>
        </button>
      </div>

      {error ? (
        <div className="error-card">
          <AlertCircle className="error-card__icon" />
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
        /* DataGrid Container */
        <div className="datagrid-container">
          {/* Search bar */}
          <div className="datagrid-header-bar">
            <label className="navbar__search" style={{ maxWidth: '360px', margin: 0 }} htmlFor="vehicle-search">
              <Search className="navbar__searchIcon" aria-hidden="true" />
              <input
                id="vehicle-search"
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
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Showing {filteredVehicles.length} {filteredVehicles.length === 1 ? 'vehicle' : 'vehicles'}
            </span>
          </div>

          {/* Table */}
          <div className="datagrid-wrapper">
            <table className="datagrid">
              <thead>
                <tr>
                  <th>Vehicle ID / Plate</th>
                  <th>Reg. Number</th>
                  <th>Type</th>
                  <th>Capacity (kg)</th>
                  <th>Fuel Type</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVehicles.length > 0 ? (
                  paginatedVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td style={{ fontWeight: 600 }}>{vehicle.vehicle_number}</td>
                      <td>{vehicle.registration_number}</td>
                      <td>{vehicle.vehicle_type}</td>
                      <td>{vehicle.capacity.toLocaleString()} kg</td>
                      <td>{vehicle.fuel_type}</td>
                      <td>{getDriverName(vehicle.driver_id)}</td>
                      <td>
                        <span className={`badge badge--${vehicle.status?.toLowerCase().replace(' ', '') || 'available'}`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td>
                        <div className="datagrid-actions">
                          <button 
                            className="btn btn--secondary" 
                            style={{ padding: '6px 10px', fontSize: '12px' }} 
                            onClick={() => handleOpenEditModal(vehicle)}
                          >
                            <Edit2 style={{ width: '13px', height: '13px' }} />
                            <span>Edit</span>
                          </button>
                          <button 
                            className="btn btn--outline-danger" 
                            style={{ padding: '6px 10px', fontSize: '12px' }} 
                            onClick={() => handleDeleteTrigger(vehicle.id)}
                          >
                            <Trash2 style={{ width: '13px', height: '13px' }} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state">
                        <Truck className="empty-state__icon" />
                        <p className="empty-state__title">No vehicles found</p>
                        <p className="empty-state__desc">Try checking spelling or register a new fleet vehicle.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <span className="pagination__info">
                Page {currentPage} of {totalPages}
              </span>
              <div className="pagination__buttons">
                <button
                  className="btn btn--secondary"
                  style={{ padding: '6px 12px' }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((c) => c - 1)}
                >
                  <ChevronLeft style={{ width: '16px', height: '16px' }} />
                  <span>Previous</span>
                </button>
                <button
                  className="btn btn--secondary"
                  style={{ padding: '6px 12px' }}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((c) => c + 1)}
                >
                  <span>Next</span>
                  <ChevronRight style={{ width: '16px', height: '16px' }} />
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
              <button className="modal__close" onClick={handleCloseModal} aria-label="Close modal">
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                {submitError && (
                  <div className="login-form__error" style={{ marginBottom: '16px' }}>
                    <AlertCircle className="toast-icon" />
                    <span>{submitError}</span>
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
              <h3 className="modal__title" style={{ color: 'var(--danger)' }}>Delete Confirmation</h3>
              <button className="modal__close" onClick={() => setDeleteConfirmId(null)} aria-label="Close delete modal">
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <div className="modal__body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: '1.5' }}>
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
