import { useEffect, useState } from 'react'
import { driverService, getApiErrorMessage } from '../services/api'
import { 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Users
} from 'lucide-react'

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    phone: '',
    status: 'Available',
  })
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Confirm Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Toast State
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    loadDrivers()
  }, [])

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts((current) => [...current, { id, message, type }])
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id))
    }, 4000)
  }

  const loadDrivers = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await driverService.getAll()
      setDrivers(response.data || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to fetch drivers. Please check if the server is running.'))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setEditingDriver(null)
    setFormData({
      name: '',
      license_number: '',
      phone: '',
      status: 'Available',
    })
    setSubmitError('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (driver) => {
    setEditingDriver(driver)
    setFormData({
      name: driver.name || '',
      license_number: driver.license_number || '',
      phone: driver.phone || '',
      status: driver.status || 'Available',
    })
    setSubmitError('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingDriver(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((curr) => ({ ...curr, [name]: value }))
    if (submitError) setSubmitError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.license_number.trim() || !formData.phone.trim()) {
      setSubmitError('All fields are required.')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      if (editingDriver) {
        // Edit Operation
        const res = await driverService.update(editingDriver.id, formData)
        setDrivers((curr) =>
          curr.map((d) => (d.id === editingDriver.id ? res.data : d))
        )
        addToast('Driver credentials updated successfully.')
      } else {
        // Create Operation
        const res = await driverService.create(formData)
        setDrivers((curr) => [...curr, res.data])
        addToast('New driver registered successfully.')
      }
      handleCloseModal()
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Failed to save driver. Check data formats.'))
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
      await driverService.remove(deleteConfirmId)
      setDrivers((curr) => curr.filter((d) => d.id !== deleteConfirmId))
      addToast('Driver profile deleted successfully.')
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Failed to delete driver.'), 'error')
    } finally {
      setDeleting(false)
      setDeleteConfirmId(null)
    }
  }

  // Filter and search
  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.license_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone?.includes(searchTerm)
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDrivers = filteredDrivers.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Toast Notification Mount */}
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
          <h1 className="page-title">Drivers Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Coordinate and manage active driver profiles and authorization credentials.
          </p>
        </div>
        <button className="btn btn--primary" onClick={handleOpenAddModal}>
          <UserPlus style={{ width: '16px', height: '16px' }} />
          <span>Add Driver</span>
        </button>
      </div>

      {error ? (
        <div className="error-card">
          <AlertCircle className="error-card__icon" />
          <h2 className="error-card__title">Retrieve Failed</h2>
          <p className="error-card__desc">{error}</p>
          <button className="btn btn--primary" onClick={loadDrivers}>
            Retry Load
          </button>
        </div>
      ) : loading ? (
        <div className="loading-container" style={{ minHeight: '40vh' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        /* DataGrid Component Container */
        <div className="datagrid-container">
          {/* Filters Bar */}
          <div className="datagrid-header-bar">
            <label className="navbar__search" style={{ maxWidth: '360px', margin: 0 }} htmlFor="driver-search">
              <Search className="navbar__searchIcon" aria-hidden="true" />
              <input
                id="driver-search"
                className="navbar__searchInput"
                type="search"
                placeholder="Search by name, license, or phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </label>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Showing {filteredDrivers.length} {filteredDrivers.length === 1 ? 'driver' : 'drivers'}
            </span>
          </div>

          {/* DataTable */}
          <div className="datagrid-wrapper">
            <table className="datagrid">
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>License Number</th>
                  <th>Phone Number</th>
                  <th>Duty Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDrivers.length > 0 ? (
                  paginatedDrivers.map((driver) => (
                    <tr key={driver.id}>
                      <td style={{ fontWeight: 600 }}>{driver.name}</td>
                      <td>{driver.license_number}</td>
                      <td>{driver.phone}</td>
                      <td>
                        <span className={`badge badge--${driver.status?.toLowerCase().replace(' ', '') || 'available'}`}>
                          {driver.status}
                        </span>
                      </td>
                      <td>
                        <div className="datagrid-actions">
                          <button 
                            className="btn btn--secondary" 
                            style={{ padding: '6px 10px', fontSize: '12px' }} 
                            onClick={() => handleOpenEditModal(driver)}
                          >
                            <Edit2 style={{ width: '13px', height: '13px' }} />
                            <span>Edit</span>
                          </button>
                          <button 
                            className="btn btn--outline-danger" 
                            style={{ padding: '6px 10px', fontSize: '12px' }} 
                            onClick={() => handleDeleteTrigger(driver.id)}
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
                    <td colSpan="5">
                      <div className="empty-state">
                        <Users className="empty-state__icon" />
                        <p className="empty-state__title">No drivers match search query</p>
                        <p className="empty-state__desc">Try checking spelling or create a new driver profile.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
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

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '460px' }}>
            <div className="modal__header">
              <h3 className="modal__title">{editingDriver ? 'Modify Driver Record' : 'Register Driver'}</h3>
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
                  <label className="form-label" htmlFor="name">Full Name</label>
                  <input
                    className="form-input"
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="license_number">License ID</label>
                  <input
                    className="form-input"
                    type="text"
                    id="license_number"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    placeholder="DL-XXXXXXXXXX"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number</label>
                  <input
                    className="form-input"
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 019-2834"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="status">Duty Status</label>
                  <select
                    className="form-select"
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={handleCloseModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? 'Saving changes...' : editingDriver ? 'Update Profile' : 'Register Profile'}
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
                Are you sure you want to delete this driver? This action cannot be undone and will unassign the driver from all active operations.
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setDeleteConfirmId(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn--danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? 'Deleting profile...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
