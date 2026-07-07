import { useState, useEffect } from 'react'
import { driverApi } from '../api/client'

export default function DriverModal({ driver, onClose, onSaved }) {
  const editing = !!driver
  const [form, setForm] = useState(
    editing ? { license_details: driver.license_details } : { user_id: '', license_details: '' }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (editing) {
        await driverApi.update(driver.id, { license_details: form.license_details })
      } else {
        await driverApi.create({ user_id: parseInt(form.user_id), license_details: form.license_details })
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{editing ? 'Edit Driver Profile' : 'Add Driver Profile'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            {!editing && (
              <div className="form-group">
                <label className="form-label">User ID</label>
                <input className="form-input" type="number" min="1"
                  value={form.user_id} onChange={set('user_id')} required
                  placeholder="Enter the registered user's ID" />
                <span className="form-error" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  The user must already be registered in the system.
                </span>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">License Details</label>
              <input className="form-input" value={form.license_details}
                onChange={set('license_details')} required
                placeholder="e.g. DL-MH-2024-012345" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading && <span className="spinner" />}
              {editing ? 'Save Changes' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
