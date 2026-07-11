import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import api from '../api/axios'

export default function AddVehicleModal({ vehicleToEdit, onClose, onSuccess }) {
  const isEditMode = !!vehicleToEdit

  const [form, setForm] = useState({
    registration_number: '',
    vehicle_type: '',
    capacity: '',
    fuel_type: '',
    status: 'available',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (vehicleToEdit) {
      setForm({
        registration_number: vehicleToEdit.registration_number || '',
        vehicle_type: vehicleToEdit.vehicle_type || '',
        capacity: vehicleToEdit.capacity || '',
        fuel_type: vehicleToEdit.fuel_type || '',
        status: vehicleToEdit.status || 'available',
      })
    }
  }, [vehicleToEdit])

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
        capacity: form.capacity ? parseFloat(form.capacity) : null,
      }

      let res
      if (isEditMode) {
        res = await api.put(`/vehicles/${vehicleToEdit.id}`, payload)
      } else {
        res = await api.post('/vehicles/', payload)
      }

      onSuccess(res.data, isEditMode)
      setSuccess(true)
      setTimeout(() => onClose(), 1200)
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'add'} vehicle`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ff-modal-overlay" onClick={onClose}>
      <div className="ff-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ff-modal-header">
          <h3>{isEditMode ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
          <X size={18} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>

        {error && <div className="ff-modal-error">{error}</div>}
        {success && <div className="ff-modal-success">✅ Vehicle {isEditMode ? 'updated' : 'added'} successfully!</div>}

        <form onSubmit={handleSubmit} className="ff-modal-form" style={{ opacity: success ? 0.5 : 1, pointerEvents: success ? 'none' : 'auto' }}>
          <label>Registration Number</label>
          <input name="registration_number" value={form.registration_number} onChange={handleChange} required />

          <label>Vehicle Type</label>
          <input name="vehicle_type" placeholder="Truck, Van, etc." value={form.vehicle_type} onChange={handleChange} required />

          <label>Capacity (kg)</label>
          <input name="capacity" type="number" value={form.capacity} onChange={handleChange} />

          <label>Fuel Type</label>
          <input name="fuel_type" placeholder="Diesel, Petrol, CNG" value={form.fuel_type} onChange={handleChange} />

          <label>Status</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <button type="submit" className="ff-btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Vehicle' : 'Add Vehicle')}
          </button>
        </form>
      </div>
    </div>
  )
}