import { useEffect, useState } from 'react'
import { driverService, getApiErrorMessage } from '../services/api'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification Mount */}
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '6px' }}>Drivers Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Coordinate and manage active driver profiles and authorization credentials.</p>
        </div>
        <button className="btn btn--primary" onClick={handleOpenAddModal}>
          ➕ Add Driver
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
          {/* Filters Bar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: '#fafbfd' }}>
            <label className="navbar__search" style={{ maxWidth: '350px', margin: 0 }}>
              <span className="navbar__searchIcon">🔎</span>
              <input
                className="navbar__searchInput"
                type="search"
                placeholder="Search by name, license number, or phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </label>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Showing {filteredDrivers.length} {filteredDrivers.length === 1 ? 'driver' : 'drivers'}
            </span>
          </div>

          {/* DataTable */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafbfd' }}>
                  <th style={thStyle}>Driver Name</th>
                  <th style={thStyle}>License Number</th>
                  <th style={thStyle}>Phone Number</th>
                  <th style={thStyle}>Duty Status</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDrivers.length > 0 ? (
                  paginatedDrivers.map((driver) => (
                    <tr key={driver.id} style={trStyle}>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{driver.name}</td>
                      <td style={tdStyle}>{driver.license_number}</td>
                      <td style={tdStyle}>{driver.phone}</td>
                      <td style={tdStyle}>
                        <span className={`badge badge--${driver.status?.toLowerCase() || 'available'}`}>
                          {driver.status}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button className="btn btn--secondary" style={{ padding: '4px 8px', fontSize: '0.8rem', marginRight: '6px' }} onClick={() => handleOpenEditModal(driver)}>
                          ✏️ Edit
                        </button>
                        <button className="btn btn--secondary" style={{ padding: '4px 8px', fontSize: '0.8rem', color: 'var(--danger-color)', borderColor: '#fee2e2' }} onClick={() => handleDeleteTrigger(driver.id)}>
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      No drivers match your search parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
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

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '460px' }}>
            <div className="modal__header">
              <h3 className="modal__title">{editingDriver ? 'Modify Driver Record' : 'Register Driver'}</h3>
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
                  <label className="form-label" htmlFor="name">Full Name</label>
                  <input
                    className="form-input"
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter name"
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
              <h3 className="modal__title" style={{ color: 'var(--danger-color)' }}>Delete Confirmation</h3>
              <button className="modal__close" onClick={() => setDeleteConfirmId(null)}>×</button>
            </div>
            <div className="modal__body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
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
