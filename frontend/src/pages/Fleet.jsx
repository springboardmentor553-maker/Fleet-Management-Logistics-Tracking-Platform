import { useState } from 'react'
import { Truck, Plus } from 'lucide-react'
import AddVehicleModal from '../components/AddVehicleModal'
import RowMenu from '../components/RowMenu'
import api from '../api/axios'
import { canEdit } from '../utils/permissions'

const Fleet = ({ vehicles = [], loading, search, onVehicleAdded, onVehicleDeleted }) => {
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)

  const vehicleTypes = [...new Set(vehicles.map(v => v.vehicle_type).filter(Boolean))]

  const filteredVehicles = (vehicles || []).filter(v => {
    const matchesSearch =
      v.registration_number?.toLowerCase().includes(search.toLowerCase()) ||
      v.vehicle_type?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter
    const matchesType = typeFilter === 'all' || v.vehicle_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return
    try {
      await api.delete(`/vehicles/${vehicleId}`)
      onVehicleDeleted(vehicleId)
    } catch (err) {
      // Show the backend's actual reason (e.g. "linked to shipment FLT100002")
      // instead of a generic message, so the user knows what to fix.
      const reason = err.response?.data?.detail || 'Failed to delete vehicle'
      alert(reason)
    }
  }

  return (
    <div className="ff-section">
      <div className="ff-page-header">
        <div>
          <div className="ff-section-title"><Truck size={16} /><span>Fleet Management</span></div>
          <p className="ff-page-subtitle">Manage and monitor your entire vehicle fleet</p>
        </div>
        {canEdit() && (
          <button className="ff-btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Vehicle
          </button>
        )}
      </div>

      <div className="ff-filter-bar">
        <select className="ff-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="in_use">In Use</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select className="ff-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          {vehicleTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="ff-count-pill">{filteredVehicles.length} shown</span>
      </div>

      <div className="ff-table-wrap">
        <table className="ff-table">
          <thead>
            <tr>
              <th>Vehicle</th><th>Type</th><th>Fuel</th><th>Capacity</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.length === 0 && !loading && (
              <tr className="ff-empty-row"><td colSpan="6">No vehicles match your search</td></tr>
            )}
            {filteredVehicles.map(v => (
              <tr key={v.id}>
                <td className="ff-reg-cell" data-label="Vehicle">{v.registration_number}</td>
                <td data-label="Type">{v.vehicle_type}</td>
                <td data-label="Fuel">{v.fuel_type || '—'}</td>
                <td data-label="Capacity">{v.capacity ? `${v.capacity} kg` : '—'}</td>
                <td data-label="Status">
                  {/* Standardized class tokens logic mapping space strings with underscore placeholders */}
                  <span className={`ff-badge status-${v.status ? v.status.replace(' ', '_') : 'in_use'}`}>
                    {v.status === 'available' ? 'Running' : v.status === 'maintenance' ? 'Maintenance' : 'Idle'}
                  </span>
                </td>
                <td data-label="" style={{ textAlign: 'right' }}>
                  {canEdit() && (
                    <RowMenu
                      onEdit={() => setEditingVehicle(v)}
                      onDelete={() => handleDelete(v.id)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showModal && (
        <AddVehicleModal
          onClose={() => setShowModal(false)}
          onSuccess={(vehicle) => onVehicleAdded(vehicle)}
        />
      )}

      {editingVehicle && (
        <AddVehicleModal
          vehicleToEdit={editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSuccess={(vehicle, isEdit) => {
            if (isEdit) onVehicleAdded(vehicle, true)
          }}
        />
      )}
    </div>
  )
}

export default Fleet
