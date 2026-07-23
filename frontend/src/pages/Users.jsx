import { useEffect, useState } from 'react'
import { userService, getApiErrorMessage, getStoredUser } from '../services/api'
import { 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Shield
} from 'lucide-react'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const currentUser = getStoredUser()

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Admin',
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
      const res = await userService.getAll()
      setUsers(res.data || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to fetch user directory logs.'))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEditModal = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
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
      await userService.update(editingUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      })
      addToast('User role updated successfully!')
      setIsModalOpen(false)
      loadData()
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Failed to update user authorization role.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleting(true)
    try {
      await userService.remove(id)
      addToast('User account removed successfully!')
      setDeleteConfirmId(null)
      loadData()
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Failed to delete user.'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const search = searchTerm.toLowerCase()
    return (
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      u.role.toLowerCase().includes(search)
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem)

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading user directories...</p>
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

      <header style={{ marginBottom: '24px' }}>
        <h1 className="page-title">User Accounts</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Monitor system users, update access clearance roles, and manage permissions.
        </p>
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
              placeholder="Search user name or email..."
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
                <th>User ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>System Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>#USR{u.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600 }}>{u.name}</span>
                        {currentUser?.email === u.email && (
                          <span className="badge badge--success" style={{ fontSize: '10px', padding: '1px 6px' }}>You</span>
                        )}
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge badge--${(u.role || '').toLowerCase() === 'admin' ? 'success' : (u.role || '').toLowerCase() === 'driver' ? 'danger' : 'secondary'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn--secondary"
                          style={{ padding: '6px' }}
                          onClick={() => handleOpenEditModal(u)}
                        >
                          <Edit2 style={{ width: '14px', height: '14px', color: 'var(--primary)' }} />
                        </button>
                        <button
                          type="button"
                          className="btn btn--secondary"
                          style={{ padding: '6px' }}
                          disabled={currentUser?.email === u.email}
                          onClick={() => setDeleteConfirmId(u.id)}
                        >
                          <Trash2 style={{ width: '14px', height: '14px', color: currentUser?.email === u.email ? 'var(--text-secondary)' : 'var(--danger)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <Shield className="empty-state__icon" style={{ width: '48px', height: '48px', color: 'var(--text-secondary)' }} />
                      <p className="empty-state__title">No users found</p>
                      <p className="empty-state__desc">Operational account entries will show up here.</p>
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
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>Confirm Account Deletion</h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '6px' }}>Are you sure you want to remove this user account? The user will lose access immediately.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button className="btn btn--secondary" style={{ flex: 1 }} disabled={deleting} onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                <button className="btn btn--danger" style={{ flex: 1 }} disabled={deleting} onClick={() => handleDelete(deleteConfirmId)}>{deleting ? 'Deleting...' : 'Delete'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {isModalOpen && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
          <div className="modal__backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setIsModalOpen(false)}></div>
          <div className="modal__container" style={{ position: 'relative', width: '100%', maxWidth: '440px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', animation: 'scaleUp 0.15s ease-out' }}>
            <header className="modal__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="modal__title" style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Edit User Authorization</h3>
              <button className="modal__close" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }} onClick={() => setIsModalOpen(false)}>
                <X style={{ width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="modal__body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {submitError && (
                  <div className="login-form__error" style={{ margin: 0 }}>
                    <AlertCircle className="toast-icon" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Full Name</label>
                  <input type="text" name="name" className="form-input" style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)' }} value={formData.name} onChange={handleInputChange} required />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Email Address</label>
                  <input type="email" name="email" className="form-input" style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)' }} value={formData.email} onChange={handleInputChange} required />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>System Role</label>
                  <select name="role" className="form-select" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-main)' }} value={formData.role} onChange={handleInputChange}>
                    <option value="Admin">Admin</option>
                    <option value="Fleet Manager">Fleet Manager</option>
                    <option value="Dispatcher">Dispatcher</option>
                    <option value="Driver">Driver</option>
                  </select>
                </div>
              </div>

              <footer className="modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                <button type="button" className="btn btn--secondary" disabled={submitting} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>{submitting ? 'Updating...' : 'Save Role'}</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
