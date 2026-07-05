import { useEffect, useState } from 'react'
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../api/vehicles'

const EMPTY = { plate_number: '', model: '', capacity_kg: '', is_available: true }

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [form,     setForm]     = useState(EMPTY)
  const [editing,  setEditing]  = useState(null)   // vehicle id being edited
  const [saving,   setSaving]   = useState(false)
  const [formErr,  setFormErr]  = useState('')
  const [showForm, setShowForm] = useState(false)

  function load() {
    setLoading(true)
    getVehicles()
      .then(setVehicles)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function openAdd() {
    setForm(EMPTY)
    setEditing(null)
    setFormErr('')
    setShowForm(true)
  }

  function openEdit(v) {
    setForm({ plate_number: v.plate_number, model: v.model, capacity_kg: v.capacity_kg, is_available: v.is_available })
    setEditing(v.id)
    setFormErr('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY)
    setFormErr('')
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormErr('')
    setSaving(true)
    const payload = { ...form, capacity_kg: parseFloat(form.capacity_kg) }
    try {
      if (editing) {
        await updateVehicle(editing, payload)
      } else {
        await createVehicle(payload)
      }
      closeForm()
      load()
    } catch (err) {
      setFormErr(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this vehicle?')) return
    try {
      await deleteVehicle(id)
      setVehicles((v) => v.filter((x) => x.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Vehicles</h2>
          <p>Manage your fleet vehicles</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add Vehicle</button>
      </div>

      {loading && <div className="status-msg">Loading vehicles...</div>}
      {error   && <div className="status-msg error">{error}</div>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Plate Number</th>
                <th>Model</th>
                <th>Capacity (kg)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 && (
                <tr><td colSpan={6} className="empty-row">No vehicles registered yet.</td></tr>
              )}
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td>{v.id}</td>
                  <td><span className="plate-badge">{v.plate_number}</span></td>
                  <td>{v.model}</td>
                  <td>{v.capacity_kg.toLocaleString()} kg</td>
                  <td>
                    <span className={`status-badge ${v.is_available ? 'available' : 'unavailable'}`}>
                      {v.is_available ? 'Available' : 'In Use'}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn-edit"   onClick={() => openEdit(v)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(v.id)}>Delete</button>
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
              <h3>{editing ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
              <button className="modal-close" onClick={closeForm}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="field">
                <label>Plate Number</label>
                <input
                  name="plate_number"
                  value={form.plate_number}
                  onChange={handleChange}
                  placeholder="TN-01-AB-1234"
                  required
                />
              </div>
              <div className="field">
                <label>Model</label>
                <input
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  placeholder="Tata Ace"
                  required
                />
              </div>
              <div className="field">
                <label>Capacity (kg)</label>
                <input
                  name="capacity_kg"
                  type="number"
                  min="1"
                  step="0.1"
                  value={form.capacity_kg}
                  onChange={handleChange}
                  placeholder="1000"
                  required
                />
              </div>
              <div className="field field-row">
                <input
                  id="is_available"
                  name="is_available"
                  type="checkbox"
                  checked={form.is_available}
                  onChange={handleChange}
                />
                <label htmlFor="is_available">Available</label>
              </div>

              {formErr && <p className="form-error">{formErr}</p>}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
