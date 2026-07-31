import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import StatusBadge from '../components/StatusBadge'
import { attendanceApi, driverApi, performanceApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

const ATT_STATUSES = ['PRESENT', 'ABSENT', 'LEAVE']

export default function DriverAttendance() {
  const { canManage } = useAuth()
  const [tab, setTab]             = useState('attendance')  // 'attendance' | 'performance'
  const [records, setRecords]     = useState([])
  const [drivers, setDrivers]     = useState([])
  const [todaySummary, setTodaySummary] = useState(null)  // from server-side endpoint
  const [perf, setPerf]           = useState(null)
  const [perfLoading, setPerfLoading] = useState(false)
  const [perfDriverId, setPerfDriverId] = useState('')
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null)   // null | 'create' | record-obj
  const [toast, setToast]         = useState(null)
  const [saving, setSaving]       = useState(false)
  const [savingId, setSavingId]   = useState(null)

  // Filters
  const [filterDriver, setFilterDriver] = useState('')
  const [filterDate,   setFilterDate]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Form — use server date string passed back from todaySummary to avoid UTC drift
  const [form, setForm] = useState({
    driver_id: '', date: new Date().toLocaleDateString('en-CA'),  // YYYY-MM-DD in local tz
    status: 'PRESENT', check_in_time: '', check_out_time: ''
  })
  const [formErr, setFormErr] = useState('')

  // ── Load ────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterDriver) params.driver_id = filterDriver
      if (filterDate)   params.date       = filterDate
      if (filterStatus) params.status     = filterStatus
      const [att, drvs, summary] = await Promise.all([
        attendanceApi.list(params),
        driverApi.list(),
        attendanceApi.todaySummary(),
      ])
      setRecords(att.data)
      setDrivers(drvs.data)
      setTodaySummary(summary.data)
    } catch {}
    setLoading(false)
  }, [filterDriver, filterDate, filterStatus])

  useEffect(() => { if (tab === 'attendance') load() }, [load, tab])

  // ── Helpers ─────────────────────────────────────────────────
  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  function driverLabel(id) {
    const d = drivers.find(x => x.id === Number(id))
    return d ? d.license_details : `Driver #${id}`
  }

  // ── Create attendance ────────────────────────────────────────
  function openCreate() {
    setForm({
      driver_id: '', date: new Date().toISOString().slice(0, 10),
      status: 'PRESENT', check_in_time: '', check_out_time: ''
    })
    setFormErr('')
    setModal('create')
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.driver_id || !form.date || !form.status) {
      setFormErr('Driver, Date, and Status are required.')
      return
    }
    setSaving(true); setFormErr('')
    try {
      const payload = {
        driver_id: Number(form.driver_id),
        date:      form.date,
        status:    form.status,
        check_in_time:  form.check_in_time  || null,
        check_out_time: form.check_out_time || null,
      }
      await attendanceApi.create(payload)
      showToast('Attendance recorded successfully')
      setModal(null)
      load()
    } catch (err) {
      setFormErr(err.response?.data?.detail || 'Failed to save attendance.')
    }
    setSaving(false)
  }

  // ── Edit attendance ──────────────────────────────────────────
  function toLocalInputValue(isoStr) {
    // Convert UTC ISO string → "YYYY-MM-DDTHH:MM" in local time for datetime-local input
    if (!isoStr) return ''
    const d = new Date(isoStr)
    if (isNaN(d)) return ''
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  function openEdit(rec) {
    setForm({
      driver_id:      rec.driver_id,
      date:           rec.date,
      status:         rec.status,
      check_in_time:  toLocalInputValue(rec.check_in_time),
      check_out_time: toLocalInputValue(rec.check_out_time),
    })
    setFormErr('')
    setModal(rec)
  }

  async function handleUpdate(e) {
    e.preventDefault()
    setSaving(true); setFormErr('')
    try {
      // datetime-local values are already in "YYYY-MM-DDTHH:MM" format;
      // just send them as-is (the backend uses datetime.fromisoformat which handles this)
      const payload = {
        status:         form.status,
        check_in_time:  form.check_in_time  || null,
        check_out_time: form.check_out_time || null,
      }
      await attendanceApi.update(modal.id, payload)
      showToast('Attendance updated')
      setModal(null)
      load()
    } catch (err) {
      setFormErr(err.response?.data?.detail || 'Update failed.')
    }
    setSaving(false)
  }

  // ── Performance ──────────────────────────────────────────────
  async function loadPerformance() {
    if (!perfDriverId) return
    setPerfLoading(true); setPerf(null)
    try {
      const { data } = await performanceApi.get(perfDriverId)
      setPerf(data)
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to load performance', 'error')
    }
    setPerfLoading(false)
  }

  // ── Render — use server-computed today summary to avoid UTC/IST date mismatch
  const presentToday  = todaySummary?.present   ?? 0
  const absentToday   = todaySummary?.absent    ?? 0
  const leaveToday    = todaySummary?.on_leave  ?? 0
  const notMarked     = todaySummary?.not_marked ?? 0
  const serverToday   = todaySummary?.date ?? ''

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="top-bar">
          <div>
            <div className="top-bar-title">Driver Management</div>
            <div className="top-bar-subtitle">Attendance tracking and performance analytics</div>
          </div>
        </header>

        <main className="page-content">
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
            {[
              { key: 'attendance',  label: '📅 Attendance' },
              { key: 'performance', label: '📊 Performance' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '10px 20px', fontSize: '0.92rem', fontWeight: 600,
                  color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1, transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ════════ ATTENDANCE TAB ════════ */}
          {tab === 'attendance' && (
            <>
              {/* Page header */}
              <div className="page-header">
                <div className="page-header-left">
                  <h1>Attendance Records</h1>
                  <p>{records.length} total record{records.length !== 1 ? 's' : ''}</p>
                </div>
                {canManage && (
                  <button id="new-attendance-btn" className="btn btn-primary" onClick={openCreate}>
                    <PlusIcon /> Mark Attendance
                  </button>
                )}
              </div>

              {/* Today's summary — sourced from server-side /today-summary endpoint */}
              {serverToday && (
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  📅 Showing today: <strong>{serverToday}</strong>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                {[
                  { label: "Today Present",   val: presentToday,      color: '#22c55e', emoji: '✅' },
                  { label: "Today Absent",    val: absentToday,       color: '#ef4444', emoji: '❌' },
                  { label: "Today On Leave",  val: leaveToday,        color: '#f59e0b', emoji: '🏖' },
                  { label: 'Not Marked Yet',  val: notMarked,         color: '#6b7280', emoji: '⬜' },
                  { label: 'All Records',     val: records.length,    color: '#3b82f6', emoji: '📋' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '14px 20px', flex: '1 1 110px', minWidth: 110
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>
                      {s.emoji} {s.val}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Filter + Table */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">All Records</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <select
                      className="form-input"
                      style={{ maxWidth: 180 }}
                      value={filterDriver}
                      onChange={e => setFilterDriver(e.target.value)}
                    >
                      <option value="">All Drivers</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>#{d.id} — {d.license_details}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      className="form-input"
                      style={{ maxWidth: 160 }}
                      value={filterDate}
                      onChange={e => setFilterDate(e.target.value)}
                    />
                    <select
                      className="form-input"
                      style={{ maxWidth: 150 }}
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                    >
                      <option value="">All Status</option>
                      {ATT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button className="btn btn-outline btn-sm" onClick={load}>↺</button>
                  </div>
                </div>

                <div className="table-wrapper">
                  {loading ? (
                    <div style={{ padding: 24 }}>
                      {[...Array(5)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
                    </div>
                  ) : records.length === 0 ? (
                    <div className="table-empty">
                      <div className="table-empty-icon">📅</div>
                      <p>No attendance records found.</p>
                      {canManage && (
                        <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={openCreate}>
                          Mark first record
                        </button>
                      )}
                    </div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Driver</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Check-In</th>
                          <th>Check-Out</th>
                          <th>Hours</th>
                          {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {records.map(r => {
                          const cin  = r.check_in_time  ? new Date(r.check_in_time)  : null
                          const cout = r.check_out_time ? new Date(r.check_out_time) : null
                          const hrs  = cin && cout
                            ? ((cout - cin) / 3600000).toFixed(1) + ' h'
                            : '—'
                          return (
                            <tr key={r.id}>
                              <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{r.id}</td>
                              <td>
                                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                                  {driverLabel(r.driver_id)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  Driver #{r.driver_id}
                                </div>
                              </td>
                              <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', {
                                  day: '2-digit', month: 'short', year: 'numeric'
                                })}
                              </td>
                              <td><AttBadge status={r.status} /></td>
                              <td style={{ fontSize: '0.82rem' }}>
                                {cin ? cin.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                              </td>
                              <td style={{ fontSize: '0.82rem' }}>
                                {cout ? cout.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                              </td>
                              <td style={{ fontSize: '0.82rem', fontWeight: 600, color: hrs !== '—' ? 'var(--accent)' : 'var(--text-muted)' }}>
                                {hrs}
                              </td>
                              {canManage && (
                                <td style={{ textAlign: 'right' }}>
                                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(r)}>
                                    <EditIcon /> Edit
                                  </button>
                                </td>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ════════ PERFORMANCE TAB ════════ */}
          {tab === 'performance' && (
            <>
              <div className="page-header">
                <div className="page-header-left">
                  <h1>Driver Performance</h1>
                  <p>Trip completion rates and activity summary by driver</p>
                </div>
              </div>

              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                  <div className="card-title">Select a Driver</div>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <select
                    className="form-input"
                    style={{ maxWidth: 300 }}
                    value={perfDriverId}
                    onChange={e => { setPerfDriverId(e.target.value); setPerf(null) }}
                  >
                    <option value="">— Choose driver —</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        #{d.id} — {d.license_details} [{d.status}]
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary"
                    disabled={!perfDriverId || perfLoading}
                    onClick={loadPerformance}
                  >
                    {perfLoading ? <span className="spinner spinner-dark" /> : <BarIcon />}
                    {perfLoading ? 'Loading…' : 'View Performance'}
                  </button>
                </div>
              </div>

              {perf && (
                <>
                  {/* KPI cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
                    {[
                      { label: 'Total Trips',      val: perf.total_trips,      color: '#3b82f6', emoji: '🚚' },
                      { label: 'Completed',        val: perf.completed_trips,  color: '#22c55e', emoji: '✅' },
                      { label: 'Active',           val: perf.active_trips,     color: '#f59e0b', emoji: '⚡' },
                      { label: 'Cancelled',        val: perf.cancelled_trips,  color: '#ef4444', emoji: '❌' },
                    ].map(k => (
                      <div key={k.label} style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 14, padding: '20px 24px'
                      }}>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: k.color }}>
                          {k.emoji} {k.val}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          {k.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Completion rate gauge */}
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">
                        Completion Rate — Driver #{perf.driver_id}
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22c55e' }}>
                        {perf.completion_rate}%
                      </div>
                    </div>
                    <div style={{ padding: '16px 20px 24px' }}>
                      {/* Progress bar */}
                      <div style={{
                        background: 'var(--bg-table-head)', borderRadius: 999,
                        height: 14, overflow: 'hidden', marginBottom: 16
                      }}>
                        <div style={{
                          width: `${perf.completion_rate}%`,
                          background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                          height: '100%', borderRadius: 999,
                          transition: 'width 0.8s cubic-bezier(.4,0,.2,1)'
                        }} />
                      </div>

                      {/* Mini breakdown bar */}
                      {perf.total_trips > 0 && (
                        <div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                            Trip breakdown
                          </div>
                          <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', gap: 2 }}>
                            {perf.completed_trips > 0 && (
                              <div style={{ flex: perf.completed_trips, background: '#22c55e', title: 'Completed' }} />
                            )}
                            {perf.active_trips > 0 && (
                              <div style={{ flex: perf.active_trips, background: '#f59e0b' }} />
                            )}
                            {perf.cancelled_trips > 0 && (
                              <div style={{ flex: perf.cancelled_trips, background: '#ef4444' }} />
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            <span><span style={{ color: '#22c55e' }}>■</span> Completed</span>
                            <span><span style={{ color: '#f59e0b' }}>■</span> Active</span>
                            <span><span style={{ color: '#ef4444' }}>■</span> Cancelled</span>
                          </div>
                        </div>
                      )}

                      {perf.total_trips === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: 16 }}>
                          No trips assigned to this driver yet.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {!perf && !perfLoading && (
                <div style={{
                  textAlign: 'center', padding: '60px 20px',
                  color: 'var(--text-muted)', fontSize: '0.92rem'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>📊</div>
                  Select a driver above to view their performance metrics.
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Attendance Modal (Create / Edit) ─────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {modal === 'create' ? 'Mark Attendance' : `Edit Record #${modal.id}`}
              </div>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <form onSubmit={modal === 'create' ? handleCreate : handleUpdate}>
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

                {modal === 'create' && (
                  <div className="form-group">
                    <label className="form-label">Driver *</label>
                    <select
                      className="form-input"
                      value={form.driver_id}
                      onChange={e => setForm(f => ({ ...f, driver_id: e.target.value }))}
                      required
                    >
                      <option value="">— Select driver —</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>
                          #{d.id} — {d.license_details} [{d.status}]
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    required
                    disabled={modal !== 'create'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {ATT_STATUSES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, status: s }))}
                        style={{
                          flex: 1, padding: '8px 4px', borderRadius: 8, border: '2px solid',
                          cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                          transition: 'all 0.15s',
                          borderColor: form.status === s
                            ? (s === 'PRESENT' ? '#22c55e' : s === 'ABSENT' ? '#ef4444' : '#f59e0b')
                            : 'var(--border)',
                          background: form.status === s
                            ? (s === 'PRESENT' ? 'rgba(34,197,94,0.12)' : s === 'ABSENT' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)')
                            : 'transparent',
                          color: form.status === s
                            ? (s === 'PRESENT' ? '#22c55e' : s === 'ABSENT' ? '#ef4444' : '#f59e0b')
                            : 'var(--text-muted)',
                        }}
                      >
                        {s === 'PRESENT' ? '✅' : s === 'ABSENT' ? '❌' : '🏖'} {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Check-In Time</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={form.check_in_time}
                      onChange={e => setForm(f => ({ ...f, check_in_time: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Check-Out Time</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={form.check_out_time}
                      onChange={e => setForm(f => ({ ...f, check_out_time: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner spinner-dark" /> : null}
                  {saving ? 'Saving…' : modal === 'create' ? 'Save Record' : 'Update Record'}
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
        }}>
          {toast.type === 'error' ? '⚠ ' : '✓ '}{toast.msg}
        </div>
      )}
    </div>
  )
}

// ── Attendance badge (distinct from main StatusBadge) ─────────
function AttBadge({ status }) {
  const map = {
    PRESENT: { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', icon: '✅' },
    ABSENT:  { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', icon: '❌' },
    LEAVE:   { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: '🏖' },
  }
  const s = map[status] || { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', icon: '—' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700,
    }}>
      {s.icon} {status}
    </span>
  )
}

// ── Icons ─────────────────────────────────────────────────────
function PlusIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
function EditIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
}
function BarIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
}
