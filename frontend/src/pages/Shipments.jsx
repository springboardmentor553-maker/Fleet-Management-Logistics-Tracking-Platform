import { useEffect, useState } from 'react'
import { shipmentService, vehicleService, getApiErrorMessage } from '../services/api'
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
  Package,
  Send
} from 'lucide-react'

export default function Shipments() {
  const [shipments, setShipments] = useState([])
  const [vehicles, setVehicles] = useState([])
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
    shipment_name: '',
    source: '',
    destination: '',
    status: 'Created',
    vehicle_id: '',
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
      const [shipmentsRes, vehiclesRes] = await Promise.all([
        shipmentService.getAll(),
        vehicleService.getAll(),
      ])
      setShipments(shipmentsRes.data || [])
      setVehicles(vehiclesRes.data || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to fetch shipments or vehicle details from the server.'))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setEditingShipment(null)
    setFormData({
      shipment_name: '',
      source: '',
      destination: '',
      status: 'Created',
      vehicle_id: vehicles.length > 0 ? vehicles[0].id : '',
    })
    setSubmitError('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (shipment) => {
    setEditingShipment(shipment)
    setFormData({
      shipment_name: shipment.shipment_name || '',
      source: shipment.source || '',
      destination: shipment.destination || '',
      status: shipment.status || 'Created',
      vehicle_id: shipment.vehicle_id || '',
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
      !formData.shipment_name.trim() ||
      !formData.source.trim() ||
      !formData.destination.trim() ||
      !formData.vehicle_id
    ) {
      setSubmitError('All fields are required.')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    const payload = {
      ...formData,
      vehicle_id: parseInt(formData.vehicle_id, 10),
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
      setSubmitError(getApiErrorMessage(err, 'Failed to save shipment. Make sure vehicle ID is correct.'))
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

  // Filter
  const filteredShipments = shipments.filter((s) => {
    const plate = getVehicleNumber(s.vehicle_id)
    const plateStr = typeof plate === 'string' ? plate : ''
    return (
      s.shipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plateStr.toLowerCase().includes(searchTerm.toLowerCase())
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
                  <th>Shipment Name</th>
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
                      <td style={{ fontWeight: 600 }}>{shipment.shipment_name}</td>
                      <td>{shipment.source}</td>
                      <td>{shipment.destination}</td>
                      <td>{getVehicleNumber(shipment.vehicle_id)}</td>
                      <td>
                        <span className={`badge badge--${shipment.status?.toLowerCase().replace(' ', '') || 'created'}`}>
                          {shipment.status}
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
                <div className="form-group">
                  <label className="form-label" htmlFor="shipment_name">Shipment Description / Name</label>
                  <input
                    className="form-input"
                    type="text"
                    id="shipment_name"
                    name="shipment_name"
                    value={formData.shipment_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Industrial Electronics Consignment"
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="source">Source / Origin</label>
                    <input
                      className="form-input"
                      type="text"
                      id="source"
                      name="source"
                      value={formData.source}
                      onChange={handleInputChange}
                      placeholder="e.g. New York, NY"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="destination">Destination</label>
                    <input
                      className="form-input"
                      type="text"
                      id="destination"
                      name="destination"
                      value={formData.destination}
                      onChange={handleInputChange}
                      placeholder="e.g. Los Angeles, CA"
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="status">Delivery Status</label>
                    <select
                      className="form-select"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="Created">Created</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="vehicle_id">Assigned Vehicle</label>
                    <select
                      className="form-select"
                      id="vehicle_id"
                      name="vehicle_id"
                      value={formData.vehicle_id}
                      onChange={handleInputChange}
                      required
                    >
                      {vehicles.length > 0 ? (
                        vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.vehicle_number} ({v.vehicle_type})
                          </option>
                        ))
                      ) : (
                        <option value="">No vehicles available</option>
                      )}
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
