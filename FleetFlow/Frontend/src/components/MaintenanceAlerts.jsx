import { useEffect, useState } from 'react'
import {
  getAlerts, createAlert, triggerAutoAlerts, updateAlertStatus, deleteAlert, getMaintenanceReport,
} from '../api/maintenance_alerts'
import { getMaintenanceRecords } from '../api/maintenance'
import { getVehicles } from '../api/vehicles'

/* ────────────────────────────────────────────────── constants */
const ALERT_TYPES   = ['service_due', 'overdue', 'health_critical', 'upcoming']
const ALERT_STATUSES = ['Pending', 'Sent', 'Completed']

const STATUS_META = {
  Pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: '🟡' },
  Sent:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: '🔵' },
  Completed: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: '🟢' },
}
const TYPE_META = {
  service_due:    { label: 'Service Due',     color: '#f59e0b', icon: '🔧' },
  overdue:        { label: 'Overdue',         color: '#ef4444', icon: '🚨' },
  health_critical:{ label: 'Health Critical', color: '#dc2626', icon: '❤️' },
  upcoming:       { label: 'Upcoming',        color: '#3b82f6', icon: '📅' },
}

const EMPTY_FORM = {
  vehicle_id: '',
  maintenance_id: '',
  alert_message: '',
  alert_type: 'service_due',
  alert_status: 'Pending',
  next_service_date: '',
}

/* ────────────────────────────────────────────────── helpers */
function fmt(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
function fmtTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

/* ═══════════════════════════════════════════════════════════════
   STAT CARD for Reports section
═══════════════════════════════════════════════════════════════ */
function ReportCard({ icon, label, value, color = '#6366f1', sub }) {
  return (
    <div className="alert-report-card">
      <div className="arc-icon" style={{ background: `${color}18`, color }}>{icon}</div>
      <div className="arc-body">
        <div className="arc-value" style={{ color }}>{value ?? '—'}</div>
        <div className="arc-label">{label}</div>
        {sub && <div className="arc-sub">{sub}</div>}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function MaintenanceAlerts() {
  /* ── state ── */
  const [alerts,     setAlerts]     = useState([])
  const [report,     setReport]     = useState(null)
  const [vehicles,   setVehicles]   = useState([])
  const [maintRecs,  setMaintRecs]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [autoMsg,    setAutoMsg]    = useState('')

  /* filters */
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterType,   setFilterType]   = useState('ALL')
  const [search,       setSearch]       = useState('')

  /* modal */
  const [showModal, setShowModal] = useState(false)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [formErr,   setFormErr]   = useState('')
  const [saving,    setSaving]    = useState(false)

  /* tab: alerts | reports */
  const [tab, setTab] = useState('alerts')

  /* ── load ── */
  function loadAll() {
    setLoading(true)
    Promise.all([
      getAlerts().catch(() => []),
      getMaintenanceReport().catch(() => null),
      getVehicles().catch(() => []),
      getMaintenanceRecords().catch(() => []),
    ]).then(([a, r, v, m]) => {
      let finalAlerts = a || []
      const activeRecs = (m || []).filter(rec => rec.status === 'scheduled' || rec.status === 'in_progress')

      // Fallback: If API returns 0 alerts, derive automatic alerts from active maintenance records
      if (finalAlerts.length === 0 && activeRecs.length > 0) {
        const todayStr = new Date().toISOString().split('T')[0]
        finalAlerts = activeRecs.map((rec, idx) => {
          const sDate = rec.scheduled_date ? rec.scheduled_date.split('T')[0] : todayStr
          let type = 'upcoming'
          let msg = `UPCOMING: ${rec.category} for vehicle #${rec.vehicle_id}`
          if (sDate < todayStr) {
            type = 'overdue'
            msg = `OVERDUE: ${rec.category} for vehicle #${rec.vehicle_id} is overdue. Originally scheduled on ${sDate}.`
          } else if (sDate === todayStr) {
            type = 'service_due'
            msg = `MAINTENANCE DUE TODAY: ${rec.category} for vehicle #${rec.vehicle_id} is scheduled for today.`
          } else {
            type = 'upcoming'
            msg = `UPCOMING: ${rec.category} for vehicle #${rec.vehicle_id} is scheduled for ${sDate}.`
          }
          return {
            id: rec.id || (idx + 100),
            vehicle_id: rec.vehicle_id,
            maintenance_id: rec.id,
            alert_message: msg,
            alert_type: type,
            alert_status: 'Pending',
            generated_date: new Date().toISOString(),
            next_service_date: rec.next_service_date || rec.scheduled_date,
          }
        })
      }

      setAlerts(finalAlerts)
      setReport(r)
      setVehicles(v || [])
      setMaintRecs(m || [])
      setError('')
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadAll, [])

  async function handleAutoCheck() {
    setAutoMsg('Scanning maintenance schedules...')
    try {
      const res = await triggerAutoAlerts()
      setAutoMsg(`✓ Scan complete! Created ${res.alerts_created || 0} alert(s) & ${res.notifications_created || 0} notification(s).`)
      loadAll()
      setTimeout(() => setAutoMsg(''), 4000)
    } catch (err) {
      setAutoMsg(`Failed to scan: ${err.message}`)
      setTimeout(() => setAutoMsg(''), 4000)
    }
  }

  /* ── form helpers ── */
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function openModal() {
    setForm(EMPTY_FORM)
    setFormErr('')
    setShowModal(true)
  }
  function closeModal() {
    setShowModal(false)
    setForm(EMPTY_FORM)
    setFormErr('')
  }

  /* ── create alert ── */
  const handleCreate = async (e) => {
    e.preventDefault()
    setFormErr('')
    setSaving(true)
    try {
      await createAlert({
        vehicle_id:       parseInt(form.vehicle_id),
        maintenance_id:   parseInt(form.maintenance_id),
        alert_message:    form.alert_message,
        alert_type:       form.alert_type,
        alert_status:     form.alert_status,
        next_service_date: form.next_service_date || null,
      })
      closeModal()
      loadAll()
    } catch (err) {
      setFormErr(err?.response?.data?.detail || err.message || 'Failed to create alert')
    } finally {
      setSaving(false)
    }
  }

  /* ── update status ── */
  const handleStatusChange = async (id, newStatus) => {
    const alertObj = alerts.find(a => a.id === id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, alert_status: newStatus } : a))

    try {
      await updateAlertStatus(id, { alert_status: newStatus })
    } catch (err) {
      // If server returns Alert not found, automatically create and save the alert on the server
      if (alertObj) {
        try {
          await createAlert({
            vehicle_id: alertObj.vehicle_id,
            maintenance_id: alertObj.maintenance_id || alertObj.id,
            alert_message: alertObj.alert_message,
            alert_type: alertObj.alert_type || 'service_due',
            alert_status: newStatus,
            next_service_date: alertObj.next_service_date || null
          })
        } catch (e2) {
          console.warn('Auto-create fallback alert failed:', e2.message)
        }
      }
    }
  }

  /* ── delete ── */
  const handleDelete = async (id) => {
    if (!confirm('Delete this alert?')) return
    setAlerts(prev => prev.filter(a => a.id !== id))
    try {
      await deleteAlert(id)
    } catch (err) {
      console.warn('Delete API call warning:', err.message)
    }
  }

  /* ── filter ── */
  const filtered = alerts.filter(a => {
    if (filterStatus !== 'ALL' && a.alert_status !== filterStatus) return false
    if (filterType   !== 'ALL' && a.alert_type   !== filterType)   return false
    if (search) {
      const q = search.toLowerCase()
      const veh = vehicles.find(v => v.id === a.vehicle_id)
      if (!a.alert_message.toLowerCase().includes(q) &&
          !(veh?.plate_number || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  /* ── filtered maintenance records (for modal: only those matching selected vehicle) ── */
  const filteredMaint = form.vehicle_id
    ? maintRecs.filter(m => m.vehicle_id === parseInt(form.vehicle_id))
    : maintRecs

  /* ─────────────────────────────────────────── render */
  return (
    <div className="page-content">

      {/* ── PAGE HEADER ── */}
      <div className="page-header">
        <div>
          <h2>🔔 Maintenance Alerts &amp; Reports</h2>
          <p>Auto-generated alerts · Manual alerts · Service report analytics</p>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={openModal}>+ Create Alert</button>
        </div>
      </div>

      {loading && <div className="status-msg">Loading alerts &amp; reports…</div>}
      {error   && <div className="status-msg error">{error}</div>}

      {/* ── TAB BAR ── */}
      {!loading && (
        <div className="route-mode-tabs" style={{ marginBottom: 24 }}>
          <button
            className={`route-mode-tab ${tab === 'alerts' ? 'active' : ''}`}
            onClick={() => setTab('alerts')}
          >
            🔔 Alerts ({alerts.length})
          </button>
          <button
            className={`route-mode-tab ${tab === 'reports' ? 'active' : ''}`}
            onClick={() => setTab('reports')}
          >
            📊 Maintenance Report
          </button>
        </div>
      )}

      {/* ══════════════════════════════ REPORTS TAB ══════════════════════════════ */}
      {!loading && tab === 'reports' && report && (
        <>
          <div className="alert-report-grid">
            <ReportCard icon="📋" label="Total Records"          value={report.total_records}              color="#6366f1" />
            <ReportCard icon="🚛" label="Under Maintenance"      value={report.vehicles_under_maintenance} color="#f59e0b" />
            <ReportCard icon="✅" label="Completed Services"     value={report.completed_services}         color="#22c55e" />
            <ReportCard icon="⚠️" label="Overdue Services"       value={report.overdue_services}           color="#ef4444" />
            <ReportCard icon="💰" label="Total Cost"
              value={new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(report.total_maintenance_cost)}
              color="#10b981"
            />
            <ReportCard icon="🏆" label="Top Category"          value={report.most_frequent_category || 'N/A'} color="#8b5cf6" />
          </div>

          {/* Alert breakdown */}
          <div className="alert-breakdown">
            <h3 style={{ color: '#f1f5f9', marginBottom: 16 }}>Alert Status Breakdown</h3>
            <div className="alert-breakdown-grid">
              <div className="abd-item" style={{ '--abd-color': STATUS_META.Pending.color }}>
                <span className="abd-num">{report.pending_alerts}</span>
                <span className="abd-lbl">🟡 Pending</span>
              </div>
              <div className="abd-item" style={{ '--abd-color': STATUS_META.Sent.color }}>
                <span className="abd-num">{report.sent_alerts}</span>
                <span className="abd-lbl">🔵 Sent</span>
              </div>
              <div className="abd-item" style={{ '--abd-color': STATUS_META.Completed.color }}>
                <span className="abd-num">{report.completed_alerts}</span>
                <span className="abd-lbl">🟢 Completed</span>
              </div>
              <div className="abd-item" style={{ '--abd-color': '#6366f1' }}>
                <span className="abd-num">{report.pending_alerts + report.sent_alerts + report.completed_alerts}</span>
                <span className="abd-lbl">📊 Total Alerts</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════ ALERTS TAB ══════════════════════════════ */}
      {!loading && tab === 'alerts' && (
        <>
          {/* ── PENDING ALERT BANNERS ── */}
          {alerts.filter(a => a.alert_status === 'Pending').length > 0 && (
            <div className="alert-banner-strip">
              {alerts.filter(a => a.alert_status === 'Pending').slice(0,3).map(a => {
                const tm = TYPE_META[a.alert_type] || TYPE_META.service_due
                return (
                  <div key={a.id} className="alert-banner" style={{ borderColor: tm.color }}>
                    <span className="ab-icon">{tm.icon}</span>
                    <span className="ab-msg">{a.alert_message}</span>
                    <button
                      className="ab-dismiss"
                      onClick={() => handleStatusChange(a.id, 'Sent')}
                      title="Mark as Sent"
                    >Dismiss</button>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── FILTERS ── */}
          <div className="alerts-filter-row">
            <input
              className="search-input"
              placeholder="🔍 Search alerts or plate…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="inline-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              {ALERT_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select
              className="inline-select"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="ALL">All Types</option>
              {ALERT_TYPES.map(t => <option key={t} value={t}>{TYPE_META[t]?.label || t}</option>)}
            </select>
            <button className="btn-ghost" onClick={loadAll}>↺ Refresh</button>
          </div>

          {/* ── ALERTS TABLE ── */}
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Vehicle</th>
                  <th>Alert Type</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Generated</th>
                  <th>Next Service</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-row">
                      No alerts found matching your filters.
                    </td>
                  </tr>
                )}
                {filtered.map(a => {
                  const sm  = STATUS_META[a.alert_status] || STATUS_META.Pending
                  const tm  = TYPE_META[a.alert_type]     || TYPE_META.service_due
                  const veh = vehicles.find(v => v.id === a.vehicle_id)
                  return (
                    <tr key={a.id}>
                      <td className="id-cell">#{a.id}</td>
                      <td>
                        <span className="plate-badge">
                          🚛 {veh?.plate_number || `#${a.vehicle_id}`}
                        </span>
                      </td>
                      <td>
                        <span
                          className="type-badge"
                          style={{ background: `${tm.color}18`, color: tm.color }}
                        >
                          {tm.icon} {tm.label}
                        </span>
                      </td>
                      <td className="alert-msg-cell">{a.alert_message}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ background: sm.bg, color: sm.color }}
                        >
                          {sm.icon} {a.alert_status}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: '#94a3b8' }}>{fmtTime(a.generated_date)}</td>
                      <td style={{ fontSize: 13, color: '#94a3b8' }}>{fmt(a.next_service_date)}</td>
                      <td className="actions">
                        {/* Quick status transitions */}
                        {a.alert_status === 'Pending' && (
                          <button
                            className="btn-edit"
                            style={{ background: '#3b82f6', fontSize: 12 }}
                            onClick={() => handleStatusChange(a.id, 'Sent')}
                          >
                            → Sent
                          </button>
                        )}
                        {a.alert_status === 'Sent' && (
                          <button
                            className="btn-edit"
                            style={{ background: '#22c55e', fontSize: 12 }}
                            onClick={() => handleStatusChange(a.id, 'Completed')}
                          >
                            ✓ Done
                          </button>
                        )}
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(a.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── STATUS SUMMARY CHIPS ── */}
          {alerts.length > 0 && (
            <div className="alert-summary-chips">
              {ALERT_STATUSES.map(s => {
                const cnt = alerts.filter(a => a.alert_status === s).length
                const sm  = STATUS_META[s]
                return (
                  <button
                    key={s}
                    className={`chip ${filterStatus === s ? 'chip-active' : ''}`}
                    style={{ '--chip-color': sm.color }}
                    onClick={() => setFilterStatus(filterStatus === s ? 'ALL' : s)}
                  >
                    {sm.icon} {s} <strong>{cnt}</strong>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════ CREATE MODAL ══════════════════════════════ */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔔 Create Maintenance Alert</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-grid">

                {/* Vehicle */}
                <div className="field">
                  <label>Select Vehicle *</label>
                  <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} required>
                    <option value="">— Choose vehicle —</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.plate_number} ({v.vehicle_type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Maintenance Record */}
                <div className="field">
                  <label>Maintenance Record *</label>
                  <select name="maintenance_id" value={form.maintenance_id} onChange={handleChange} required>
                    <option value="">— Choose record —</option>
                    {filteredMaint.map(m => (
                      <option key={m.id} value={m.id}>
                        #{m.id} · {m.category} · {m.status}
                      </option>
                    ))}
                  </select>
                  {!form.vehicle_id && (
                    <span style={{ fontSize: 12, color: '#64748b' }}>Select a vehicle first to filter records</span>
                  )}
                </div>

                {/* Alert Type */}
                <div className="field">
                  <label>Alert Type *</label>
                  <select name="alert_type" value={form.alert_type} onChange={handleChange} required>
                    {ALERT_TYPES.map(t => (
                      <option key={t} value={t}>{TYPE_META[t]?.label || t}</option>
                    ))}
                  </select>
                </div>

                {/* Alert Status */}
                <div className="field">
                  <label>Alert Status *</label>
                  <select name="alert_status" value={form.alert_status} onChange={handleChange} required>
                    {ALERT_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Next Service Date */}
                <div className="field full-width-field">
                  <label>Next Service Date (optional)</label>
                  <input
                    type="datetime-local"
                    name="next_service_date"
                    value={form.next_service_date}
                    onChange={handleChange}
                  />
                </div>

                {/* Alert Message */}
                <div className="field full-width-field">
                  <label>Alert Message *</label>
                  <textarea
                    name="alert_message"
                    value={form.alert_message}
                    onChange={handleChange}
                    rows={3}
                    placeholder="E.g. Vehicle KA-01-AB-1234 is overdue for Oil Change. Scheduled on 2026-07-01."
                    required
                  />
                </div>

              </div>

              {formErr && <p className="form-error">⚠ {formErr}</p>}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Creating…' : '🔔 Create Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
