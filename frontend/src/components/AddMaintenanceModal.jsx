import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import api from '../api/axios'
import CustomSelect from './CustomSelect'

const CATEGORY_OPTIONS = [
  { value: 'oil_change', label: 'Oil Change' },
  { value: 'tyre_replacement', label: 'Tyre Replacement' },
  { value: 'brake_service', label: 'Brake Service' },
  { value: 'engine_service', label: 'Engine Service' },
  { value: 'general_inspection', label: 'General Inspection' },
]

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const toDateInput = (isoString) => {
  if (!isoString) return ''
  return new Date(isoString).toISOString().slice(0, 10)
}

export default function AddMaintenanceModal({ vehicles = [], recordToEdit, onClose, onSuccess }) {
  const isEditMode = !!recordToEdit

  const [form, setForm] = useState({
    vehicle_id: recordToEdit?.vehicle_id || '',
    category: recordToEdit?.category || 'oil_change',
    service_date: toDateInput(recordToEdit?.service_date) || new Date().toISOString().slice(0, 10),
    next_service_date: toDateInput(recordToEdit?.next_service_date),
    service_cost: recordToEdit?.service_cost ?? '',
    service_provider: recordToEdit?.service_provider || '',
    status: recordToEdit?.status || 'scheduled',
    notes: recordToEdit?.notes || '',
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
        vehicle_id: parseInt(form.vehicle_id),
        service_date: new Date(form.service_date).toISOString(),
        next_service_date: form.next_service_date ? new Date(form.next_service_date).toISOString() : null,
        service_cost: form.service_cost !== '' ? parseFloat(form.service_cost) : null,
      }

      let res
      if (isEditMode) {
        res = await api.put(`/maintenance/${recordToEdit.id}`, payload)
      } else {
        res = await api.post('/maintenance/', payload)
      }

      onSuccess(res.data, isEditMode)
      setSuccess(true)
      setTimeout(() => onClose(), 1200)
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'schedule'} service`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ff-modal-overlay" onClick={onClose}>
      <div className="ff-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ff-modal-header">
          <h3>{isEditMode ? 'Edit Service Record' : 'Schedule Service'}</h3>
          <X size={18} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>

        {error && <div className="ff-modal-error">{error}</div>}
        {success && <div className="ff-modal-success">✅ Service {isEditMode ? 'updated' : 'scheduled'} successfully!</div>}

        <form onSubmit={handleSubmit} className="ff-modal-form" style={{ opacity: success ? 0.5 : 1, pointerEvents: success ? 'none' : 'auto' }}>
          <label>Vehicle</label>
          <CustomSelect
            value={form.vehicle_id}
            onChange={(val) => setForm({ ...form, vehicle_id: val })}
            placeholder="-- Select Vehicle --"
            options={vehicles.map(v => ({ value: v.id, label: v.registration_number }))}
          />

          <label>Service Category</label>
          <CustomSelect
            value={form.category}
            onChange={(val) => setForm({ ...form, category: val })}
            options={CATEGORY_OPTIONS}
          />

          <label>Service Date</label>
          <input name="service_date" type="date" value={form.service_date} onChange={handleChange} required />

          <label>Next Service Date (optional)</label>
          <input name="next_service_date" type="date" value={form.next_service_date} onChange={handleChange} />

          <label>Service Cost (optional)</label>
          <input name="service_cost" type="number" step="any" placeholder="e.g. 2500" value={form.service_cost} onChange={handleChange} />

          <label>Service Provider (optional)</label>
          <input name="service_provider" placeholder="e.g. City Auto Care" value={form.service_provider} onChange={handleChange} />

          <label>Status</label>
          <CustomSelect
            value={form.status}
            onChange={(val) => setForm({ ...form, status: val })}
            options={STATUS_OPTIONS}
          />

          <label>Notes (optional)</label>
          <input name="notes" placeholder="Any additional details" value={form.notes} onChange={handleChange} />

          <button type="submit" className="ff-btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'Saving...' : isEditMode ? 'Update Record' : 'Schedule Service'}
          </button>
        </form>
      </div>
    </div>
  )
}
