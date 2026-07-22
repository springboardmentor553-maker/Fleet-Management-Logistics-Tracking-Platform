import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import StatusBadge from '../components/StatusBadge'
import { shipmentApi, driverApi, vehicleApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

const STATUS_OPTIONS = [
  'CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'DELAYED', 'CANCELLED',
]

const EMPTY_FORM = {
  sender_name: '', receiver_name: '',
  pickup_location: '', delivery_location: '',
  weight: '', driver_id: '', vehicle_id: '',
}

export default function Shipments() {
  const { canManage } = useAuth()
  const navigate = useNavigate()
  const [shipments, setShipments] = useState([])
  const [drivers,   setDrivers]   = useState([])
  const [vehicles,  setVehicles]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]    = useState('')
  const [filter,     setFilter]   = useState('ALL')
  const [search,     setSearch]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, d, v] = await Promise.all([
        shipmentApi.list(), driverApi.list(), vehicleApi.list(),
      ])
      setShipments(s.data)
      setDrivers(d.data)
      setVehicles(v.data)
    } catch { }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = shipments.filter(s => {
    const matchStatus = filter === 'ALL' || s.status === filter
    const matchSearch = !search ||
      s.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.sender_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.receiver_name?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  async function handleCreate(e) {
    e.preventDefault()
    setSubmitting(true); setError('')
    try {
      const body = {
        ...form,
        weight: form.weight ? parseFloat(form.weight) : null,
        driver_id:  form.driver_id  ? parseInt(form.driver_id)  : null,
        vehicle_id: form.vehicle_id ? parseInt(form.vehicle_id) : null,
      }
      await shipmentApi.create(body)
      setShowForm(false); setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Creation failed')
    }
    setSubmitting(false)
  }

  async function changeStatus(id, status) {
    try {
      await shipmentApi.update(id, { status })
      setShipments(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    } catch (err) {
      alert(err.response?.data?.detail || 'Update failed')
    }
  }

  async function deleteShipment(id) {
    if (!confirm('Delete this shipment?')) return
    try {
      await shipmentApi.delete(id)
      setShipments(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      alert(err.response?.data?.detail || 'Delete failed')
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="top-bar">
          <div>
            <div className="top-bar-title">Shipments</div>
            <div className="top-bar-subtitle">{filtered.length} of {shipments.length} shipments</div>
          </div>
          {canManage && (
            <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
              {showForm ? '✕ Cancel' : '+ New Shipment'}
            </button>
          )}
        </header>

        <main className="page-content">
          {/* ── Create form ── */}
          {showForm && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div className="card-title">Create New Shipment</div>
              </div>
              <form onSubmit={handleCreate} style={{ padding: '0 24px 20px' }}>
                {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
                <div className="form-grid">
                  <FormField label="Sender Name *" value={form.sender_name}
                    onChange={v => setForm(p => ({ ...p, sender_name: v }))} required />
                  <FormField label="Receiver Name *" value={form.receiver_name}
                    onChange={v => setForm(p => ({ ...p, receiver_name: v }))} required />
                  <FormField label="Pickup Location *" value={form.pickup_location}
                    onChange={v => setForm(p => ({ ...p, pickup_location: v }))} required />
                  <FormField label="Delivery Location *" value={form.delivery_location}
                    onChange={v => setForm(p => ({ ...p, delivery_location: v }))} required />
                  <FormField label="Weight (kg)" value={form.weight} type="number"
                    onChange={v => setForm(p => ({ ...p, weight: v }))} />
                  <div className="form-group">
                    <label className="form-label">Assign Driver</label>
                    <select className="form-input" value={form.driver_id}
                      onChange={e => setForm(p => ({ ...p, driver_id: e.target.value }))}>
                      <option value="">— Unassigned —</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>Driver #{d.id}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign Vehicle</label>
                    <select className="form-input" value={form.vehicle_id}
                      onChange={e => setForm(p => ({ ...p, vehicle_id: e.target.value }))}>
                      <option value="">— Unassigned —</option>
                      {vehicles.filter(v => v.current_status === 'AVAILABLE').map(v =>
                        <option key={v.id} value={v.id}>{v.registration_number}</option>
                      )}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Creating…' : 'Create Shipment'}
                  </button>
                  <button type="button" className="btn btn-outline"
                    onClick={() => { setShowForm(false); setError('') }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* ── Filters ── */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['ALL', ...STATUS_OPTIONS].map(s => (
                  <button key={s}
                    className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setFilter(s)}
                    style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}>
                    {s}
                  </button>
                ))}
              </div>
              <input
                className="form-input" placeholder="Search by number / name…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: 220, marginLeft: 'auto' }}
              />
            </div>

            {/* ── Table ── */}
            <div className="table-wrapper">
              {loading ? (
                <div style={{ padding: 24 }}>
                  {[...Array(5)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="table-empty">
                  <div className="table-empty-icon">📦</div>
                  <p>{search || filter !== 'ALL' ? 'No matching shipments.' : 'No shipments yet. Create one above.'}</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Tracking #</th>
                      <th>Sender</th>
                      <th>Receiver</th>
                      <th>Route</th>
                      <th>Weight</th>
                      <th>Status</th>
                      {canManage && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => (
                      <tr key={s.id}>
                        <td><strong style={{ color: 'var(--accent)' }}>{s.tracking_number}</strong></td>
                        <td>{s.sender_name}</td>
                        <td>{s.receiver_name}</td>
                        <td style={{ fontSize: '0.78rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{s.pickup_location}</span>
                          <span style={{ margin: '0 4px' }}>→</span>
                          {s.delivery_location}
                        </td>
                        <td>{s.weight ? `${s.weight} kg` : '—'}</td>
                        <td><StatusBadge status={s.status} /></td>
                        {canManage && (
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <select
                                className="form-input"
                                value={s.status}
                                onChange={e => changeStatus(s.id, e.target.value)}
                                style={{ width: 160, fontSize: '0.75rem', padding: '4px 8px' }}>
                                {STATUS_OPTIONS.map(opt =>
                                  <option key={opt} value={opt}>{opt}</option>
                                )}
                              </select>
                              <button
                                className="btn btn-sm btn-outline"
                                style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                                onClick={() => navigate(`/tracking/${s.trip_id || ''}`)}
                                title="Live Track"
                              >📡</button>
                              <button
                                className="btn btn-sm btn-outline"
                                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                onClick={() => deleteShipment(s.id)}
                              >✕</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function FormField({ label, value, onChange, required, type = 'text' }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input" type={type} value={value} required={required}
        onChange={e => onChange(e.target.value)}
        placeholder={label.replace(' *', '')}
      />
    </div>
  )
}
