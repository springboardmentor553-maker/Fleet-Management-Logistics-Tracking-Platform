import { useEffect, useState } from 'react'
import { shipmentService, vehicleService, driverService, getApiErrorMessage } from '../services/api'
import { 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Package,
  Send
} from 'lucide-react'

export default function Shipments() {
  const [shipments, setShipments] = useState([])
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
  const [editingShipment, setEditingShipment] = useState(null)
  const [formData, setFormData] = useState({
    sender_name: '',
    receiver_name: '',
    pickup_location: '',
    delivery_location: '',
    weight: '',
    assigned_driver_id: '',
    assigned_vehicle_id: '',
    current_status: 'Created',
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
      const [shipmentsRes, vehiclesRes, driversRes] = await Promise.all([
        shipmentService.getAll(),
        vehicleService.getAll(),
        driverService.getAll(),
      ])
      setShipments(shipmentsRes.data || [])
      setVehicles(vehiclesRes.data || [])
      setDrivers(driversRes.data || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to fetch shipments, vehicles, or driver details.'))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setEditingShipment(null)
    setFormData({
      sender_name: '',
      receiver_name: '',
      pickup_location: '',
      delivery_location: '',
      weight: '',
      assigned_driver_id: drivers.length > 0 ? drivers[0].id.toString() : '',
      assigned_vehicle_id: vehicles.length > 0 ? vehicles[0].id.toString() : '',
      current_status: 'Created',
    })
    setSubmitError('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (shipment) => {
    setEditingShipment(shipment)
    setFormData({
      sender_name: shipment.sender_name || '',
      receiver_name: shipment.receiver_name || '',
      pickup_location: shipment.pickup_location || '',
      delivery_location: shipment.delivery_location || '',
      weight: shipment.weight !== null && shipment.weight !== undefined ? shipment.weight.toString() : '',
      assigned_driver_id: shipment.assigned_driver_id ? shipment.assigned_driver_id.toString() : '',
      assigned_vehicle_id: shipment.assigned_vehicle_id ? shipment.assigned_vehicle_id.toString() : '',
      current_status: shipment.current_status || 'Created',
    })
    setSubmitError('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingShipment(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((curr) => ({ ...curr, [name]: value }))
    if (submitError) setSubmitError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (
      !formData.sender_name.trim() ||
      !formData.receiver_name.trim() ||
      !formData.pickup_location.trim() ||
      !formData.delivery_location.trim()
    ) {
      setSubmitError('Sender, Receiver, Pickup, and Delivery locations are required.')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    const payload = {
      sender_name: formData.sender_name.trim(),
      receiver_name: formData.receiver_name.trim(),
      pickup_location: formData.pickup_location.trim(),
      delivery_location: formData.delivery_location.trim(),
      weight: formData.weight ? parseFloat(formData.weight) : null,
      assigned_driver_id: formData.assigned_driver_id ? parseInt(formData.assigned_driver_id, 10) : null,
      assigned_vehicle_id: formData.assigned_vehicle_id ? parseInt(formData.assigned_vehicle_id, 10) : null,
      current_status: formData.current_status,
    }

    try {
      if (editingShipment) {
        const res = await shipmentService.update(editingShipment.id, payload)
        setShipments((curr) => curr.map((s) => (s.id === editingShipment.id ? res.data : s)))
        addToast('Shipment status updated successfully.')
      } else {
        const res = await shipmentService.create(payload)
        setShipments((curr) => [...curr, res.data])
        addToast('Shipment successfully created and assigned.')
      }
      handleCloseModal()
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Failed to save shipment. Make sure all ID fields are valid.'))
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
      await shipmentService.remove(deleteConfirmId)
      setShipments((curr) => curr.filter((s) => s.id !== deleteConfirmId))
      addToast('Shipment record deleted successfully.')
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Failed to delete shipment.'), 'error')
    } finally {
      setDeleting(false)
      setDeleteConfirmId(null)
    }
  }

  // Get vehicle number by ID
  const getVehicleNumber = (vehicleId) => {
    if (!vehicleId) {
      return <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '13px' }}>Unassigned</span>
    }
    const vehicleObj = vehicles.find((v) => v.id === vehicleId)
    return vehicleObj ? vehicleObj.vehicle_number : `ID: ${vehicleId}`
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
  const filteredShipments = shipments.filter((s) => {
    const plate = getVehicleNumber(s.assigned_vehicle_id)
    const plateStr = typeof plate === 'string' ? plate : ''
    const driverName = getDriverName(s.assigned_driver_id)
    const driverNameStr = typeof driverName === 'string' ? driverName : ''
    return (
      s.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.receiver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.delivery_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.current_status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plateStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driverNameStr.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedShipments = filteredShipments.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Toast Alert Overlay */}
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
          <h1 className="page-title">Shipments Dispatcher</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Monitor shipment statuses, routes, origins, and transport vehicles.
          </p>
        </div>
        <button 
          className="btn btn--primary" 
          onClick={handleOpenAddModal} 
          disabled={vehicles.length === 0}
        >
          <Send style={{ width: '16px', height: '16px' }} />
          <span>{vehicles.length === 0 ? 'No Vehicles Registered' : 'Dispatch Shipment'}</span>
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
            <label className="navbar__search" style={{ maxWidth: '360px', margin: 0 }} htmlFor="shipment-search">
              <Search className="navbar__searchIcon" aria-hidden="true" />
              <input
                id="shipment-search"
                className="navbar__searchInput"
                type="search"
                placeholder="Search shipments, cities, status..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </label>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Showing {filteredShipments.length} {filteredShipments.length === 1 ? 'shipment' : 'shipments'}
            </span>
          </div>

          {/* Table */}
          <div className="datagrid-wrapper">
            <table className="datagrid">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tracking Number</th>
                  <th>Source / Origin</th>
                  <th>Destination</th>
                  <th>Assigned Vehicle</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedShipments.length > 0 ? (
                  paginatedShipments.map((shipment) => (
                    <tr key={shipment.id}>
                      <td>#{shipment.id}</td>
                      <td style={{ fontWeight: 600 }}>
                        <div>{shipment.tracking_number}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400 }}>
                          {shipment.sender_name} &rarr; {shipment.receiver_name}
                        </div>
                      </td>
                      <td>{shipment.pickup_location}</td>
                      <td>{shipment.delivery_location}</td>
                      <td>
                        <div>{getVehicleNumber(shipment.assigned_vehicle_id)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Driver: {getDriverName(shipment.assigned_driver_id)}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge--${(shipment.current_status || 'created').toLowerCase().replace(/\s+/g, '')}`}>
                          {shipment.current_status}
                        </span>
                      </td>
                      <td>
                        <div className="datagrid-actions">
                          <button 
                            className="btn btn--secondary" 
                            style={{ padding: '6px 10px', fontSize: '12px' }} 
                            onClick={() => handleOpenEditModal(shipment)}
                          >
                            <Edit2 style={{ width: '13px', height: '13px' }} />
                            <span>Edit</span>
                          </button>
                          <button 
                            className="btn btn--outline-danger" 
                            style={{ padding: '6px 10px', fontSize: '12px' }} 
                            onClick={() => handleDeleteTrigger(shipment.id)}
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
                    <td colSpan="7">
                      <div className="empty-state">
                        <Package className="empty-state__icon" />
                        <p className="empty-state__title">No shipments found</p>
                        <p className="empty-state__desc">Try checking spelling or create a new dispatch log.</p>
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
              <h3 className="modal__title">{editingShipment ? 'Edit Shipment Info' : 'Create New Shipment'}</h3>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="sender_name">Sender Name</label>
                    <input
                      className="form-input"
                      type="text"
                      id="sender_name"
                      name="sender_name"
                      value={formData.sender_name}
                      onChange={handleInputChange}
                      placeholder="e.g. Acme Corp"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="receiver_name">Receiver Name</label>
                    <input
                      className="form-input"
                      type="text"
                      id="receiver_name"
                      name="receiver_name"
                      value={formData.receiver_name}
                      onChange={handleInputChange}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="pickup_location">Source / Origin</label>
                    <input
                      className="form-input"
                      type="text"
                      id="pickup_location"
                      name="pickup_location"
                      value={formData.pickup_location}
                      onChange={handleInputChange}
                      placeholder="e.g. New York, NY"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="delivery_location">Destination</label>
                    <input
                      className="form-input"
                      type="text"
                      id="delivery_location"
                      name="delivery_location"
                      value={formData.delivery_location}
                      onChange={handleInputChange}
                      placeholder="e.g. Los Angeles, CA"
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="weight">Weight (kg)</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.01"
                      id="weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="e.g. 150.5"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="current_status">Delivery Status</label>
                    <select
                      className="form-select"
                      id="current_status"
                      name="current_status"
                      value={formData.current_status}
                      onChange={handleInputChange}
                    >
                      <option value="Created">Created</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Picked Up">Picked Up</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="assigned_vehicle_id">Assigned Vehicle</label>
                    <select
                      className="form-select"
                      id="assigned_vehicle_id"
                      name="assigned_vehicle_id"
                      value={formData.assigned_vehicle_id}
                      onChange={handleInputChange}
                    >
                      <option value="">Unassigned</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.vehicle_number} ({v.vehicle_type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="assigned_driver_id">Assigned Driver</label>
                    <select
                      className="form-select"
                      id="assigned_driver_id"
                      name="assigned_driver_id"
                      value={formData.assigned_driver_id}
                      onChange={handleInputChange}
                    >
                      <option value="">Unassigned</option>
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
                  {submitting ? 'Saving shipment...' : editingShipment ? 'Update Status' : 'Dispatch Shipment'}
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
                Are you sure you want to delete this shipment? This will permanently erase the log and release the assigned vehicle.
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setDeleteConfirmId(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn--danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? 'Deleting record...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
