import { useEffect, useState } from 'react'
import {
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriverAnalytics,
  recordAttendance,
  getDriverLogs,
  assignDriverVehicle,
} from '../api/drivers'
import { getVehicles } from '../api/vehicles'

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  license_number: '',
  assigned_vehicle_id: '',
}

export default function Drivers() {
  const [drivers,       setDrivers]       = useState([])
  const [vehicles,      setVehicles]      = useState([])
  const [analytics,     setAnalytics]     = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [showModal,     setShowModal]     = useState(false)
  const [editingId,     setEditingId]     = useState(null)
  const [form,          setForm]          = useState(EMPTY_FORM)
  const [formErr,       setFormErr]       = useState('')
  const [saving,        setSaving]        = useState(false)
  const [logsModal,     setLogsModal]     = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [logs,          setLogs]          = useState([])

  function loadData() {
    setLoading(true)
    Promise.all([
      getDrivers().catch(() => []),
      getVehicles().catch(() => []),
      getDriverAnalytics().catch(() => null),
    ])
      .then(([dList, vList, aData]) => {
        setDrivers(dList || [])
        setVehicles(vList || [])
        setAnalytics(aData)
        setError('')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadData, [])

  function openAddModal() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormErr('')
    setShowModal(true)
  }

  function openEditModal(d) {
    setEditingId(d.id)
    setForm({
      name: d.name,
      email: d.email,
      phone: d.phone,
      license_number: d.license_number,
      assigned_vehicle_id: d.assigned_vehicle_id || '',
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
        await updateDriver(editingId, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          license_number: form.license_number,
          assigned_vehicle_id: form.assigned_vehicle_id ? parseInt(form.assigned_vehicle_id) : null,
        })
      } else {
        await createDriver({
          name: form.name,
          email: form.email,
          phone: form.phone,
          license_number: form.license_number,
          assigned_vehicle_id: form.assigned_vehicle_id ? parseInt(form.assigned_vehicle_id) : null,
        })
      }
      closeModal()
      loadData()
    } catch (err) {
      setFormErr(err.message || 'Failed to save driver details')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this driver?')) return
    try {
      await deleteDriver(id)
      setDrivers((prev) => prev.filter((d) => d.id !== id))
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleToggleAttendance = async (driverId, newStatus) => {
    const todayStr = new Date().toISOString().split('T')[0]
    try {
      await recordAttendance(driverId, {
        driver_id: driverId,
        date: todayStr,
        status: newStatus,
        check_in: '09:00 AM',
        check_out: '06:00 PM',
      })
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleAssignVehicle = async (driverId, vehicleId) => {
    try {
      await assignDriverVehicle(driverId, vehicleId ? parseInt(vehicleId) : null)
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleViewLogs = async (d) => {
    setSelectedDriver(d)
    try {
      const logsData = await getDriverLogs(d.id)
      setLogs(logsData || [])
      setLogsModal(true)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Driver Management Module</h2>
          <p>Registration · Trip Assignments · Performance Tracking · Attendance & Analytics</p>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={openAddModal}>
            + Register New Driver
          </button>
        </div>
      </div>

      {loading && <div className="status-msg">Loading driver management hub...</div>}
      {error && <div className="status-msg error">{error}</div>}

      {/* DRIVER ANALYTICS & PERFORMANCE DASHBOARD */}
      {!loading && analytics && (
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          <div className="stat-card" style={{ '--card-color': '#6366f1' }}>
            <div className="stat-icon">👤</div>
            <div className="stat-info">
              <div className="stat-value">{analytics.total_drivers}</div>
              <div className="stat-label">Total Registered Drivers</div>
            </div>
          </div>

          <div className="stat-card" style={{ '--card-color': '#06b6d4' }}>
            <div className="stat-icon">🚚</div>
            <div className="stat-info">
              <div className="stat-value">{analytics.active_drivers}</div>
              <div className="stat-label">Active Drivers On Trip</div>
            </div>
          </div>

          <div className="stat-card" style={{ '--card-color': '#22c55e' }}>
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-value">{analytics.present_today}</div>
              <div className="stat-label">Present Today</div>
            </div>
          </div>

          <div className="stat-card" style={{ '--card-color': '#f59e0b' }}>
            <div className="stat-icon">⭐</div>
            <div className="stat-info">
              <div className="stat-value">{analytics.avg_safety_score}%</div>
              <div className="stat-label">Fleet Avg Safety Score</div>
            </div>
          </div>
        </div>
      )}

      {/* DRIVER MANAGEMENT TABLE */}
      {!loading && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Driver Info</th>
                <th>License Details</th>
                <th>Assigned Vehicle</th>
                <th>Attendance</th>
                <th>Trip Performance</th>
                <th>Safety & Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-row">
                    No drivers registered yet.
                  </td>
                </tr>
              )}
              {drivers.map((d) => {
                const assignedV = vehicles.find((v) => v.id === d.assigned_vehicle_id)
                const safetyColor = d.safety_score >= 90 ? '#22c55e' : d.safety_score >= 75 ? '#f59e0b' : '#ef4444'

                return (
                  <tr key={d.id}>
                    <td>
                      <div className="driver-name">
                        <span className="avatar">{d.name[0].toUpperCase()}</span>
                        <div>
                          <span className="driver-strong">{d.name}</span>
                          <div className="driver-meta">{d.email} | {d.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="plate-badge">{d.license_number}</span>
                    </td>
                    <td>
                      <select
                        className="inline-select"
                        value={d.assigned_vehicle_id || ''}
                        onChange={(e) => handleAssignVehicle(d.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            🚛 {v.plate_number} ({v.model})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span
                          className={`status-badge ${
                            d.attendance_status === 'present'
                              ? 'available'
                              : d.attendance_status === 'on_leave'
                              ? 'maintenance'
                              : 'unavailable'
                          }`}
                        >
                          {d.attendance_status.toUpperCase()}
                        </span>
                        <div className="att-btns">
                          <button
                            title="Mark Present"
                            className={`att-btn present${d.attendance_status === 'present' ? ' active' : ''}`}
                            onClick={() => handleToggleAttendance(d.id, 'present')}
                          >P</button>
                          <button
                            title="Mark Absent"
                            className={`att-btn absent${d.attendance_status === 'absent' ? ' active' : ''}`}
                            onClick={() => handleToggleAttendance(d.id, 'absent')}
                          >A</button>
                          <button
                            title="Mark On Leave"
                            className={`att-btn on_leave${d.attendance_status === 'on_leave' ? ' active' : ''}`}
                            onClick={() => handleToggleAttendance(d.id, 'on_leave')}
                          >L</button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="driver-stats">
                        <span className="driver-trips">{d.completed_trips_count || 0} Trips</span>
                        <span className="driver-km">{d.total_distance_km || 0} km Total</span>
                      </div>
                    </td>
                    <td>
                      <div className="driver-stats">
                        <span className="safety-score" style={{ color: safetyColor }}>🛡️ {d.safety_score || 95}% Safety</span>
                        <span className="driver-rating">★ {d.rating || 4.8} / 5.0</span>
                      </div>
                    </td>
                    <td className="actions">
                      <button className="btn-primary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => handleViewLogs(d)}>
                        📋 Logs
                      </button>
                      <button className="btn-edit" onClick={() => openEditModal(d)}>
                        Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(d.id)}>
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

      {/* REGISTRATION / EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Driver Information' : 'Register New Driver'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="field">
                <label>Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ravi Kumar"
                  required
                />
              </div>

              <div className="field">
                <label>Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="ravi@fleetflow.com"
                  required
                />
              </div>

              <div className="field">
                <label>Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>

              <div className="field">
                <label>Driving License Number</label>
                <input
                  name="license_number"
                  value={form.license_number}
                  onChange={handleChange}
                  placeholder="TN-01-2024-001234"
                  required
                />
              </div>

              <div className="field">
                <label>Assign Vehicle (Optional)</label>
                <select name="assigned_vehicle_id" value={form.assigned_vehicle_id} onChange={handleChange}>
                  <option value="">No Vehicle Assigned</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      🚛 {v.plate_number} ({v.model})
                    </option>
                  ))}
                </select>
              </div>

              {formErr && <p className="form-error">{formErr}</p>}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Driver' : 'Register Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACTIVITY LOGS MODAL */}
      {logsModal && selectedDriver && (
        <div className="modal-overlay" onClick={() => setLogsModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Activity Logs — {selectedDriver.name}</h3>
              <button className="modal-close" onClick={() => setLogsModal(false)}>✕</button>
            </div>
            <div className="modal-scroll">
              {logs.length === 0 ? (
                <div className="log-empty">No activity logs recorded yet.</div>
              ) : (
                <div className="log-list">
                  {logs.map((l) => (
                    <div key={l.id} className="log-entry">
                      <div className="log-header">
                        <span className="log-action">{l.action}</span>
                        <span className="log-time">{new Date(l.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="log-details">{l.details}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button type="button" className="btn-cancel" onClick={() => setLogsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
