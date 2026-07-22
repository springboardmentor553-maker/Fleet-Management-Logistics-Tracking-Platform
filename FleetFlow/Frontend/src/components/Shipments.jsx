import { useEffect, useState } from 'react'
import {
  getShipments, getMyShipments, createShipment, updateShipment,
  deleteShipment, assignShipment, cancelShipment, markShipmentDelivered,
} from '../api/shipments'
import { getRouteEstimate } from '../api/route'
import { getDrivers }  from '../api/drivers'
import { getVehicles } from '../api/vehicles'

const STATUS_COLORS = {
  pending:    'pending',
  in_transit: 'in-transit',
  delivered:  'delivered',
  cancelled:  'cancelled',
}

const EMPTY_FORM = { origin: '', destination: '', weight_kg: '' }
const EMPTY_ASSIGN = { driver_id: '', vehicle_id: '' }

export default function Shipments({ user, onViewTripMap }) {
  const [shipments, setShipments] = useState([])
  const [drivers,   setDrivers]   = useState([])
  const [vehicles,  setVehicles]  = useState([])
  const [search,    setSearch]    = useState('')
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  // Create / Edit modal
  const [modal,     setModal]     = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [formErr,   setFormErr]   = useState('')

  // Assign modal
  const [assignModal,  setAssignModal]  = useState(false)
  const [assignTarget, setAssignTarget] = useState(null)
  const [assignForm,   setAssignForm]   = useState(EMPTY_ASSIGN)
  const [assigning,    setAssigning]    = useState(false)
  const [assignErr,    setAssignErr]    = useState('')
  const [routeEstimates, setRouteEstimates] = useState({})

  const isDriver = user?.role === 'driver'

  function load() {
    setLoading(true)
    setError('')

    if (isDriver) {
      Promise.all([
        getMyShipments().catch(() => []),
        getVehicles().catch(() => []),
      ])
        .then(([s, v]) => {
          setShipments(s || [])
          setVehicles(v || [])
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))
    } else {
      Promise.all([
        getShipments().catch(() => []),
        getDrivers().catch(() => []),
        getVehicles().catch(() => []),
      ])
        .then(([s, d, v]) => {
          setShipments(s || [])
          setDrivers(d || [])
          setVehicles(v || [])
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))
    }
  }

  useEffect(load, [isDriver])

  useEffect(() => {
    const active = shipments.filter(s => s.status !== 'delivered' && s.status !== 'cancelled')
    if (active.length === 0) {
      setRouteEstimates({})
      return
    }

    Promise.all(active.map((shipment) =>
      getRouteEstimate(shipment.id)
        .then((estimate) => [shipment.id, estimate])
        .catch(() => [shipment.id, null])
    ))
    .then((pairs) => {
      const validPairs = pairs.filter(([_, est]) => est != null)
      setRouteEstimates(Object.fromEntries(validPairs))
    })
    .catch(() => setRouteEstimates({}))
  }, [shipments])

  // ── CRUD helpers ──────────────────────────────────
  function openCreate() {
    setEditing(null); setForm(EMPTY_FORM); setFormErr(''); setModal(true)
  }
  function openEdit(s) {
    setEditing(s)
    setForm({ origin: s.origin, destination: s.destination, weight_kg: s.weight_kg })
    setFormErr(''); setModal(true)
  }
  async function handleSave() {
    if (!form.origin.trim() || !form.destination.trim() || !form.weight_kg) {
      setFormErr('All fields are required.'); return
    }
    setSaving(true); setFormErr('')
    try {
      const payload = { ...form, weight_kg: parseFloat(form.weight_kg) }
      editing ? await updateShipment(editing.id, payload) : await createShipment(payload)
      setModal(false); load()
    } catch (e) { setFormErr(e.message) }
    finally { setSaving(false) }
  }
  async function handleDelete(id) {
    if (!confirm('Delete this shipment?')) return
    try { await deleteShipment(id); load() }
    catch (e) { alert(e.message) }
  }
  async function handleCancel(id) {
    if (!confirm('Cancel this shipment?')) return
    try { await cancelShipment(id); load() }
    catch (e) { alert(e.message) }
  }
  async function handleMarkDelivered(id) {
    if (!confirm('Mark this shipment as delivered?')) return
    try { await markShipmentDelivered(id); load() }
    catch (e) { alert(e.message) }
  }

  // ── Assign helpers ────────────────────────────────
  function openAssign(s) {
    setAssignTarget(s)
    setAssignForm({ driver_id: s.driver_id || '', vehicle_id: s.vehicle_id || '' })
    setAssignErr(''); setAssignModal(true)
  }
  async function handleAssign() {
    if (!assignForm.driver_id || !assignForm.vehicle_id) {
      setAssignErr('Select both driver and vehicle.'); return
    }
    setAssigning(true); setAssignErr('')
    try {
      await assignShipment(assignTarget.id, {
        driver_id:  parseInt(assignForm.driver_id),
        vehicle_id: parseInt(assignForm.vehicle_id),
      })
      setAssignModal(false); load()
    } catch (e) { setAssignErr(e.message) }
    finally { setAssigning(false) }
  }

  // ── Filter ────────────────────────────────────────
  const filtered = shipments.filter(s =>
    (s.origin || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.destination || '').toLowerCase().includes(search.toLowerCase())
  )

  const availableDrivers  = drivers.filter(d => d.is_available)
  const availableVehicles = vehicles.filter(v => v.current_status === 'available')

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>{isDriver ? 'My Assigned Shipments' : 'Shipments'}</h2>
          <p>{isDriver ? 'Track and update your assigned deliveries' : 'Manage and track all shipments'}</p>
        </div>
        {!isDriver && (
          <button className="btn-primary" onClick={openCreate}>+ New Shipment</button>
        )}
      </div>

      <div className="search-bar">
        <input
          placeholder="🔍  Search by origin or destination…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading && <div className="status-msg">Loading shipments...</div>}
      {error   && <div className="status-msg error">{error}</div>}

      {!loading && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Weight</th>
                <th>Status</th>
                {!isDriver && <th>Driver</th>}
                <th>Vehicle</th>
                <th>ETA</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={isDriver ? 8 : 9} className="empty-row">
                    {isDriver ? 'No shipments currently assigned to you.' : 'No shipments found'}
                  </td>
                </tr>
              )}
              {filtered.map(s => {
                const driver  = drivers.find(d => d.id === s.driver_id)
                const vehicle = vehicles.find(v => v.id === s.vehicle_id)
                return (
                  <tr key={s.id}>
                    <td className="id-cell">#{s.id}</td>
                    <td>{s.origin}</td>
                    <td>{s.destination}</td>
                    <td>{s.weight_kg} kg</td>
                    <td>
                      <span className={`status-badge ${STATUS_COLORS[s.status] || ''}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    {!isDriver && (
                      <td>
                        {driver
                          ? <span className="driver-chip">👤 {driver.name}</span>
                          : <span className="unassigned">—</span>}
                      </td>
                    )}
                    <td>
                      {vehicle
                        ? <span className="plate-badge">{vehicle.plate_number}</span>
                        : <span className="unassigned">—</span>}
                    </td>
                    <td>
                      {routeEstimates[s.id]
                        ? `${routeEstimates[s.id].estimated_duration_min} min`
                        : '—'}
                    </td>
                    <td>
                      <div className="actions">
                        {isDriver ? (
                          <>
                            {s.status === 'in_transit' && (
                              <>
                                <button className="btn-assign" onClick={() => handleMarkDelivered(s.id)}>
                                  ✓ Mark Delivered
                                </button>
                                {onViewTripMap && (
                                  <button className="btn-edit" onClick={() => onViewTripMap(s.id)}>
                                    🗺️ Map
                                  </button>
                                )}
                              </>
                            )}
                            {s.status === 'delivered' && (
                              <span className="status-badge delivered">Delivered</span>
                            )}
                          </>
                        ) : (
                          <>
                            {s.status === 'pending' && (
                              <>
                                <button className="btn-assign" onClick={() => openAssign(s)}>Assign</button>
                                <button className="btn-edit"   onClick={() => openEdit(s)}>Edit</button>
                                <button className="btn-cancel-trip" onClick={() => handleCancel(s.id)}>Cancel</button>
                              </>
                            )}
                            {s.status === 'in_transit' && (
                              <button className="btn-cancel-trip" onClick={() => handleCancel(s.id)}>Cancel</button>
                            )}
                            {(s.status === 'delivered' || s.status === 'cancelled') && (
                              <button className="btn-delete" onClick={() => handleDelete(s.id)}>Delete</button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Shipment' : 'New Shipment'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-form">
              <div className="field">
                <label>Origin</label>
                <input value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} placeholder="e.g. Chennai" />
              </div>
              <div className="field">
                <label>Destination</label>
                <input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="e.g. Mumbai" />
              </div>
              <div className="field">
                <label>Weight (kg)</label>
                <input type="number" min="0.1" step="0.1" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} placeholder="e.g. 500" />
              </div>
              {formErr && <p className="form-error">{formErr}</p>}
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Modal ── */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Shipment #{assignTarget?.id}</h3>
              <button className="modal-close" onClick={() => setAssignModal(false)}>✕</button>
            </div>
            <div className="modal-form">
              <div className="assign-route">
                <span className="route-point">📍 {assignTarget?.origin}</span>
                <span className="route-arrow">→</span>
                <span className="route-point">🏁 {assignTarget?.destination}</span>
              </div>
              <div className="field">
                <label>Driver (available only)</label>
                <select value={assignForm.driver_id} onChange={e => setAssignForm(f => ({ ...f, driver_id: e.target.value }))}>
                  <option value="">— Select Driver —</option>
                  {availableDrivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} · {d.phone}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Vehicle (available only)</label>
                <select value={assignForm.vehicle_id} onChange={e => setAssignForm(f => ({ ...f, vehicle_id: e.target.value }))}>
                  <option value="">— Select Vehicle —</option>
                  {availableVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate_number} · {v.vehicle_type} · {v.model}</option>
                  ))}
                </select>
              </div>
              {assignErr && <p className="form-error">{assignErr}</p>}
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setAssignModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleAssign} disabled={assigning}>
                  {assigning ? 'Assigning…' : 'Assign Shipment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
