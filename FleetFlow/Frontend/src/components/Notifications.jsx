import { useEffect, useState, useCallback } from 'react'
import {
  getNotifications, getNotificationSummary, createNotification,
  markRead, markAllRead, deleteNotification, clearAllNotifications,
} from '../api/notifications'

/* ─── Constants ─────────────────────────────────────── */
const CATEGORIES = [
  { id: 'maintenance_alert', label: 'Maintenance Alert', icon: '🔧', color: '#f59e0b' },
  { id: 'delivery',          label: 'Delivery',          icon: '📦', color: '#22c55e' },
  { id: 'driver_assignment', label: 'Driver Assignment', icon: '👤', color: '#3b82f6' },
  { id: 'shipment_status',   label: 'Shipment Status',   icon: '🚚', color: '#8b5cf6' },
  { id: 'route_change',      label: 'Route Change',      icon: '🗺️', color: '#06b6d4' },
  { id: 'email',             label: 'Email',             icon: '📧', color: '#6366f1' },
  { id: 'sms',               label: 'SMS',               icon: '💬', color: '#ec4899' },
  { id: 'push',              label: 'Push',              icon: '🔔', color: '#f97316' },
]

const PRIORITIES = [
  { id: 'low',      label: 'Low',      color: '#64748b' },
  { id: 'normal',   label: 'Normal',   color: '#3b82f6' },
  { id: 'high',     label: 'High',     color: '#f59e0b' },
  { id: 'critical', label: 'Critical', color: '#ef4444' },
]

const CAT_MAP      = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))
const PRIORITY_MAP = Object.fromEntries(PRIORITIES.map(p => [p.id, p]))

const EMPTY_FORM = {
  title: '', message: '', category: 'push', priority: 'normal',
  channel_email: false, channel_sms: false, channel_push: true,
  reference_type: '', reference_id: '',
}

function timeSince(dt) {
  const diff = Math.floor((Date.now() - new Date(dt)) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

/* ─── Notification Card ─────────────────────────────── */
function NotifCard({ n, onRead, onDelete }) {
  const cat  = CAT_MAP[n.category]      || { icon:'🔔', color:'#6366f1', label: n.category }
  const prio = PRIORITY_MAP[n.priority] || { color:'#3b82f6', label: n.priority }

  return (
    <div
      className={`notif-card ${n.is_read ? 'notif-read' : 'notif-unread'}`}
      style={{ borderLeftColor: cat.color }}
      onClick={() => !n.is_read && onRead(n.id)}
    >
      <div className="notif-icon" style={{ background: `${cat.color}18`, color: cat.color }}>
        {cat.icon}
      </div>
      <div className="notif-body">
        <div className="notif-top">
          <span className="notif-title">{n.title}</span>
          <div className="notif-meta-row">
            <span className="notif-prio" style={{ color: prio.color }}>● {prio.label}</span>
            <span className="notif-time">{timeSince(n.created_at)}</span>
          </div>
        </div>
        <p className="notif-msg">{n.message}</p>
        <div className="notif-tags">
          <span className="notif-cat-tag" style={{ background:`${cat.color}18`, color: cat.color }}>
            {cat.icon} {cat.label}
          </span>
          {n.channel_email && <span className="notif-ch-tag">📧 Email</span>}
          {n.channel_sms   && <span className="notif-ch-tag">💬 SMS</span>}
          {n.channel_push  && <span className="notif-ch-tag">🔔 Push</span>}
          {!n.is_read && <span className="notif-unread-dot">● Unread</span>}
        </div>
      </div>
      <button
        className="notif-del-btn"
        onClick={e => { e.stopPropagation(); onDelete(n.id) }}
        title="Delete"
      >✕</button>
    </div>
  )
}

/* ─── Summary Pill ──────────────────────────────────── */
function SummaryPill({ icon, label, value, color }) {
  return (
    <div className="notif-summary-pill" style={{ '--pill-accent': color }}>
      <span className="nsp-icon">{icon}</span>
      <div className="nsp-body">
        <div className="nsp-val">{value}</div>
        <div className="nsp-lbl">{label}</div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function Notifications() {
  const [notifs,   setNotifs]   = useState([])
  const [summary,  setSummary]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [filterCat,  setFilterCat]  = useState('ALL')
  const [filterRead, setFilterRead] = useState('ALL')  // ALL | unread | read
  const [filterPrio, setFilterPrio] = useState('ALL')
  const [showModal, setShowModal]   = useState(false)
  const [form,      setForm]        = useState(EMPTY_FORM)
  const [formErr,   setFormErr]     = useState('')
  const [saving,    setSaving]      = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [n, s] = await Promise.all([
        getNotifications({ limit: 100 }),
        getNotificationSummary(),
      ])
      setNotifs(n)
      setSummary(s)
      setError('')
    } catch (e) {
      setError(e?.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  /* filters */
  const filtered = notifs.filter(n => {
    if (filterCat  !== 'ALL' && n.category  !== filterCat)            return false
    if (filterPrio !== 'ALL' && n.priority   !== filterPrio)           return false
    if (filterRead === 'unread' && n.is_read)                          return false
    if (filterRead === 'read'   && !n.is_read)                         return false
    return true
  })

  const unreadCount = notifs.filter(n => !n.is_read).length

  async function handleRead(id) {
    await markRead(id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setSummary(prev => prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : prev)
  }

  async function handleDelete(id) {
    await deleteNotification(id)
    setNotifs(prev => prev.filter(n => n.id !== id))
    load()
  }

  async function handleMarkAll() {
    await markAllRead()
    load()
  }

  async function handleClearAll() {
    if (!confirm('Clear all notifications?')) return
    await clearAllNotifications()
    load()
  }

  /* create */
  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setFormErr('')
    setSaving(true)
    try {
      await createNotification({
        title:          form.title,
        message:        form.message,
        category:       form.category,
        priority:       form.priority,
        channel_email:  form.channel_email,
        channel_sms:    form.channel_sms,
        channel_push:   form.channel_push,
        reference_type: form.reference_type || null,
        reference_id:   form.reference_id ? parseInt(form.reference_id) : null,
      })
      setShowModal(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setFormErr(err?.response?.data?.detail || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-content">

      {/* ── HEADER ── */}
      <div className="page-header">
        <div>
          <h2>🔔 Notification Centre</h2>
          <p>Maintenance alerts · Deliveries · Assignments · Route changes · Email · SMS · Push</p>
        </div>
        <div className="page-actions">
          {unreadCount > 0 && (
            <button className="btn-ghost" onClick={handleMarkAll}>✓ Mark All Read</button>
          )}
          <button className="btn-ghost" onClick={handleClearAll}>🗑 Clear All</button>
          <button className="btn-primary" onClick={() => { setShowModal(true); setForm(EMPTY_FORM); setFormErr('') }}>
            + New Notification
          </button>
        </div>
      </div>

      {loading && <div className="status-msg">Loading notifications…</div>}
      {error   && <div className="status-msg error">{error}</div>}

      {/* ── SUMMARY PILLS ── */}
      {!loading && summary && (
        <div className="notif-summary-row">
          <SummaryPill icon="🔔" label="Total"  value={summary.total}  color="#6366f1" />
          <SummaryPill icon="🟡" label="Unread" value={summary.unread} color="#f59e0b" />
          {CATEGORIES.map(c => (
            (summary.by_category?.[c.id] ?? 0) > 0 && (
              <SummaryPill key={c.id} icon={c.icon} label={c.label}
                value={summary.by_category[c.id]} color={c.color} />
            )
          ))}
        </div>
      )}

      {/* ── CATEGORY QUICK-FILTER TABS ── */}
      {!loading && (
        <div className="route-mode-tabs" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            className={`route-mode-tab ${filterCat === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterCat('ALL')}
          >All ({notifs.length})</button>
          {CATEGORIES.map(c => {
            const cnt = notifs.filter(n => n.category === c.id).length
            return cnt > 0 ? (
              <button
                key={c.id}
                className={`route-mode-tab ${filterCat === c.id ? 'active' : ''}`}
                onClick={() => setFilterCat(filterCat === c.id ? 'ALL' : c.id)}
              >{c.icon} {c.label} ({cnt})</button>
            ) : null
          })}
        </div>
      )}

      {/* ── FILTER ROW ── */}
      {!loading && (
        <div className="alerts-filter-row" style={{ marginBottom: 20 }}>
          <select className="inline-select" value={filterRead}
            onChange={e => setFilterRead(e.target.value)}>
            <option value="ALL">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <select className="inline-select" value={filterPrio}
            onChange={e => setFilterPrio(e.target.value)}>
            <option value="ALL">All Priorities</option>
            {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <button className="btn-ghost" onClick={load}>↺ Refresh</button>
        </div>
      )}

      {/* ── NOTIFICATION LIST ── */}
      {!loading && (
        <div className="notif-list">
          {filtered.length === 0 ? (
            <div className="notif-empty">
              <div className="notif-empty-icon">🔕</div>
              <p>No notifications match your filters.</p>
            </div>
          ) : (
            filtered.map(n => (
              <NotifCard key={n.id} n={n} onRead={handleRead} onDelete={handleDelete} />
            ))
          )}
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔔 Create Notification</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-grid">

                <div className="field full-width-field">
                  <label>Title *</label>
                  <input name="title" value={form.title} onChange={handleChange}
                    placeholder="e.g. Vehicle KA01 service overdue" required />
                </div>

                <div className="field">
                  <label>Category *</label>
                  <select name="category" value={form.category} onChange={handleChange}>
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Priority *</label>
                  <select name="priority" value={form.priority} onChange={handleChange}>
                    {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>

                <div className="field full-width-field">
                  <label>Message *</label>
                  <textarea name="message" value={form.message} onChange={handleChange}
                    rows={3} placeholder="Notification message body…" required />
                </div>

                {/* Channels */}
                <div className="field full-width-field">
                  <label>Delivery Channels</label>
                  <div className="notif-channel-row">
                    <label className="notif-channel-chk">
                      <input type="checkbox" name="channel_push" checked={form.channel_push} onChange={handleChange} />
                      🔔 Push
                    </label>
                    <label className="notif-channel-chk">
                      <input type="checkbox" name="channel_sms" checked={form.channel_sms} onChange={handleChange} />
                      💬 SMS
                    </label>
                    <label className="notif-channel-chk">
                      <input type="checkbox" name="channel_email" checked={form.channel_email} onChange={handleChange} />
                      📧 Email
                    </label>
                  </div>
                </div>

                <div className="field">
                  <label>Reference Type (optional)</label>
                  <select name="reference_type" value={form.reference_type} onChange={handleChange}>
                    <option value="">— None —</option>
                    <option value="trip">Trip</option>
                    <option value="shipment">Shipment</option>
                    <option value="driver">Driver</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="vehicle">Vehicle</option>
                  </select>
                </div>

                <div className="field">
                  <label>Reference ID (optional)</label>
                  <input type="number" name="reference_id" value={form.reference_id}
                    onChange={handleChange} placeholder="e.g. 42" min={1} />
                </div>

              </div>

              {formErr && <p className="form-error">⚠ {formErr}</p>}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Creating…' : '🔔 Send Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
