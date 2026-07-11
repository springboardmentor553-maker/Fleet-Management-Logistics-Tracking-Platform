import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import api from '../api/axios'

export default function AddDriverModal({ driverToEdit, onClose, onSuccess }) {
  const isEditMode = !!driverToEdit

  const [form, setForm] = useState({
    name: '',
    license_number: '',
    phone: '',
    status: 'active',
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
      let res
      if (isEditMode) {
        res = await api.put(`/drivers/${driverToEdit.id}`, form)
      } else {
        res = await api.post('/drivers/', form)
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
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button type="submit" className="ff-btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Driver' : 'Add Driver')}
          </button>
        </form>
      </div>
    </div>
  )
}