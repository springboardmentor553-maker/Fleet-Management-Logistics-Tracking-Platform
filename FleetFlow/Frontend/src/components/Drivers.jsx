import { useEffect, useState } from 'react'
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../api/drivers'

const EMPTY = { name: '', email: '', phone: '', license_number: '' }

export default function Drivers() {
  const [drivers,  setDrivers]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [form,     setForm]     = useState(EMPTY)
  const [editing,  setEditing]  = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [formErr,  setFormErr]  = useState('')
  const [showForm, setShowForm] = useState(false)

  function load() {
    setLoading(true)
    getDrivers()
      .then(setDrivers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function openAdd() {
    setForm(EMPTY); setEditing(null); setFormErr(''); setShowForm(true)
  }

  function openEdit(d) {
    setForm({ name: d.name, email: d.email, phone: d.phone, license_number: d.license_number })
    setEditing(d.id); setFormErr(''); setShowForm(true)
  }

  function closeForm() {
    setShowForm(false); setEditing(null); setForm(EMPTY); setFormErr('')
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault(); setFormErr(''); setSaving(true)
    try {
      editing ? await updateDriver(editing, form) : await createDriver(form)
      closeForm(); load()
    } catch (err) {
      setFormErr(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this driver?')) return
    try {
      await deleteDriver(id)
      setDrivers((d) => d.filter((x) => x.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Drivers</h2>
          <p>Manage your fleet drivers</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add Driver</button>
      </div>

      {loading && <div className="status-msg">Loading drivers...</div>}
      {error   && <div className="status-msg error">{error}</div>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>License</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 && (
                <tr><td colSpan={7} className="empty-row">No drivers registered yet.</td></tr>
              )}
              {drivers.map((d) => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td className="driver-name">
                    <span className="avatar">{d.name[0].toUpperCase()}</span>
                    {d.name}
                  </td>
                  <td>{d.email}</td>
                  <td>{d.phone}</td>
                  <td><span className="plate-badge">{d.license_number}</span></td>
                  <td>
                    <span className={`status-badge ${d.is_available ? 'available' : 'unavailable'}`}>
                      {d.is_available ? 'Available' : 'On Trip'}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn-edit"   onClick={() => openEdit(d)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(d.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Driver' : 'Add Driver'}</h3>
              <button className="modal-close" onClick={closeForm}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="field">
                <label>Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required />
              </div>
              <div className="field">
                <label>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@example.com" required />
              </div>
              <div className="field">
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" required />
              </div>
              <div className="field">
                <label>License Number</label>
                <input name="license_number" value={form.license_number} onChange={handleChange} placeholder="TN-0120110012345" required />
              </div>
              {formErr && <p className="form-error">{formErr}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
