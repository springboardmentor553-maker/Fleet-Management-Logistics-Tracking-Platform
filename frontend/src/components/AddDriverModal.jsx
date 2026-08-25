import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import api from '../api/axios'
import CustomSelect from './CustomSelect'

export default function AddDriverModal({ driverToEdit, onClose, onSuccess }) {
  const isEditMode = !!driverToEdit

  const [form, setForm] = useState({
    name: '',
    license_number: '',
    phone: '',
    status: 'active',
    experience_years: '',
    attendance_percentage: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (driverToEdit) {
      setForm({
        name: driverToEdit.name || '',
        license_number: driverToEdit.license_number || '',
        phone: driverToEdit.phone || '',
        status: driverToEdit.status || 'active',
        experience_years: driverToEdit.experience_years ?? '',
        attendance_percentage: driverToEdit.attendance_percentage ?? '',
      })
    }
  }, [driverToEdit])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10)
      setForm({ ...form, phone: digitsOnly })
      return
    }
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        experience_years: form.experience_years !== '' ? parseInt(form.experience_years, 10) : null,
        attendance_percentage: form.attendance_percentage !== '' ? parseFloat(form.attendance_percentage) : null,
      }

      let res
      if (isEditMode) {
        res = await api.put(`/drivers/${driverToEdit.id}`, payload)
      } else {
        res = await api.post('/drivers/', payload)
      }
      onSuccess(res.data, isEditMode)
      setSuccess(true)
      setTimeout(() => onClose(), 1200)
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'add'} driver`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ff-modal-overlay" onClick={onClose}>
      <div className="ff-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ff-modal-header">
          <h3>{isEditMode ? 'Edit Driver' : 'Add Driver'}</h3>
          <X size={18} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>

        {error && <div className="ff-modal-error">{error}</div>}
        {success && <div className="ff-modal-success">✅ Driver {isEditMode ? 'updated' : 'added'} successfully!</div>}

        <form onSubmit={handleSubmit} className="ff-modal-form" style={{ opacity: success ? 0.5 : 1, pointerEvents: success ? 'none' : 'auto' }}>
          <label>Full Name</label>
          <input name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required />

          <label>License Number</label>
          <input name="license_number" placeholder="DL1234567" value={form.license_number} onChange={handleChange} required />

          <label>Phone</label>
          <input
            name="phone"
            type="tel"
            placeholder="9876543210"
            value={form.phone}
            onChange={handleChange}
            maxLength={10}
            pattern="[0-9]{10}"
            title="Enter a 10-digit phone number"
          />

          <label>Status</label>
          <CustomSelect
            value={form.status}
            onChange={(val) => setForm({ ...form, status: val })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />

          <label>Experience (years)</label>
          <input
            name="experience_years"
            type="number"
            min="0"
            max="60"
            placeholder="e.g. 5"
            value={form.experience_years}
            onChange={handleChange}
          />

          <label>Attendance (%)</label>
          <input
            name="attendance_percentage"
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="e.g. 95"
            value={form.attendance_percentage}
            onChange={handleChange}
          />

          <button type="submit" className="ff-btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Driver' : 'Add Driver')}
          </button>
        </form>
      </div>
    </div>
  )
}
