import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import StatusBadge from '../components/StatusBadge'
import { tripApi, shipmentApi, driverApi, vehicleApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const TRIP_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

const EMPTY_FORM = {
  shipment_id: '', driver_id: '', vehicle_id: '',
  pickup_location: '', destination: '',
  scheduled_start_time: '', scheduled_end_time: '',
}

export default function Trips() {
  const { canManage } = useAuth()
  const navigate = useNavigate()
  const [trips,     setTrips]     = useState([])
  const [shipments, setShipments] = useState([])
  const [drivers,   setDrivers]   = useState([])
  const [vehicles,  setVehicles]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]    = useState('')
  const [expanded,   setExpanded] = useState(null)  // trip_id with expanded route info
  const [routeInfo,  setRouteInfo] = useState({})   // { tripId: routeData }
  const [etaInfo,    setEtaInfo]  = useState({})    // { tripId: etaData }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [t, s, d, v] = await Promise.all([
        tripApi.list(), shipmentApi.list(), driverApi.list(), vehicleApi.list(),
      ])
      setTrips(t.data)
      setShipments(s.data)
      setDrivers(d.data)
      setVehicles(v.data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e) {
    e.preventDefault()
    setSubmitting(true); setError('')
    try {
      const body = {
        ...form,
        shipment_id: parseInt(form.shipment_id),
        driver_id:   parseInt(form.driver_id),
        vehicle_id:  parseInt(form.vehicle_id),
      }
      await tripApi.create(body)
      setShowForm(false); setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Creation failed')
    }
    setSubmitting(false)
  }

  async function toggleExpand(tripId) {
    if (expanded === tripId) { setExpanded(null); return }
    setExpanded(tripId)
    // Fetch route + ETA if not cached
    if (!routeInfo[tripId]) {
      try {
        const r = await tripApi.route(tripId)
        setRouteInfo(p => ({ ...p, [tripId]: r.data }))
      } catch {}
    }
    if (!etaInfo[tripId]) {
      try {
        const e = await tripApi.eta(tripId)
        setEtaInfo(p => ({ ...p, [tripId]: e.data }))
      } catch {}
    }
  }

  const shipmentMap = Object.fromEntries(shipments.map(s => [s.id, s]))

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="top-bar">
          <div>
            <div className="top-bar-title">Trips</div>
            <div className="top-bar-subtitle">{trips.length} scheduled / active trips</div>
          </div>
          {canManage && (
            <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
              {showForm ? '✕ Cancel' : '+ Schedule Trip'}
            </button>
          )}
        </header>

        <main className="page-content">
          {/* ── Create form ── */}
          {showForm && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div className="card-title">Schedule New Trip</div>
              </div>
              <form onSubmit={handleCreate} style={{ padding: '0 24px 20px' }}>
                {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Shipment *</label>
                    <select className="form-input" value={form.shipment_id} required
                      onChange={e => {
                        const s = shipments.find(s => s.id === parseInt(e.target.value))
                        setForm(p => ({
                          ...p, shipment_id: e.target.value,
                          pickup_location: s?.pickup_location || '',
                          destination: s?.delivery_location || '',
                        }))
                      }}>
                      <option value="">Select shipment…</option>
                      {shipments.filter(s => !['DELIVERED','CANCELLED'].includes(s.status)).map(s =>
                        <option key={s.id} value={s.id}>
                          {s.tracking_number} — {s.sender_name} → {s.receiver_name}
                        </option>
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Driver *</label>
                    <select className="form-input" value={form.driver_id} required
                      onChange={e => setForm(p => ({ ...p, driver_id: e.target.value }))}>
                      <option value="">Select driver…</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>Driver #{d.id}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicle *</label>
                    <select className="form-input" value={form.vehicle_id} required
                      onChange={e => setForm(p => ({ ...p, vehicle_id: e.target.value }))}>
                      <option value="">Select vehicle…</option>
                      {vehicles.filter(v => v.current_status === 'AVAILABLE').map(v =>
                        <option key={v.id} value={v.id}>{v.registration_number} ({v.vehicle_type})</option>
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pickup Location *</label>
                    <input className="form-input" required value={form.pickup_location}
                      placeholder="City, State"
                      onChange={e => setForm(p => ({ ...p, pickup_location: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination *</label>
                    <input className="form-input" required value={form.destination}
                      placeholder="City, State"
                      onChange={e => setForm(p => ({ ...p, destination: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Scheduled Start *</label>
                    <input className="form-input" type="datetime-local" required
                      value={form.scheduled_start_time}
                      onChange={e => setForm(p => ({ ...p, scheduled_start_time: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Scheduled End *</label>
                    <input className="form-input" type="datetime-local" required
                      value={form.scheduled_end_time}
                      onChange={e => setForm(p => ({ ...p, scheduled_end_time: e.target.value }))} />
                  </div>
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Scheduling…' : 'Schedule Trip'}
                  </button>
                  <button type="button" className="btn btn-outline"
                    onClick={() => { setShowForm(false); setError('') }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* ── Trip cards ── */}
          {loading ? (
            <div className="card">
              <div style={{ padding: 24 }}>
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
              </div>
            </div>
          ) : trips.length === 0 ? (
            <div className="card">
              <div className="table-empty">
                <div className="table-empty-icon">🗺️</div>
                <p>No trips scheduled yet.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {trips.map(trip => {
                const shipment = shipmentMap[trip.shipment_id]
                const route = routeInfo[trip.id]
                const eta   = etaInfo[trip.id]
                const isOpen = expanded === trip.id
                return (
                  <div key={trip.id} className="card" style={{ overflow: 'visible' }}>
                    <div
                      style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
                      onClick={() => toggleExpand(trip.id)}
                    >
                      <div style={{
                        width: 42, height: 42, borderRadius: 10,
                        background: 'var(--surface-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, flexShrink: 0,
                      }}>🚛</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          Trip #{trip.id} — {trip.pickup_location} → {trip.destination}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {shipment ? `📦 ${shipment.tracking_number} · ${shipment.sender_name} → ${shipment.receiver_name}` : '—'}
                        </div>
                      </div>
                      <StatusBadge status={trip.status} />
                      <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                          onClick={e => { e.stopPropagation(); navigate(`/tracking/${trip.id}`) }}
                          title="Live Track"
                        >📡 Live</button>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: 4 }}>
                          {isOpen ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>

                    {/* Expanded route info */}
                    {isOpen && (
                      <div style={{
                        borderTop: '1px solid var(--border)',
                        padding: '16px 20px',
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16,
                        background: 'rgba(255,255,255,0.01)',
                      }}>
                        <InfoBox label="Driver ID" value={`#${trip.driver_id}`} />
                        <InfoBox label="Vehicle ID" value={`#${trip.vehicle_id}`} />
                        <InfoBox label="Scheduled Start" value={trip.scheduled_start_time ? new Date(trip.scheduled_start_time).toLocaleString('en-IN') : '—'} />
                        <InfoBox label="Scheduled End"   value={trip.scheduled_end_time   ? new Date(trip.scheduled_end_time).toLocaleString('en-IN')   : '—'} />
                        {route ? (
                          <>
                            <InfoBox label="Distance"    value={route.distance} />
                            <InfoBox label="Travel Time" value={route.estimated_travel_time} />
                            <InfoBox label="Route"       value={route.route_summary || '—'} />
                          </>
                        ) : (
                          <div style={{ gridColumn: '1 / -1', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                            Loading route info…
                          </div>
                        )}
                        {eta && (
                          <InfoBox label="ETA" value={eta.estimated_arrival_time} accent />
                        )}
                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                          <InfoBox label="Pickup Coords"
                            value={trip.pickup_lat ? `${trip.pickup_lat.toFixed(4)}, ${trip.pickup_lng.toFixed(4)}` : '—'} />
                          <InfoBox label="Dest Coords"
                            value={trip.destination_lat ? `${trip.destination_lat.toFixed(4)}, ${trip.destination_lng.toFixed(4)}` : '—'} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function InfoBox({ label, value, accent }) {
  return (
    <div style={{
      background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px',
    }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: accent ? 'var(--accent)' : 'var(--text-primary)' }}>
        {value || '—'}
      </div>
    </div>
  )
}
