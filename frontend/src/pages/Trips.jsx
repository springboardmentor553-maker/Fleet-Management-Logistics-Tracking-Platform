import { useState } from 'react'
import { Route as RouteIcon, Plus, Calendar } from 'lucide-react'
import api from '../api/axios'
import { canEdit } from '../utils/permissions'
import { getStatusBadgeClass } from '../utils/statusBadge'
import AddTripModal from '../components/AddTripModal'
import RowMenu from '../components/RowMenu'

export default function Trips({ trips = [], vehicles = [], drivers = [], loading, search, onTripAdded, onTripDeleted }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingTrip, setEditingTrip] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const filteredTrips = (trips || []).filter(t => {
    const matchesSearch =
      t.origin?.toLowerCase().includes(search.toLowerCase()) ||
      t.destination?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (tripId) => {
    if (deletingId === tripId) return
    if (!window.confirm('Are you sure you want to delete this trip?')) return
    setDeletingId(tripId)
    try {
      await api.delete(`/trips/${tripId}`)
      onTripDeleted(tripId)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete trip')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDateTime = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  }

  return (
    <div className="ff-section">
      <div className="ff-page-header">
        <div>
          <div className="ff-section-title"><Calendar size={16} /><span>Trip Scheduling</span></div>
          <p className="ff-page-subtitle">Plan and manage upcoming and ongoing trips</p>
        </div>
        {canEdit() && (
          <button className="ff-btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Schedule Trip
          </button>
        )}
      </div>

      <div className="ff-filter-bar">
        <select className="ff-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="ff-count-pill">{filteredTrips.length} shown</span>
      </div>

      <div className="ff-table-wrap">
        <table className="ff-table">
          <thead>
            <tr>
              <th>Route</th><th>Vehicle</th><th>Driver</th><th>Start</th><th>End</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filteredTrips.length === 0 && !loading && (
              <tr className="ff-empty-row"><td colSpan="7">No trips scheduled yet</td></tr>
            )}
            {filteredTrips.map(t => {
              const vehicle = vehicles.find(v => v.id === t.vehicle_id)
              const driver = drivers.find(d => d.id === t.driver_id)
              return (
                <tr key={t.id}>
                  <td className="ff-reg-cell" data-label="Route">{t.origin} &rarr; {t.destination}</td>
                  <td data-label="Vehicle">{vehicle?.registration_number || '—'}</td>
                  <td data-label="Driver">{driver?.name || '—'}</td>
                  <td data-label="Start">{formatDateTime(t.scheduled_start)}</td>
                  <td data-label="End">{formatDateTime(t.scheduled_end)}</td>
                  <td data-label="Status">
                    <span className={`ff-badge status-${getStatusBadgeClass(t.status)}`}>{t.status}</span>
                  </td>
                  <td data-label="" style={{ textAlign: 'right' }}>
                    {canEdit() && (
                      <RowMenu onEdit={() => setEditingTrip(t)} onDelete={() => handleDelete(t.id)} />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AddTripModal
          vehicles={vehicles}
          drivers={drivers}
          onClose={() => setShowModal(false)}
          onSuccess={(trip) => onTripAdded(trip)}
        />
      )}

      {editingTrip && (
        <AddTripModal
          vehicles={vehicles}
          drivers={drivers}
          tripToEdit={editingTrip}
          onClose={() => setEditingTrip(null)}
          onSuccess={(trip, isEdit) => { if (isEdit) onTripAdded(trip, true) }}
        />
      )}
    </div>
  )
}