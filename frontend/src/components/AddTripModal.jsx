import { useState } from 'react'
import { X } from 'lucide-react'
import api from '../api/axios'
import CustomSelect from './CustomSelect'

export default function AddTripModal({ vehicles = [], drivers = [], shipments = [], tripToEdit, onClose, onSuccess }) {
  const isEditMode = !!tripToEdit

  const toLocalInput = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const [form, setForm] = useState({
    shipment_id: tripToEdit?.shipment_id || '',
    vehicle_id: tripToEdit?.vehicle_id || '',
    driver_id: tripToEdit?.driver_id || '',
    origin: tripToEdit?.origin || '',
    destination: tripToEdit?.destination || '',
    scheduled_start: toLocalInput(tripToEdit?.scheduled_start),
    scheduled_end: toLocalInput(tripToEdit?.scheduled_end),
    status: tripToEdit?.status || 'scheduled',
    notes: tripToEdit?.notes || '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        shipment_id: form.shipment_id ? parseInt(form.shipment_id) : null,
        vehicle_id: parseInt(form.vehicle_id),
        driver_id: parseInt(form.driver_id),
        scheduled_start: new Date(form.scheduled_start).toISOString(),
        scheduled_end: form.scheduled_end ? new Date(form.scheduled_end).toISOString() : null,
      }

      let res
      if (isEditMode) {
        res = await api.put(`/trips/${tripToEdit.id}`, payload)
      } else {
        res = await api.post('/trips/', payload)
      }

      onSuccess(res.data, isEditMode)
      setSuccess(true)
      setTimeout(() => onClose(), 1200)
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'schedule'} trip`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ff-modal-overlay" onClick={onClose}>
      <div className="ff-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ff-modal-header">
          <h3>{isEditMode ? 'Edit Trip' : 'Schedule New Trip'}</h3>
          <X size={18} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>

        {error && <div className="ff-modal-error">{error}</div>}
        {success && <div className="ff-modal-success">&#9989; Trip {isEditMode ? 'updated' : 'scheduled'} successfully!</div>}

        <form onSubmit={handleSubmit} className="ff-modal-form" style={{ opacity: success ? 0.5 : 1, pointerEvents: success ? 'none' : 'auto' }}>
          <label>Link Shipment (optional)</label>
          <CustomSelect
            value={form.shipment_id}
            onChange={(val) => setForm({ ...form, shipment_id: val })}
            placeholder="-- None --"
            options={[
              { value: '', label: '-- None --' },
              ...shipments.map(s => ({ value: s.id, label: `${s.tracking_id} (${s.origin} → ${s.destination})` })),
            ]}
          />

          <label>Vehicle</label>
          <CustomSelect
            value={form.vehicle_id}
            onChange={(val) => setForm({ ...form, vehicle_id: val })}
            placeholder="-- Select Vehicle --"
            options={[
              { value: '', label: '-- Select Vehicle --' },
              ...vehicles.map(v => ({ value: v.id, label: v.registration_number })),
            ]}
          />

          <label>Driver</label>
          <CustomSelect
            value={form.driver_id}
            onChange={(val) => setForm({ ...form, driver_id: val })}
            placeholder="-- Select Driver --"
            options={[
              { value: '', label: '-- Select Driver --' },
              ...drivers.map(d => ({ value: d.id, label: d.name })),
            ]}
          />

          <label>Origin</label>
          <input name="origin" placeholder="Delhi" value={form.origin} onChange={handleChange} required />

          <label>Destination</label>
          <input name="destination" placeholder="Mumbai" value={form.destination} onChange={handleChange} required />

          <label>Scheduled Start</label>
          <input name="scheduled_start" type="datetime-local" value={form.scheduled_start} onChange={handleChange} required />

          <label>Scheduled End (optional)</label>
          <input name="scheduled_end" type="datetime-local" value={form.scheduled_end} onChange={handleChange} />

          <label>Status</label>
          <CustomSelect
            value={form.status}
            onChange={(val) => setForm({ ...form, status: val })}
            options={[
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'ongoing', label: 'Ongoing' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />

          <label>Notes (optional)</label>
          <input name="notes" placeholder="Any special instructions" value={form.notes} onChange={handleChange} />

          <button type="submit" className="ff-btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'Saving...' : isEditMode ? 'Update Trip' : 'Schedule Trip'}
          </button>
        </form>
      </div>
    </div>
  )
}
