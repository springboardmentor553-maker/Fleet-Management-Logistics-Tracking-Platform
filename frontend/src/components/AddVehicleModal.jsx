import { useState, useEffect } from 'react'
import { X, MapPin } from 'lucide-react'
import api from '../api/axios'
import { geocodeCity } from '../utils/cityCoordinates'
import CustomSelect from './CustomSelect'

export default function AddVehicleModal({ vehicleToEdit, onClose, onSuccess }) {
  const isEditMode = !!vehicleToEdit

  const [form, setForm] = useState({
  registration_number: '',
  vehicle_type: '',
  capacity: '',
  fuel_type: '',
  status: 'available',
  current_lat: '',
  current_lng: '',
})
  const [locationName, setLocationName] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')
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
      current_lat: vehicleToEdit.current_lat ?? '',
      current_lng: vehicleToEdit.current_lng ?? '',
    })
  }
}, [vehicleToEdit])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Looks up a place name (e.g. "Delhi", "Andheri, Mumbai") via the free
  // Nominatim geocoder and fills in the lat/lng fields automatically.
  const handleGeocode = async () => {
    if (!locationName.trim()) return
    setGeocoding(true)
    setGeocodeError('')
    try {
      const coords = await geocodeCity(locationName.trim())
      if (!coords) {
        setGeocodeError('Location not found. Try a more specific name.')
        return
      }
      setForm(prev => ({ ...prev, current_lat: coords.lat, current_lng: coords.lng }))
    } catch (err) {
      setGeocodeError('Could not look up that location right now.')
    } finally {
      setGeocoding(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        capacity: form.capacity ? parseFloat(form.capacity) : null,
        current_lat: form.current_lat !== '' ? parseFloat(form.current_lat) : null,
        current_lng: form.current_lng !== '' ? parseFloat(form.current_lng) : null,
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
            <CustomSelect
              value={form.status}
              onChange={(val) => setForm({ ...form, status: val })}
              options={[
                { value: 'available', label: 'Available' },
                { value: 'in_use', label: 'In Use' },
                { value: 'maintenance', label: 'Maintenance' },
              ]}
            />

            <label>Find Location (optional)</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                placeholder="e.g. Delhi, Andheri Mumbai"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="ff-btn-primary"
                onClick={handleGeocode}
                disabled={geocoding || !locationName.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
              >
                <MapPin size={14} /> {geocoding ? 'Finding...' : 'Find'}
              </button>
            </div>
            {geocodeError && <div style={{ color: '#dc4444', fontSize: 12.5, marginTop: -6 }}>{geocodeError}</div>}

            <label>Current Latitude (optional)</label>
            <input name="current_lat" type="number" step="any" placeholder="e.g. 28.6139" value={form.current_lat} onChange={handleChange} />

            <label>Current Longitude (optional)</label>
            <input name="current_lng" type="number" step="any" placeholder="e.g. 77.2090" value={form.current_lng} onChange={handleChange} />

          <button type="submit" className="ff-btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Vehicle' : 'Add Vehicle')}
          </button>
        </form>
      </div>
    </div>
  )
}
