import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import StatusBadge from '../components/StatusBadge'
import { assignmentApi, driverApi, vehicleApi, tripApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

const STATUS_OPTIONS = ['ACTIVE', 'COMPLETED', 'CANCELLED']

export default function DriverAssignments() {
  const { canManage } = useAuth()
  const [assignments, setAssignments]   = useState([])
  const [drivers, setDrivers]           = useState([])
  const [vehicles, setVehicles]         = useState([])
  const [trips, setTrips]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [modal, setModal]               = useState(null)   // null | 'create' | assignment-obj
  const [filterStatus, setFilterStatus] = useState('')
  const [savingId, setSavingId]         = useState(null)
  const [toast, setToast]               = useState(null)

  // Form state
  const [form, setForm] = useState({ driver_id: '', vehicle_id: '', trip_id: '', remarks: '' })
  const [formErr, setFormErr] = useState('')
  const [saving, setSaving]   = useState(false)

  // ── Load ────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      const [asgns, drvs, vehs, trps] = await Promise.all([
        assignmentApi.list(params),
        driverApi.list(),
        vehicleApi.list(),
        tripApi.list(),
      ])
      setAssignments(asgns.data)
      setDrivers(drvs.data)
      setVehicles(vehs.data)
      setTrips(trps.data)
    } catch {}
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { load() }, [load])

  // ── Helpers ─────────────────────────────────────────────────
  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function driverLabel(id) {
    const d = drivers.find(x => x.id === Number(id))
    return d ? `#${d.id} — ${d.license_details}` : `Driver #${id}`
  }
  function vehicleLabel(id) {
    const v = vehicles.find(x => x.id === Number(id))
    return v ? `${v.registration_number} (${v.vehicle_type})` : `Vehicle #${id}`
  }
  function tripLabel(id) {
    if (!id) return '—'
    const t = trips.find(x => x.id === Number(id))
    return t ? `#${t.id} ${t.pickup_location} → ${t.destination}` : `Trip #${id}`
  }

  // ── Create ──────────────────────────────────────────────────
  function openCreate() {
    setForm({ driver_id: '', vehicle_id: '', trip_id: '', remarks: '' })
    setFormErr('')
    setModal('create')
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.driver_id || !form.vehicle_id) {
      setFormErr('Driver and Vehicle are required.')
      return
    }
    setSaving(true); setFormErr('')
    try {
      await assignmentApi.create({
        driver_id:  Number(form.driver_id),
        vehicle_id: Number(form.vehicle_id),
        trip_id:    form.trip_id ? Number(form.trip_id) : null,
        remarks:    form.remarks || null,
      })
      showToast('Assignment created successfully')
      setModal(null)
      load()
    } catch (err) {
      setFormErr(err.response?.data?.detail || 'Failed to assign driver.')
    }
    setSaving(false)
  }

  // ── Status update ────────────────────────────────────────────
  async function handleStatusChange(id, newStatus) {
    setSavingId(id)
    try {
      await assignmentApi.update(id, { status: newStatus })
      showToast(`Assignment updated to ${newStatus}`)
      load()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Update failed', 'error')
    }
    setSavingId(null)
  }

  // ── Cancel ──────────────────────────────────────────────────
  async function handleCancel(id) {
    if (!window.confirm('Cancel this assignment? The driver and vehicle will be freed.')) return
    setSavingId(id)
    try {
      await assignmentApi.cancel(id)
      showToast('Assignment cancelled')
      load()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Cancel failed', 'error')
    }
    setSavingId(null)
  }

  // ── Render ───────────────────────────────────────────────────
  const availableDrivers  = drivers.filter(d => d.status === 'AVAILABLE')
  const availableVehicles = vehicles.filter(v => v.current_status === 'AVAILABLE')

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="top-bar">
          <div>
            <div className="top-bar-title">Driver Assignments</div>
            <div className="top-bar-subtitle">Assign drivers to vehicles and trips, track assignment status</div>
          </div>
        </header>

        <main className="page-content">
          {/* Page header */}
          <div className="page-header">
            <div className="page-header-left">
              <h1>Assignments</h1>
              <p>{assignments.length} total record{assignments.length !== 1 ? 's' : ''}</p>
            </div>
            {canManage && (
              <button id="new-assignment-btn" className="btn btn-primary" onClick={openCreate}>
                <PlusIcon /> New Assignment
              </button>
            )}
          </div>

          {/* Stat mini-cards */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Active',    val: assignments.filter(a => a.status === 'ACTIVE').length,    color: '#22c55e' },
              { label: 'Completed', val: assignments.filter(a => a.status === 'COMPLETED').length, color: '#3b82f6' },
              { label: 'Cancelled', val: assignments.filter(a => a.status === 'CANCELLED').length, color: '#6b7280' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '14px 20px', minWidth: 120, flex: '1 1 120px'
              }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '14px 20px', minWidth: 120, flex: '1 1 120px'
            }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f59e0b' }}>
                {availableDrivers.length}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Available Drivers</div>
            </div>
          </div>

          {/* Filter + Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">All Assignments</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  className="form-input"
                  style={{ maxWidth: 180 }}
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn btn-outline btn-sm" onClick={load}>↺ Refresh</button>
              </div>
            </div>

            <div className="table-wrapper">
              {loading ? (
                <div style={{ padding: 24 }}>
                  {[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
                </div>
              ) : assignments.length === 0 ? (
                <div className="table-empty">
                  <div className="table-empty-icon">📋</div>
                  <p>No assignments found.</p>
                  {canManage && (
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={openCreate}>
                      Create first assignment
                    </button>
                  )}
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Driver</th>
                      <th>Vehicle</th>
                      <th>Trip</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Remarks</th>
                      {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map(a => (
                      <tr key={a.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{a.id}</td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{driverLabel(a.driver_id)}</div>
                          {a.driver_license && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              {a.driver_license}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                            {a.vehicle_registration || vehicleLabel(a.vehicle_id)}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {tripLabel(a.trip_id)}
                        </td>
                        <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                          {new Date(a.assignment_date).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td><StatusBadge status={a.status} /></td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 180 }}>
                          {a.remarks || '—'}
                        </td>
                        {canManage && (
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                              {a.status === 'ACTIVE' && (
                                <>
                                  <button
                                    className="btn btn-outline btn-sm"
                                    disabled={savingId === a.id}
                                    onClick={() => handleStatusChange(a.id, 'COMPLETED')}
                                  >
                                    {savingId === a.id ? <span className="spinner spinner-dark" /> : <CheckIcon />}
                                    Complete
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    disabled={savingId === a.id}
                                    onClick={() => handleCancel(a.id)}
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {a.status !== 'ACTIVE' && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  {a.status === 'COMPLETED' ? '✅ Done' : '🚫 Cancelled'}
                                </span>
                              )}
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

      {/* ── Create Modal ───────────────────────────────────────── */}
      {modal === 'create' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Assign Driver</div>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {formErr && (
                  <div style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                    fontSize: '0.85rem', color: '#f87171'
                  }}>
                    {formErr}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Driver *</label>
                  <select
                    className="form-input"
                    value={form.driver_id}
                    onChange={e => setForm(f => ({ ...f, driver_id: e.target.value }))}
                    required
                  >
                    <option value="">— Select driver —</option>
                    {availableDrivers.map(d => (
                      <option key={d.id} value={d.id}>
                        #{d.id} — {d.license_details}
                      </option>
                    ))}
                  </select>
                  {availableDrivers.length === 0 && (
                    <div style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: 4 }}>
                      ⚠ No available drivers right now
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Vehicle *</label>
                  <select
                    className="form-input"
                    value={form.vehicle_id}
                    onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}
                    required
                  >
                    <option value="">— Select vehicle —</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} — {v.vehicle_type}
                      </option>
                    ))}
                  </select>
                  {availableVehicles.length === 0 && (
                    <div style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: 4 }}>
                      ⚠ No available vehicles right now
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Trip (optional)</label>
                  <select
                    className="form-input"
                    value={form.trip_id}
                    onChange={e => setForm(f => ({ ...f, trip_id: e.target.value }))}
                  >
                    <option value="">— No trip linked —</option>
                    {trips.map(t => (
                      <option key={t.id} value={t.id}>
                        #{t.id} · {t.pickup_location} → {t.destination}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <input
                    className="form-input"
                    placeholder="Optional notes about this assignment…"
                    value={form.remarks}
                    onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner spinner-dark" /> : null}
                  {saving ? 'Assigning…' : 'Assign Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : '#22c55e',
          color: '#fff', borderRadius: 10, padding: '12px 20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)', fontSize: '0.88rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          {toast.type === 'error' ? '⚠ ' : '✓ '}{toast.msg}
        </div>
      )}
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────
function PlusIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
