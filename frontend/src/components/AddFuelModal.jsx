// New file: frontend/src/components/AddFuelModal.jsx
import { useState } from 'react'
import { X } from 'lucide-react'
import api from '../api/axios'
import CustomSelect from './CustomSelect'

const toDateInput = (isoString) => {
  if (!isoString) return ''
  return new Date(isoString).toISOString().slice(0, 10)
}

export default function AddFuelModal({ vehicles = [], drivers = [], recordToEdit, onClose, onSuccess }) {
  const isEditMode = !!recordToEdit

  const [form, setForm] = useState({
    vehicle_id: recordToEdit?.vehicle_id || '',
    driver_id: recordToEdit?.driver_id || '',
    fuel_quantity: recordToEdit?.fuel_quantity ?? '',
    fuel_cost: recordToEdit?.fuel_cost ?? '',
    odometer_reading: recordToEdit?.odometer_reading ?? '',
    fuel_date: toDateInput(recordToEdit?.fuel_date) || new Date().toISOString().slice(0, 10),
    fuel_station: recordToEdit?.fuel_station || '',
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

    if (parseFloat(form.fuel_quantity) <= 0) {
      setError('Fuel quantity must be greater than zero')
      return
    }
    if (parseFloat(form.fuel_cost) <= 0) {
      setError('Fuel cost must be greater than zero')
      return
    }

    setLoading(true)
    try {
      const payload = {
        vehicle_id: parseInt(form.vehicle_id),
        driver_id: parseInt(form.driver_id),
        fuel_quantity: parseFloat(form.fuel_quantity),
        fuel_cost: parseFloat(form.fuel_cost),
        odometer_reading: form.odometer_reading !== '' ? parseFloat(form.odometer_reading) : null,
        fuel_date: new Date(form.fuel_date).toISOString(),
        fuel_station: form.fuel_station || null,
        remarks: form.remarks || null,
      }

      let res
      if (isEditMode) {
        res = await api.put(`/fuel/${recordToEdit.id}`, payload)
      } else {
        res = await api.post('/fuel/', payload)
      }

      onSuccess(res.data, isEditMode)
      setSuccess(true)
      setTimeout(() => onClose(), 1200)
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'add'} fuel record`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ff-modal-overlay" onClick={onClose}>
      <div className="ff-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ff-modal-header">
          <h3>{isEditMode ? 'Edit Fuel Record' : 'Add Fuel Record'}</h3>
          <X size={18} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>

        {error && <div className="ff-modal-error">{error}</div>}
        {success && <div className="ff-modal-success">✅ Fuel record {isEditMode ? 'updated' : 'added'} successfully!</div>}

        <form onSubmit={handleSubmit} className="ff-modal-form" style={{ opacity: success ? 0.5 : 1, pointerEvents: success ? 'none' : 'auto' }}>
          <label>Vehicle</label>
          <CustomSelect
            value={form.vehicle_id}
            onChange={(val) => setForm({ ...form, vehicle_id: val })}
            placeholder="-- Select Vehicle --"
            options={vehicles.map(v => ({ value: v.id, label: v.registration_number }))}
          />

          <label>Driver</label>
          <CustomSelect
            value={form.driver_id}
            onChange={(val) => setForm({ ...form, driver_id: val })}
            placeholder="-- Select Driver --"
            options={drivers.map(d => ({ value: d.id, label: d.name }))}
          />

          <label>Fuel Quantity (Liters)</label>
          <input name="fuel_quantity" type="number" step="any" min="0.01" placeholder="e.g. 40" value={form.fuel_quantity} onChange={handleChange} required />

          <label>Fuel Cost (₹)</label>
          <input name="fuel_cost" type="number" step="any" min="0.01" placeholder="e.g. 4200" value={form.fuel_cost} onChange={handleChange} required />

          <label>Odometer Reading (optional)</label>
          <input name="odometer_reading" type="number" step="any" placeholder="e.g. 15230" value={form.odometer_reading} onChange={handleChange} />

          <label>Fuel Date</label>
          <input name="fuel_date" type="date" value={form.fuel_date} onChange={handleChange} required />

          <label>Fuel Station (optional)</label>
          <input name="fuel_station" placeholder="e.g. IndianOil Pump, Sector 12" value={form.fuel_station} onChange={handleChange} />

          <label>Remarks (optional)</label>
          <input name="remarks" placeholder="Any additional details" value={form.remarks} onChange={handleChange} />

          <button type="submit" className="ff-btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'Saving...' : isEditMode ? 'Update Record' : 'Add Fuel Record'}
          </button>
        </form>
      </div>
    </div>
  )
}
