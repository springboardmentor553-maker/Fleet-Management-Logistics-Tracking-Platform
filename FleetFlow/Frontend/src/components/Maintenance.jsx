import { useEffect, useState } from 'react'
import {
  getMaintenanceRecords,
  scheduleMaintenance,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  getVehicleHealthReports,
  startMaintenance,
  completeMaintenance,
  getUpcomingMaintenance,
  getOverdueMaintenance,
} from '../api/maintenance'
import { getVehicles } from '../api/vehicles'

const CATEGORIES = [
  "Oil Change",
  "Tyre Replacement",
  "Brake Service",
  "Engine Service",
  "General Inspection",
]

const EMPTY_FORM = {
  vehicle_id: '',
  category: 'Oil Change',
  description: '',
  cost: 0,

  scheduled_date: '',
  next_service_date: '',
  service_provider: '',

  odometer_km: 0,
  health_score: 95,
  notes: '',
}

export default function Maintenance({ onNavigate }) {
  const [records,       setRecords]       = useState([])
  const [reports,       setReports]       = useState([])
  const [vehicles,      setVehicles]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [showModal,     setShowModal]     = useState(false)
  const [editingId,     setEditingId]     = useState(null)
  const [form,          setForm]          = useState(EMPTY_FORM)
  const [formErr,       setFormErr]       = useState('')
  const [saving,        setSaving]        = useState(false)
  const [upcoming, setUpcoming] = useState([]);
const [overdue, setOverdue] = useState([]);

  function loadData() {
    setLoading(true)
    Promise.all([
      getMaintenanceRecords().catch(() => []),
      getVehicleHealthReports().catch(() => []),
      getVehicles().catch(() => []),
      getUpcomingMaintenance().catch(() => []),
      getOverdueMaintenance().catch(() => []),
    ])
      .then(([recList, repList, vehList, upcomingList, overdueList]) => {
        setRecords(recList || [])
        setReports(repList || [])
        setVehicles(vehList || [])
        setUpcoming(upcomingList || [])
        setOverdue(overdueList || [])
        setError('')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadData, [])

  function openScheduleModal() {
    setEditingId(null)
    setForm({
      vehicle_id: vehicles.find(v => v.current_status === "available")?.id || '',
      category: 'Oil Change',
      description: '',
      cost: 150,
      scheduled_date: '',
      next_service_date: '',
      service_provider: '',
      odometer_km: 15000,
      health_score: 95,
      notes: '',
    })
    setFormErr('')
    setShowModal(true)
  }

  function openEditModal(rec) {
    setEditingId(rec.id)
    setForm({
      vehicle_id: rec.vehicle_id,
      category: rec.category,
      description: rec.description || '',
      cost: rec.cost || 0,
      odometer_km: rec.odometer_km || 0,
      health_score: rec.health_score || 95,
      notes: rec.notes || '',
    })
    setFormErr('')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormErr('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormErr('')
    setSaving(true)

    try {
      if (editingId) {
        await updateMaintenanceRecord(editingId, {
          category: form.category,
          description: form.description,
          cost: parseFloat(form.cost),
          scheduled_date: form.scheduled_date,
          next_service_date: form.next_service_date,
          service_provider: form.service_provider,
          odometer_km: parseFloat(form.odometer_km),
          health_score: parseInt(form.health_score),
          notes: form.notes,
        })
      } else {
        await scheduleMaintenance({
          vehicle_id: parseInt(form.vehicle_id),
          category: form.category,
          description: form.description,
          cost: parseFloat(form.cost),
          scheduled_date: form.scheduled_date,
          next_service_date: form.next_service_date,
          service_provider: form.service_provider,
          odometer_km: parseFloat(form.odometer_km),
          health_score: parseInt(form.health_score),
          notes: form.notes,
        })
      }
      closeModal()
      loadData()
    } catch (err) {
      setFormErr(err.message || 'Failed to save maintenance task')
    } finally {
      setSaving(false)
    }
  }

  const handleMarkCompleted = async (id) => {
    try {
      await completeMaintenance(id)
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }
  const handleStartMaintenance = async (id) => {
    try {
       await startMaintenance(id)
       loadData()
     } catch (err) {
       alert(err.message)
     }
  }


  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this maintenance record?')) return
    try {
      await deleteMaintenanceRecord(id)
      setRecords((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  const filteredRecords = activeCategory === 'ALL'
    ? records
    : records.filter((r) => r.category === activeCategory)

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Vehicle Maintenance & Health Module</h2>
          <p>Service History · Scheduled Maintenance · Inspection Tracking & Alerts</p>
        </div>
        <div className="page-actions">
          <button className="btn-ghost" onClick={() => onNavigate && onNavigate('alerts')}>
            🔔 Maintenance Alerts
          </button>
          <button className="btn-primary" onClick={openScheduleModal}>
            + Schedule Maintenance
          </button>
        </div>
      </div>

      {loading && <div className="status-msg">Loading maintenance reports...</div>}
      {error && <div className="status-msg error">{error}</div>}

      {/* VEHICLE HEALTH REPORTS & ALERTS GRID */}
      {!loading && reports.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ color: '#f1f5f9', fontSize: 18, marginBottom: 14 }}>
            Fleet Vehicle Health Reports & Inspection Alerts
          </h3>
          <div className="stats-grid maint-reports-grid">
            {reports.map((rep) => {
              const v = vehicles.find((veh) => veh.id === rep.vehicle_id)
              const scoreColor = rep.health_score >= 85 ? '#22c55e' : rep.health_score >= 70 ? '#f59e0b' : '#ef4444'

              return (
                <div key={rep.vehicle_id} className="stat-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="plate-badge" style={{ fontSize: 14, fontWeight: 700 }}>
                      🚛 {rep.plate_number}
                    </span>
                    <span className="status-badge" style={{ background: `${scoreColor}22`, color: scoreColor }}>
                      {rep.health_status}
                    </span>
                  </div>

                  {/* Health meter bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                      <span>Health Score</span>
                      <strong style={{ color: scoreColor }}>{rep.health_score}%</strong>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: '#0f172a', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${rep.health_score}%`,
                          background: scoreColor,
                          borderRadius: 4,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>

                  {rep.alerts.length > 0 && (
                    <div style={{ fontSize: 12, color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '6px 10px', borderRadius: 6 }}>
                      ⚠️ {rep.alerts.join(' • ')}
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Type: {rep.vehicle_type}</span>
                    <span>Pending: {rep.pending_maintenance_count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
<div className="maint-dues-grid">
  {/* Upcoming */}
  <div className="stat-card">
    <h3 style={{ marginBottom: 15 }}>📅 Upcoming Maintenance</h3>

    {upcoming.length === 0 ? (
      <p style={{ color: "#94a3b8" }}>No upcoming maintenance.</p>
    ) : (
      upcoming.map((item) => (
        <div
          key={item.id}
          style={{
            padding: 12,
            marginBottom: 10,
            borderBottom: "1px solid #334155",
          }}
        >
          <strong>{item.category}</strong>

          <br />

          Vehicle #{item.vehicle_id}

          <br />

          {new Date(item.scheduled_date).toLocaleDateString()}

          <br /><br />

          <button
            className="btn-edit"
            onClick={() => handleStartMaintenance(item.id)}
          >
            ▶ Start
          </button>
        </div>
      ))
    )}
  </div>

  {/* Overdue */}
  <div className="stat-card">
    <h3 style={{ marginBottom: 15 }}>⚠ Overdue Maintenance</h3>

    {overdue.length === 0 ? (
      <p style={{ color: "#ef4444" }}>No overdue maintenance.</p>
    ) : (
      overdue.map((item) => (
        <div
          key={item.id}
          style={{
            padding: 12,
            marginBottom: 10,
            borderBottom: "1px solid #334155",
          }}
        >
          <strong>{item.category}</strong>

          <br />

          Vehicle #{item.vehicle_id}

          <br />

          {new Date(item.scheduled_date).toLocaleDateString()}

          <br /><br />

          <button
            className="btn-edit"
            style={{ background: "#ef4444" }}
            onClick={() => handleStartMaintenance(item.id)}
          >
            ▶ Start
          </button>
        </div>
      ))
    )}
  </div>
</div>

      {/* CATEGORY FILTER TABS */}
      <div className="route-mode-tabs" style={{ marginBottom: 20 }}>
        <button
          className={`route-mode-tab ${activeCategory === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveCategory('ALL')}
        >
          All Categories ({records.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = records.filter((r) => r.category === cat).length
          return (
            <button
              key={cat}
              className={`route-mode-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* SERVICE HISTORY TABLE */}
      {!loading && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Vehicle</th>
                <th>Category</th>
                <th>Description & Notes</th>
                <th>Status</th>
                <th>Odometer</th>
                <th>Health Score</th>
                <th>Cost</th>
                <th>Provider</th>
                <th>Next Service</th>
                <th style={{ minWidth: "140px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty-row">
                    No maintenance records found for selected category.
                  </td>
                </tr>
              )}
              {filteredRecords.map((r) => {
                const v = vehicles.find((veh) => veh.id === r.vehicle_id)
                return (
                  <tr key={r.id}>
                    <td className="id-cell">#{r.id}</td>
                    <td>
                      <span className="plate-badge">🚛 {v?.plate_number || `Vehicle #${r.vehicle_id}`}</span>
                    </td>
                    <td>
                      <span className="type-badge">{r.category}</span>
                    </td>
                    <td>
                      <div><strong>{r.description || r.category}</strong></div>
                      {r.notes && <span style={{ fontSize: 12, color: '#64748b' }}>{r.notes}</span>}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          r.status === 'completed'
                            ? 'delivered'
                            : r.status === 'in_progress'
                            ? 'in-transit'
                            : 'pending'
                        }`}
                      >
                        {r.status === 'in_progress' ? 'In Progress' : r.status}
                      </span>
                    </td>
                    <td>{r.odometer_km ? `${r.odometer_km} km` : '—'}</td>
                    <td>
                      <strong style={{ color: r.health_score >= 80 ? '#22c55e' : '#f59e0b' }}>
                        {r.health_score}%
                      </strong>
                    </td>
                    <td>
                      <span className="fuel-badge">
  {new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(r.cost)}
</span>
</td>
<td>
  {r.service_provider || "-"}
</td>

<td>
  {r.next_service_date
    ? new Date(r.next_service_date).toLocaleDateString()
    : "-"}
</td>
<td className="actions">
  {r.status === "scheduled" && (
    <button
      className="btn-edit"
      style={{ background: "#3b82f6" }}
      onClick={() => handleStartMaintenance(r.id)}
    >
      ▶ Start
    </button>
  )}

  {r.status === "in_progress" && (
    <button
      className="btn-edit"
      style={{ background: "#10b981" }}
      onClick={() => handleMarkCompleted(r.id)}
    >
      ✓ Complete
    </button>
  )}

  <button className="btn-edit" onClick={() => openEditModal(r)}>
    Edit
  </button>

  <button className="btn-delete" onClick={() => handleDelete(r.id)}>
    Delete
  </button>
</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SCHEDULE / EDIT MAINTENANCE MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Maintenance Task' : 'Schedule Vehicle Maintenance'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="field">
                  <label>Select Vehicle</label>
                  <select
                    name="vehicle_id"
                    value={form.vehicle_id}
                    onChange={handleChange}
                    disabled={Boolean(editingId)}
                    required
                  >
                    {vehicles
                      .filter((v) => v.current_status === "available")
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.plate_number} ({v.model} - {v.vehicle_type})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="field">
                  <label>Maintenance Category</label>
                  <select name="category" value={form.category} onChange={handleChange} required>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Service Cost (₹)</label>
                  <input
                    type="number"
                    name="cost"
                    value={form.cost}
                    onChange={handleChange}
                    placeholder="150.00"
                    required
                  />
                </div>
                <div className="field">
                  <label>Service Provider</label>

                  <input
                    type="text"
                    name="service_provider"
                    value={form.service_provider}
                    onChange={handleChange}
                    placeholder="Example: Tata Service Center"
                  />
                </div>
                <div className="field">
                  <label>Scheduled Date</label>

                  <input
                    type="datetime-local"
                    name="scheduled_date"
                    value={form.scheduled_date || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="field">
                  <label>Next Service Date</label>

                  <input
                    type="datetime-local"
                    name="next_service_date"
                    value={form.next_service_date}
                    onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label>Current Odometer (km)</label>
                  <input
                    type="number"
                    name="odometer_km"
                    value={form.odometer_km}
                    onChange={handleChange}
                    placeholder="25000"
                  />
                </div>

                <div className="field">
                  <label>Expected Health Score (0-100)</label>
                  <input
                    type="number"
                    name="health_score"
                    value={form.health_score}
                    onChange={handleChange}
                    min={0}
                    max={100}
                  />
                </div>

                <div className="field full-width-field">
                  <label>Service Description & Work Details</label>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="E.g. Synthetic oil replacement, new oil filter, tire rotation..."
                    required
                  />
                </div>

                <div className="field full-width-field">
                  <label>Inspection Notes & Diagnostic Observations</label>
                  <input
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="E.g. Brake pads at 80% life, tire tread depth good."
                  />
                </div>
              </div>

              {formErr && <p className="form-error">{formErr}</p>}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Record' : 'Schedule Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
