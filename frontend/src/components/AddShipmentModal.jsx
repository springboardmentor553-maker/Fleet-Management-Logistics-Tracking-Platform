import { useState } from 'react'
import { X } from 'lucide-react'
import api from '../api/axios'
import CustomSelect from './CustomSelect'

export default function AddShipmentModal({ vehicles = [], drivers = [], onClose, onSuccess }) {
  const [form, setForm] = useState({
    sender_name: '',
    receiver_name: '',
    origin: '',
    destination: '',
    weight: '',
    status: 'created',
    vehicle_id: '',
    driver_id: '',
    eta: '',
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
        vehicle_id: form.vehicle_id ? parseInt(form.vehicle_id) : null,
        driver_id: form.driver_id ? parseInt(form.driver_id) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        eta: form.eta ? new Date(form.eta).toISOString() : null,
      }
      const res = await api.post('/shipments/', payload)
      onSuccess(res.data)
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add shipment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ff-modal-overlay" onClick={onClose}>
      <div className="ff-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ff-modal-header">
          <h3>New Shipment</h3>
          <X size={18} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>

        {error && <div className="ff-modal-error">{error}</div>}
        {success && <div className="ff-modal-success">✅ Shipment added successfully!</div>}

        <form onSubmit={handleSubmit} className="ff-modal-form" style={{ opacity: success ? 0.5 : 1, pointerEvents: success ? 'none' : 'auto' }}>
          <label>Sender Name</label>
          <input name="sender_name" placeholder="Rahul Sharma" value={form.sender_name} onChange={handleChange} />

          <label>Receiver Name</label>
          <input name="receiver_name" placeholder="Priya Verma" value={form.receiver_name} onChange={handleChange} />

          <label>Origin</label>
          <input name="origin" placeholder="Delhi" value={form.origin} onChange={handleChange} required />

          <label>Destination</label>
          <input name="destination" placeholder="Mumbai" value={form.destination} onChange={handleChange} required />

          <label>Weight (kg)</label>
          <input name="weight" type="number" step="any" placeholder="e.g. 25" value={form.weight} onChange={handleChange} />

          <label>Assign Vehicle</label>
          <CustomSelect
            value={form.vehicle_id}
            onChange={(val) => setForm({ ...form, vehicle_id: val })}
            placeholder="-- None --"
            options={[
              { value: '', label: '-- None --' },
              ...vehicles.map(v => ({ value: v.id, label: v.registration_number })),
            ]}
          />

          <label>Assign Driver</label>
          <CustomSelect
            value={form.driver_id}
            onChange={(val) => setForm({ ...form, driver_id: val })}
            placeholder="-- None --"
            options={[
              { value: '', label: '-- None --' },
              ...drivers.map(d => ({ value: d.id, label: d.name })),
            ]}
          />

          <label>Status</label>
          <CustomSelect
            value={form.status}
            onChange={(val) => setForm({ ...form, status: val })}
            options={[
              { value: 'created', label: 'Created' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'picked_up', label: 'Picked Up' },
              { value: 'in_transit', label: 'In Transit' },
              { value: 'out_for_delivery', label: 'Out for Delivery' },
              { value: 'delayed', label: 'Delayed' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />

          <label>Estimated Arrival (ETA)</label>
          <input name="eta" type="datetime-local" value={form.eta} onChange={handleChange} />

          <button type="submit" className="ff-btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'Adding...' : 'Add Shipment'}
          </button>
        </form>
      </div>
    </div>
  )
}
