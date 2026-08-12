import { useEffect, useState } from 'react'
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getDriverPerformance,
  getOperationalAnalytics,
} from '../api/driver_assignment'
import { getDrivers } from '../api/drivers'
import { getVehicles } from '../api/vehicles'

const EMPTY_FORM = {
  driver_id: '',
  vehicle_id: '',
  trip_id: '',
  remarks: '',
}

function StatusBadge({ status }) {
  // Map DB values → CSS class names
  const cls = {
    assigned:  'assigned',
    completed: 'completed',
    cancelled: 'cancelled',
  }[status?.toLowerCase()] || 'pending'

  return <span className={`status-badge ${cls}`}>{status}</span>
}

export default function DriverAssignment() {
  const [assignments, setAssignments] = useState([])
  const [drivers, setDrivers]         = useState([])
  const [vehicles, setVehicles]       = useState([])
  const [analytics, setAnalytics]     = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  // ADD Modal
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [formErr, setFormErr]     = useState('')
  const [saving, setSaving]       = useState(false)

  // STATUS UPDATE Modal
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusTarget, setStatusTarget]       = useState(null)
  const [newStatus, setNewStatus]             = useState('Completed')
  const [statusRemarks, setStatusRemarks]     = useState('')

  // PERFORMANCE Panel
  const [perfDriverId, setPerfDriverId] = useState('')
  const [perfData, setPerfData]         = useState(null)
  const [perfLoading, setPerfLoading]   = useState(false)
  const [perfError, setPerfError]       = useState('')

  // ── DATA LOAD ──────────────────────────────────────────────────────────
  function loadData() {
    setLoading(true)
    Promise.all([
      getAssignments().catch(() => []),
      getDrivers().catch(() => []),
      getVehicles().catch(() => []),
      getOperationalAnalytics().catch(() => null),
    ])
      .then(([aList, dList, vList, ops]) => {
        setAssignments(aList || [])
        setDrivers(dList || [])
        setVehicles(vList || [])
        setAnalytics(ops)
        setError('')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadData, [])

  // ── HELPERS ───────────────────────────────────────────────────────────
  const driverName   = (id) => drivers.find((d) => d.id === id)?.name  || `Driver #${id}`
  const vehiclePlate = (id) => vehicles.find((v) => v.id === id)?.plate_number || `Vehicle #${id}`
  const availableDrivers  = drivers.filter((d) => d.is_available)
  const availableVehicles = vehicles.filter((v) => v.current_status === 'available')

  // ── CREATE ─────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    setFormErr('')
    if (!form.driver_id)  { setFormErr('Please select a driver');  return }
    if (!form.vehicle_id) { setFormErr('Please select a vehicle'); return }
    setSaving(true)
    try {
      await createAssignment({
        driver_id:  parseInt(form.driver_id),
        vehicle_id: parseInt(form.vehicle_id),
        trip_id:    form.trip_id ? parseInt(form.trip_id) : null,
        remarks:    form.remarks || null,
      })
      setShowModal(false)
      setForm(EMPTY_FORM)
      loadData()
    } catch (err) {
      setFormErr(err.message || 'Failed to create assignment')
    } finally {
      setSaving(false)
    }
  }

  // ── STATUS UPDATE ──────────────────────────────────────────────────────
  function openStatusModal(a) {
    setStatusTarget(a)
    setNewStatus('Completed')
    setStatusRemarks(a.remarks || '')
    setShowStatusModal(true)
  }

  async function handleStatusUpdate(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateAssignment(statusTarget.id, {
        assignment_status: newStatus,
        remarks: statusRemarks || null,
      })
      setShowStatusModal(false)
      setStatusTarget(null)
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  // ── DELETE ─────────────────────────────────────────────────────────────
  async function handleDelete(id) {
    if (!confirm('Remove this assignment? The driver and vehicle will be freed.')) return
    try {
      await deleteAssignment(id)
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to remove assignment')
    }
  }

  // ── PERFORMANCE ────────────────────────────────────────────────────────
  async function fetchPerformance() {
    if (!perfDriverId) { setPerfError('Please select a driver'); return }
    setPerfLoading(true)
    setPerfData(null)
    setPerfError('')
    try {
      setPerfData(await getDriverPerformance(parseInt(perfDriverId)))
    } catch (err) {
      setPerfError(err.message || 'Failed to fetch performance')
    } finally {
      setPerfLoading(false)
    }
  }

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div className="page-content">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h2>Driver Assignment Center</h2>
          <p>Assign drivers to vehicles, monitor active assignments, and track performance metrics</p>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => { setForm(EMPTY_FORM); setFormErr(''); setShowModal(true) }}>
            + New Assignment
          </button>
        </div>
      </div>

      {loading && <div className="status-msg">Loading assignment data...</div>}
      {error   && <div className="status-msg error">{error}</div>}

      {/* OPERATIONAL ANALYTICS CARDS */}
      {!loading && analytics && (
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          {[
            { icon: '📦', label: 'Total Deliveries',      value: analytics.total_deliveries,      color: '#6366f1' },
            { icon: '✅', label: 'Successful Deliveries', value: analytics.successful_deliveries,  color: '#10b981' },
            { icon: '⏳', label: 'Delayed Deliveries',    value: analytics.delayed_deliveries,     color: '#f59e0b' },
            { icon: '❌', label: 'Cancelled Deliveries',  value: analytics.cancelled_deliveries,   color: '#ef4444' },
            { icon: '🗺️', label: 'Avg Trip Distance',     value: `${analytics.average_trip_distance} km`, color: '#0ea5e9' },
            { icon: '⏱️', label: 'Avg Delivery Time',     value: `${analytics.average_delivery_time} hrs`, color: '#8b5cf6' },
          ].map((s) => (
            <div className="stat-card" key={s.label} style={{ '--card-color': s.color }}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-info">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QUICK STATS STRIP */}
      {!loading && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Assignments',  value: assignments.length,                                                      color: '#6366f1' },
            { label: 'Active (Assigned)',  value: assignments.filter((a) => a.assignment_status === 'Assigned').length,    color: '#f59e0b' },
            { label: 'Completed',          value: assignments.filter((a) => a.assignment_status === 'Completed').length,   color: '#10b981' },
            { label: 'Cancelled',          value: assignments.filter((a) => a.assignment_status === 'Cancelled').length,   color: '#ef4444' },
            { label: 'Available Drivers',  value: availableDrivers.length,                                                 color: '#06b6d4' },
            { label: 'Available Vehicles', value: availableVehicles.length,                                                color: '#84cc16' },
          ].map((s) => (
            <div className="quick-stat" key={s.label}>
              <span className="quick-stat-value" style={{ color: s.color }}>{s.value}</span>
              <span className="quick-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ASSIGNMENTS TABLE */}
      {!loading && (
        <div className="table-wrap" style={{ marginBottom: 32 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Trip ID</th>
                <th>Status</th>
                <th>Assigned On</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-row">
                    No assignments yet — click "+ New Assignment" to create one.
                  </td>
                </tr>
              )}
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td className="id-cell">#{a.id}</td>
                  <td>
                    <div className="driver-name">
                      <span className="avatar">{driverName(a.driver_id).charAt(0).toUpperCase()}</span>
                      <span>{driverName(a.driver_id)}</span>
                    </div>
                  </td>
                  <td><span className="plate-badge">🚛 {vehiclePlate(a.vehicle_id)}</span></td>
                  <td>
                    {a.trip_id
                      ? <span className="type-badge">#{a.trip_id}</span>
                      : <span className="unassigned">—</span>}
                  </td>
                  <td><StatusBadge status={a.assignment_status} /></td>
                  <td>
                    {a.assignment_date
                      ? new Date(a.assignment_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                      : '—'}
                  </td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#94a3b8', fontSize: 13 }}>
                    {a.remarks || <span className="unassigned">—</span>}
                  </td>
                  <td className="actions">
                    {a.assignment_status === 'Assigned' && (
                      <button className="btn-edit" onClick={() => openStatusModal(a)}>Update</button>
                    )}
                    <button className="btn-delete" onClick={() => handleDelete(a.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DRIVER PERFORMANCE PANEL */}
      <div className="perf-panel" style={{ marginBottom: 24 }}>
        <h3>🏆 Driver Performance Lookup</h3>
        <p>View trip statistics for any driver — total, completed, active, and cancelled trips.</p>

        <div className="perf-lookup-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', maxWidth: '100%' }}>
          <div className="field perf-select-field" style={{ flex: '1 1 200px', margin: 0, minWidth: 0, maxWidth: '100%' }}>
            <label>Select Driver</label>
            <select
              value={perfDriverId}
              onChange={(e) => { setPerfDriverId(e.target.value); setPerfData(null); setPerfError('') }}
              style={{ width: '100%', maxWidth: '100%', textOverflow: 'ellipsis' }}
            >
              <option value="">-- Choose Driver --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>👤 {d.name} ({d.email})</option>
              ))}
            </select>
          </div>
          <button
            className="btn-primary perf-view-btn"
            style={{ height: 42, paddingTop: 0, paddingBottom: 0 }}
            onClick={fetchPerformance}
            disabled={perfLoading}
          >
            {perfLoading ? 'Loading...' : 'View Performance'}
          </button>
        </div>

        {perfError && <p className="form-error" style={{ marginTop: 10 }}>{perfError}</p>}

        {perfData && (
          <div className="perf-stat-grid">
            {[
              { icon: '🛣️', label: 'Total Trips',    value: perfData.total_trips,     color: '#6366f1' },
              { icon: '✅', label: 'Completed',      value: perfData.completed_trips,  color: '#10b981' },
              { icon: '⚡', label: 'Active',         value: perfData.active_trips,     color: '#f59e0b' },
              { icon: '❌', label: 'Cancelled',      value: perfData.cancelled_trips,  color: '#ef4444' },
            ].map((s) => (
              <div className="perf-stat-box" key={s.label} style={{ borderColor: `${s.color}33` }}>
                <div className="icon">{s.icon}</div>
                <div className="value" style={{ color: s.color }}>{s.value}</div>
                <div className="label">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ADD ASSIGNMENT MODAL ──────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Driver Assignment</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="field">
                <label>
                  Select Driver *&nbsp;
                  <span style={{ color: '#10b981', fontSize: 12 }}>({availableDrivers.length} available)</span>
                </label>
                <select name="driver_id" value={form.driver_id} onChange={(e) => setForm((p) => ({ ...p, driver_id: e.target.value }))} required>
                  <option value="">-- Choose Available Driver --</option>
                  {availableDrivers.map((d) => (
                    <option key={d.id} value={d.id}>👤 {d.name} — {d.license_number}</option>
                  ))}
                </select>
                {availableDrivers.length === 0 && (
                  <p style={{ color: '#f59e0b', fontSize: 12, margin: '4px 0 0' }}>⚠️ All drivers are currently on assignment</p>
                )}
              </div>

              <div className="field">
                <label>
                  Select Vehicle *&nbsp;
                  <span style={{ color: '#10b981', fontSize: 12 }}>({availableVehicles.length} available)</span>
                </label>
                <select name="vehicle_id" value={form.vehicle_id} onChange={(e) => setForm((p) => ({ ...p, vehicle_id: e.target.value }))} required>
                  <option value="">-- Choose Available Vehicle --</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>🚛 {v.plate_number} — {v.model || v.brand || 'Vehicle'}</option>
                  ))}
                </select>
                {availableVehicles.length === 0 && (
                  <p style={{ color: '#f59e0b', fontSize: 12, margin: '4px 0 0' }}>⚠️ All vehicles are currently in use</p>
                )}
              </div>

              <div className="field">
                <label>
                  Trip ID&nbsp;
                  <span style={{ color: '#64748b', fontSize: 12 }}>(Optional — assign before trip is created)</span>
                </label>
                <input
                  type="number" min="1"
                  value={form.trip_id}
                  onChange={(e) => setForm((p) => ({ ...p, trip_id: e.target.value }))}
                  placeholder="Leave blank if no trip yet"
                />
              </div>

              <div className="field">
                <label>Remarks</label>
                <textarea
                  rows={2}
                  value={form.remarks}
                  onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
                  placeholder="Optional assignment notes..."
                />
              </div>

              {formErr && <p className="form-error">{formErr}</p>}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Assigning...' : 'Assign Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── UPDATE STATUS MODAL ───────────────────────────────── */}
      {showStatusModal && statusTarget && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Assignment #{statusTarget.id}</h3>
              <button className="modal-close" onClick={() => setShowStatusModal(false)}>✕</button>
            </div>

            <form onSubmit={handleStatusUpdate} className="modal-form">
              <div className="assign-info-strip">
                <span><strong>Driver:</strong> {driverName(statusTarget.driver_id)}</span>
                <span><strong>Vehicle:</strong> {vehiclePlate(statusTarget.vehicle_id)}</span>
                {statusTarget.trip_id && <span><strong>Trip:</strong> #{statusTarget.trip_id}</span>}
              </div>

              <div className="field">
                <label>New Status *</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} required>
                  <option value="Completed">✅ Completed — Frees driver &amp; vehicle</option>
                  <option value="Cancelled">❌ Cancelled — Frees driver &amp; vehicle</option>
                </select>
                <p style={{ color: '#10b981', fontSize: 12, margin: '6px 0 0' }}>
                  ✔ Driver and vehicle will be marked as Available automatically.
                </p>
              </div>

              <div className="field">
                <label>Remarks</label>
                <textarea
                  rows={2}
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  placeholder="Optional notes about this status change..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowStatusModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Updating...' : `Mark as ${newStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
