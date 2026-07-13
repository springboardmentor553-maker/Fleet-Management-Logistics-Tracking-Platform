import { useEffect, useState } from 'react'
import { getTrips, updateTripStatus, deleteTrip } from '../api/trips'

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  started: 'Started',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function Trips({ onViewTripMap }) {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  function load() {
    setLoading(true)
    getTrips()
      .then(setTrips)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleStatus(tripId, status) {
    setBusyId(tripId)
    try {
      await updateTripStatus(tripId, status)
      load()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(tripId) {
    if (!confirm('Delete this trip?')) return
    try {
      await deleteTrip(tripId)
      load()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Trips</h2>
          <p>View and manage all active trips</p>
        </div>
      </div>

      {loading && <div className="status-msg">Loading trips…</div>}
      {error && <div className="status-msg error">{error}</div>}

      {!loading && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Shipment</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 && (
                <tr><td colSpan={8} className="empty-row">No trips available</td></tr>
              )}
              {trips.map((trip) => (
                <tr key={trip.id}>
                  <td className="id-cell">{trip.id}</td>
                  <td>{trip.shipment_origin} → {trip.shipment_destination}</td>
                  <td>{trip.driver_name || '—'}</td>
                  <td>{trip.vehicle_plate || '—'}</td>
                  <td>
                    <span className={`status-badge ${trip.status}`}>{STATUS_LABELS[trip.status] || trip.status}</span>
                  </td>
                  <td>{trip.start_time ? new Date(trip.start_time).toLocaleString() : '—'}</td>
                  <td>{trip.end_time ? new Date(trip.end_time).toLocaleString() : '—'}</td>
                  <td className="actions">
                    {trip.status === 'scheduled' && (
                      <button className="btn-edit" disabled={busyId === trip.id} onClick={() => handleStatus(trip.id, 'started')}>
                        {busyId === trip.id ? 'Starting…' : 'Start'}
                      </button>
                    )}
                    {trip.status === 'started' && (
                      <button className="btn-primary" disabled={busyId === trip.id} onClick={() => handleStatus(trip.id, 'completed')}>
                        {busyId === trip.id ? 'Completing…' : 'Complete'}
                      </button>
                    )}
                    {trip.status !== 'completed' && trip.status !== 'cancelled' && (
                      <button className="btn-cancel-trip" disabled={busyId === trip.id} onClick={() => handleStatus(trip.id, 'cancelled')}>
                        {busyId === trip.id ? 'Cancelling…' : 'Cancel'}
                      </button>
                    )}
                    {onViewTripMap && (
                      <button className="btn-primary" onClick={() => onViewTripMap(trip.id)}>
                        View Map
                      </button>
                    )}
                    <button className="btn-delete" onClick={() => handleDelete(trip.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
