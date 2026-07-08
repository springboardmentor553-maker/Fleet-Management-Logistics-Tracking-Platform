import { useEffect, useState } from 'react'
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../api/vehicles'
import { getDrivers } from '../api/drivers'

const VEHICLE_TYPES = ['Truck', 'Van', 'Bike', 'Mini Truck', 'Container', 'Tanker', 'Pickup']
const FUEL_TYPES    = ['Diesel', 'Petrol', 'Electric', 'CNG', 'Hybrid']
const STATUS_TYPES  = ['available', 'in_transit', 'maintenance']

const EMPTY = {
  plate_number: '',
  vehicle_type: '',
  model: '',
  capacity_kg: '',
  fuel_type: '',
  assigned_driver_id: '',
  current_status: 'available',
}

const STATUS_CLASS = {
  available:   'available',
  in_transit:  'in-transit',
  maintenance: 'maintenance',
}

const STATUS_LABEL = {
  available:   'Available',
  in_transit:  'In Transit',
  maintenance: 'Maintenance',
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
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
    Promise.all([getVehicles(), getDrivers()])
      .then(([v, d]) => { setVehicles(v); setDrivers(d) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function openAdd() {
    setForm(EMPTY); setEditing(null); setFormErr(''); setShowForm(true)
  }

  function openEdit(v) {
    setForm({
      plate_number:       v.plate_number,
      vehicle_type:       v.vehicle_type,
      model:              v.model,
      capacity_kg:        v.capacity_kg,
      fuel_type:          v.fuel_type,
      assigned_driver_id: v.assigned_driver_id ?? '',
      current_status:     v.current_status,
    })
    setEditing(v.id); setFormErr(''); setShowForm(true)
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
    const payload = {
      ...form,
      capacity_kg:        parseFloat(form.capacity_kg),
      assigned_driver_id: form.assigned_driver_id === '' ? null : parseInt(form.assigned_driver_id),
    }
    try {
      editing ? await updateVehicle(editing, payload) : await createVehicle(payload)
      closeForm(); load()
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
                <th>ID</th>
                <th>Reg. Number</th>
                <th>Type</th>
                <th>Model</th>
                <th>Capacity</th>
                <th>Fuel</th>
                <th>Assigned Driver</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 && (
                <tr><td colSpan={9} className="empty-row">No vehicles registered yet.</td></tr>
              )}
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td className="id-cell">#{v.id}</td>
                  <td><span className="plate-badge">{v.plate_number}</span></td>
                  <td><span className="type-badge">{v.vehicle_type}</span></td>
                  <td>{v.model}</td>
                  <td>{v.capacity_kg.toLocaleString()} kg</td>
                  <td><span className="fuel-badge">{v.fuel_type}</span></td>
                  <td>
                    {v.assigned_driver
                      ? <span className="driver-chip">👤 {v.assigned_driver.name}</span>
                      : <span className="unassigned">— Unassigned</span>}
                  </td>
                  <td>
                    <span className={`status-badge ${STATUS_CLASS[v.current_status] || 'available'}`}>
                      {STATUS_LABEL[v.current_status] || v.current_status}
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
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
              <button className="modal-close" onClick={closeForm}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                {/* Registration Number */}
                <div className="field">
                  <label>Registration Number</label>
                  <input
                    name="plate_number"
                    value={form.plate_number}
                    onChange={handleChange}
                    placeholder="TN-01-AB-1234"
                    required
                  />
                </div>

                {/* Vehicle Type */}
                <div className="field">
                  <label>Vehicle Type</label>
                  <select name="vehicle_type" value={form.vehicle_type} onChange={handleChange} required>
                    <option value="">Select type...</option>
                    {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Model */}
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

                {/* Capacity */}
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

                {/* Fuel Type */}
                <div className="field">
                  <label>Fuel Type</label>
                  <select name="fuel_type" value={form.fuel_type} onChange={handleChange} required>
                    <option value="">Select fuel...</option>
                    {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {/* Assigned Driver */}
                <div className="field">
                  <label>Assigned Driver</label>
                  <select name="assigned_driver_id" value={form.assigned_driver_id} onChange={handleChange}>
                    <option value="">— Unassigned</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.license_number})</option>
                    ))}
                  </select>
                </div>

                {/* Current Status */}
                <div className="field">
                  <label>Current Status</label>
                  <select name="current_status" value={form.current_status} onChange={handleChange} required>
                    {STATUS_TYPES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formErr && <p className="form-error">{formErr}</p>}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
