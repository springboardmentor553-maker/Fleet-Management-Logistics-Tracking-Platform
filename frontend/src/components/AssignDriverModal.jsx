import { useState } from 'react'
import { X } from 'lucide-react'
import api from '../api/axios'
import CustomSelect from './CustomSelect'
import { ASSIGNMENT_STATUS_OPTIONS } from '../utils/assignmentStatus'

const toDateTimeLocal = (isoString) => {
  if (!isoString) return ''
  const d = new Date(isoString)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AssignDriverModal({ drivers = [], vehicles = [], recordToEdit, onClose, onSuccess }) {
  const isEditMode = !!recordToEdit

  const [form, setForm] = useState({
    driver_id: recordToEdit?.driver_id || '',
    vehicle_id: recordToEdit?.vehicle_id || '',
    trip_id: recordToEdit?.trip_id || '',
    assignment_date: toDateTimeLocal(recordToEdit?.assignment_date) || toDateTimeLocal(new Date().toISOString()),
    status: recordToEdit?.status || 'assigned',
    remarks: recordToEdit?.remarks || '',
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
        driver_id: parseInt(form.driver_id),
        vehicle_id: parseInt(form.vehicle_id),
        trip_id: form.trip_id !== '' ? parseInt(form.trip_id) : null,
        assignment_date: new Date(form.assignment_date).toISOString(),
        status: form.status,
        remarks: form.remarks || null,
      }

      let res
      if (isEditMode) {
        res = await api.put(`/driver-assignments/${recordToEdit.id}`, payload)
      } else {
        res = await api.post('/driver-assignments/', payload)
      }

      onSuccess(res.data, isEditMode)
      setSuccess(true)
      setTimeout(() => onClose(), 1200)
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'create'} assignment`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ff-modal-overlay" onClick={onClose}>
      <div className="ff-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ff-modal-header">
          <h3>{isEditMode ? 'Edit Assignment' : 'Assign Driver'}</h3>
          <X size={18} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>

        {error && <div className="ff-modal-error">{error}</div>}
        {success && <div className="ff-modal-success">✅ Assignment {isEditMode ? 'updated' : 'created'} successfully!</div>}

        <form onSubmit={handleSubmit} className="ff-modal-form" style={{ opacity: success ? 0.5 : 1, pointerEvents: success ? 'none' : 'auto' }}>
          <label>Driver</label>
          <CustomSelect
            value={form.driver_id}
            onChange={(val) => setForm({ ...form, driver_id: val })}
            placeholder="-- Select Driver --"
            options={drivers.map(d => ({ value: d.id, label: d.name }))}
          />

          <label>Vehicle</label>
          <CustomSelect
            value={form.vehicle_id}
            onChange={(val) => setForm({ ...form, vehicle_id: val })}
            placeholder="-- Select Vehicle --"
            options={vehicles.map(v => ({ value: v.id, label: v.registration_number }))}
          />

          <label>Trip ID (optional)</label>
          <input name="trip_id" type="number" placeholder="Link to a trip ID, if any" value={form.trip_id} onChange={handleChange} />

          <label>Assignment Date & Time</label>
          <input name="assignment_date" type="datetime-local" value={form.assignment_date} onChange={handleChange} required />

          <label>Status</label>
          <CustomSelect
            value={form.status}
            onChange={(val) => setForm({ ...form, status: val })}
            options={ASSIGNMENT_STATUS_OPTIONS}
          />

          <label>Remarks (optional)</label>
          <input name="remarks" placeholder="e.g. Morning shift" value={form.remarks} onChange={handleChange} />

          <button type="submit" className="ff-btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'Saving...' : isEditMode ? 'Update Assignment' : 'Assign Driver'}
          </button>
        </form>
      </div>
    </div>
  )
}
