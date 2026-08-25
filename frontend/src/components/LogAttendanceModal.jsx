import { useState } from 'react'
import { X } from 'lucide-react'
import api from '../api/axios'
import CustomSelect from './CustomSelect'
import { ATTENDANCE_STATUS_OPTIONS } from '../utils/assignmentStatus'

const toDateInput = (isoString) => {
  if (!isoString) return ''
  return new Date(isoString).toISOString().slice(0, 10)
}

const toTimeInput = (isoString) => {
  if (!isoString) return ''
  const d = new Date(isoString)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Combines a YYYY-MM-DD date with an HH:MM time into one ISO datetime string
const combineDateAndTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null
  return new Date(`${dateStr}T${timeStr}:00`).toISOString()
}

export default function LogAttendanceModal({ drivers = [], recordToEdit, onClose, onSuccess }) {
  const isEditMode = !!recordToEdit

  const [form, setForm] = useState({
    driver_id: recordToEdit?.driver_id || '',
    date: toDateInput(recordToEdit?.date) || new Date().toISOString().slice(0, 10),
    status: recordToEdit?.status || 'present',
    check_in_time: toTimeInput(recordToEdit?.check_in_time),
    check_out_time: toTimeInput(recordToEdit?.check_out_time),
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
        date: new Date(form.date).toISOString(),
        status: form.status,
        check_in_time: combineDateAndTime(form.date, form.check_in_time),
        check_out_time: combineDateAndTime(form.date, form.check_out_time),
      }

      let res
      if (isEditMode) {
        res = await api.put(`/driver-attendance/${recordToEdit.id}`, payload)
      } else {
        res = await api.post('/driver-attendance/', payload)
      }

      onSuccess(res.data, isEditMode)
      setSuccess(true)
      setTimeout(() => onClose(), 1200)
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'log'} attendance`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ff-modal-overlay" onClick={onClose}>
      <div className="ff-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ff-modal-header">
          <h3>{isEditMode ? 'Edit Attendance' : 'Log Attendance'}</h3>
          <X size={18} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>

        {error && <div className="ff-modal-error">{error}</div>}
        {success && <div className="ff-modal-success">✅ Attendance {isEditMode ? 'updated' : 'logged'} successfully!</div>}

        <form onSubmit={handleSubmit} className="ff-modal-form" style={{ opacity: success ? 0.5 : 1, pointerEvents: success ? 'none' : 'auto' }}>
          <label>Driver</label>
          <CustomSelect
            value={form.driver_id}
            onChange={(val) => setForm({ ...form, driver_id: val })}
            placeholder="-- Select Driver --"
            options={drivers.map(d => ({ value: d.id, label: d.name }))}
          />

          <label>Date</label>
          <input name="date" type="date" value={form.date} onChange={handleChange} required />

          <label>Status</label>
          <CustomSelect
            value={form.status}
            onChange={(val) => setForm({ ...form, status: val })}
            options={ATTENDANCE_STATUS_OPTIONS}
          />

          <label>Check-In Time (optional)</label>
          <input name="check_in_time" type="time" value={form.check_in_time} onChange={handleChange} />

          <label>Check-Out Time (optional)</label>
          <input name="check_out_time" type="time" value={form.check_out_time} onChange={handleChange} />

          <button type="submit" className="ff-btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'Saving...' : isEditMode ? 'Update Attendance' : 'Log Attendance'}
          </button>
        </form>
      </div>
    </div>
  )
}
