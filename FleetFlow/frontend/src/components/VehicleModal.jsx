import { useState, useEffect } from 'react'
import { vehicleApi } from '../api/client'

const EMPTY = {
  registration_number: '',
  vehicle_type: '',
  capacity: '',
  fuel_type: '',
  current_status: 'AVAILABLE',
}

export default function VehicleModal({ vehicle, onClose, onSaved }) {
  const editing = !!vehicle
  const [form, setForm] = useState(editing ? { ...vehicle } : { ...EMPTY })
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
      const payload = { ...form, capacity: parseFloat(form.capacity) }
      if (editing) {
        await vehicleApi.update(vehicle.id, payload)
      } else {
        await vehicleApi.create(payload)
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
          <h2 className="modal-title">{editing ? 'Edit Vehicle' : 'Register Vehicle'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Registration Number</label>
              <input className="form-input" value={form.registration_number}
                onChange={set('registration_number')} required placeholder="e.g. MH12AB1234" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <input className="form-input" value={form.vehicle_type}
                  onChange={set('vehicle_type')} required placeholder="e.g. Truck" />
              </div>
              <div className="form-group">
                <label className="form-label">Fuel Type</label>
                <input className="form-input" value={form.fuel_type}
                  onChange={set('fuel_type')} required placeholder="e.g. Diesel" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Capacity (tons)</label>
                <input className="form-input" type="number" step="0.1" min="0.1"
                  value={form.capacity} onChange={set('capacity')} required placeholder="5.0" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.current_status} onChange={set('current_status')}>
                  <option value="AVAILABLE">Available</option>
                  <option value="IN_USE">In Use</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading && <span className="spinner" />}
              {editing ? 'Save Changes' : 'Register Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
