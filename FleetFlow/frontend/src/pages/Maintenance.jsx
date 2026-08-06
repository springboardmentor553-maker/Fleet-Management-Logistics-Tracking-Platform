import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import { maintenanceApi, maintenanceAlertsApi, reportsApi, vehicleApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import * as XLSX from 'xlsx'

export default function Maintenance() {
  const { canManage } = useAuth()
  const [records, setRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | record-obj
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [report, setReport] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [activeTab, setActiveTab] = useState('records') // 'records' | 'alerts'

  // Filters
  const [filterVehicle, setFilterVehicle] = useState('')

  const [form, setForm] = useState({
    vehicle_id: '',
    category: 'GENERAL_INSPECTION',
    service_date: new Date().toISOString().slice(0, 10),
    service_cost: '',
    service_provider: '',
    notes: '',
    status: 'SCHEDULED'
  })
  const [formErr, setFormErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [mRes, vRes, rRes, aRes] = await Promise.all([
        maintenanceApi.list(filterVehicle ? { vehicle_id: filterVehicle } : {}),
        vehicleApi.list(),
        reportsApi.maintenance(),
        maintenanceAlertsApi.list()
      ])
      setRecords(mRes.data.filter(r => r.status !== 'CANCELLED'))
      setVehicles(vRes.data)
      setReport(rRes.data)
      setAlerts(aRes.data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }, [filterVehicle])

  useEffect(() => { load() }, [load])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  function vehicleLabel(id) {
    const v = vehicles.find(x => x.id === Number(id))
    return v ? `${v.registration_number} (${v.vehicle_type})` : `#${id}`
  }

  function openCreate() {
    setForm({
      vehicle_id: '',
      category: 'GENERAL_INSPECTION',
      service_date: new Date().toISOString().slice(0, 10),
      service_cost: '',
      service_provider: '',
      notes: '',
      status: 'SCHEDULED'
    })
    setFormErr('')
    setModal('create')
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.vehicle_id || !form.category) {
      setFormErr('Vehicle and Category are required.')
      return
    }
    setSaving(true); setFormErr('')
    try {
      const payload = {
        vehicle_id: Number(form.vehicle_id),
        category: form.category,
        service_date: form.service_date,
        service_cost: form.service_cost ? Number(form.service_cost) : null,
        service_provider: form.service_provider || null,
        notes: form.notes || null,
        status: form.status,
      }
      await maintenanceApi.create(payload)
      showToast('Maintenance record added successfully')
      setModal(null)
      load()
    } catch (err) {
      setFormErr(err.response?.data?.detail || 'Failed to add record.')
    }
    setSaving(false)
  }

  function openEdit(rec) {
    setForm({
      vehicle_id: rec.vehicle_id,
      category: rec.category,
      service_date: rec.service_date,
      service_cost: rec.service_cost || '',
      service_provider: rec.service_provider || '',
      notes: rec.notes || '',
      status: rec.status
    })
    setFormErr('')
    setModal(rec)
  }

  async function handleUpdate(e) {
    e.preventDefault()
    setSaving(true); setFormErr('')
    try {
      const payload = {
        category: form.category,
        service_date: form.service_date,
        service_cost: form.service_cost ? Number(form.service_cost) : null,
        service_provider: form.service_provider || null,
        notes: form.notes || null,
        status: form.status,
      }
      await maintenanceApi.update(modal.id, payload)
      showToast('Maintenance record updated')
      setModal(null)
      load()
    } catch (err) {
      setFormErr(err.response?.data?.detail || 'Update failed.')
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this maintenance record?")) return
    setDeletingId(id)
    try {
      await maintenanceApi.delete(id)
      showToast('Record deleted')
      load()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Delete failed', 'error')
    }
    setDeletingId(null)
  }

  const exportToCSV = () => {
    if (activeTab === 'records') {
      if (!records.length) return;
      const data = records.map(r => ({
        Date: new Date(r.service_date).toLocaleDateString('en-IN'),
        Vehicle: vehicleLabel(r.vehicle_id),
        Category: r.category,
        Status: r.status,
        Cost: r.service_cost || 0,
        Provider: r.service_provider || '',
        Notes: r.notes || ''
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Maintenance Records");
      XLSX.writeFile(wb, `Maintenance_Records.xlsx`);
    } else {
      if (!alerts.length) return;
      const data = alerts.map(a => ({
        Generated: new Date(a.generated_date).toLocaleDateString('en-IN'),
        Vehicle: vehicleLabel(a.vehicle_id),
        'Alert Type': a.alert_type,
        Message: a.alert_message,
        Status: a.status
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Maintenance Alerts");
      XLSX.writeFile(wb, `Maintenance_Alerts.xlsx`);
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="top-bar">
          <div>
            <div className="top-bar-title">Maintenance</div>
            <div className="top-bar-subtitle">Track and schedule vehicle servicing</div>
          </div>
        </header>

        <main className="page-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">Maintenance</h1>
              <p className="page-subtitle">Manage maintenance logic, reports, and vehicle alerts.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" onClick={exportToCSV} disabled={(activeTab === 'records' && records.length === 0) || (activeTab === 'alerts' && alerts.length === 0)}>
                Export Excel
              </button>
              {canManage && (
                <button className="btn btn-primary" onClick={openCreate}>
                  <PlusIcon /> Record Maintenance
                </button>
              )}
            </div>
          </div>

          {report && (
            <div className="stat-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-value">{report.vehicles_under_maintenance}</div>
                <div className="stat-label">Vehicles in Maint.</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{report.overdue_services}</div>
                <div className="stat-label">Overdue Services</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">₹{report.total_maintenance_cost?.toLocaleString()}</div>
                <div className="stat-label">Total Cost</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{report.most_frequent_maintenance_category || 'N/A'}</div>
                <div className="stat-label">Top Category</div>
              </div>
            </div>
          )}

          <div className="card">
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              <button
                style={{
                  padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: activeTab === 'records' ? '2px solid var(--accent)' : '2px solid transparent',
                  color: activeTab === 'records' ? 'var(--text)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'records' ? 600 : 400
                }}
                onClick={() => setActiveTab('records')}
              >
                Maintenance Records
              </button>
              <button
                style={{
                  padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: activeTab === 'alerts' ? '2px solid var(--accent)' : '2px solid transparent',
                  color: activeTab === 'alerts' ? 'var(--text)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'alerts' ? 600 : 400
                }}
                onClick={() => setActiveTab('alerts')}
              >
                Alerts & Warnings
              </button>
            </div>

            {activeTab === 'records' && (
              <>
                <div className="card-header" style={{ padding: '0 24px 16px 24px' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <select
                      className="form-input"
                      style={{ width: 200 }}
                      value={filterVehicle}
                      onChange={e => setFilterVehicle(e.target.value)}
                    >
                      <option value="">All Vehicles</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.registration_number}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="table-responsive">
                  {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                      <span className="spinner spinner-dark" style={{ width: 24, height: 24 }} />
                    </div>
                  ) : records.length === 0 ? (
                    <div className="empty-state">No maintenance records found.</div>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Vehicle</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Cost</th>
                          <th>Provider</th>
                          {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {records.map(r => (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {new Date(r.service_date).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric'
                              })}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                                {vehicleLabel(r.vehicle_id)}
                              </div>
                            </td>
                            <td style={{ fontWeight: 600 }}>{r.category.replace('_', ' ')}</td>
                            <td>
                              <span className={`status-badge status-${r.status.toLowerCase()}`}>
                                {r.status}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600, color: 'var(--accent)' }}>
                              {r.service_cost ? `₹${r.service_cost}` : '—'}
                            </td>
                            <td style={{ fontSize: '0.85rem' }}>{r.service_provider || '—'}</td>
                            {canManage && (
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(r)}>
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-outline btn-sm"
                                    style={{ borderColor: '#ef4444', color: '#ef4444' }}
                                    onClick={() => handleDelete(r.id)}
                                    disabled={deletingId === r.id}
                                  >
                                    {deletingId === r.id ? '...' : 'Delete'}
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {activeTab === 'alerts' && (
              <div className="table-responsive">
                {loading ? (
                  <div style={{ padding: 40, textAlign: 'center' }}>
                    <span className="spinner spinner-dark" style={{ width: 24, height: 24 }} />
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="empty-state">No maintenance alerts at this time.</div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Generated</th>
                        <th>Vehicle</th>
                        <th>Alert Type</th>
                        <th>Message</th>
                        <th>Status</th>
                        {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.map(a => (
                        <tr key={a.id}>
                          <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {new Date(a.generated_date).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                              {vehicleLabel(a.vehicle_id)}
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{a.alert_type}</td>
                          <td>{a.alert_message}</td>
                          <td>
                            <span className={`status-badge status-${a.status.toLowerCase()}`}>
                              {a.status}
                            </span>
                          </td>
                          {canManage && (
                            <td style={{ textAlign: 'right' }}>
                              {a.status === 'PENDING' && (
                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={async () => {
                                    try {
                                      await maintenanceAlertsApi.update(a.id, 'COMPLETED');
                                      load();
                                    } catch(e) { console.error(e) }
                                  }}
                                >
                                  Resolve
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {modal === 'create' ? 'Add Maintenance Record' : `Edit Record #${modal.id}`}
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
                    <label className="form-label">Vehicle *</label>
                    <select
                      className="form-input"
                      value={form.vehicle_id}
                      onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}
                      required
                    >
                      <option value="">— Select vehicle —</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.registration_number}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-input"
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      required
                    >
                      <option value="GENERAL_INSPECTION">General Inspection</option>
                      <option value="OIL_CHANGE">Oil Change</option>
                      <option value="TYRE_REPLACEMENT">Tyre Replacement</option>
                      <option value="ENGINE_SERVICE">Engine Service</option>
                      <option value="BRAKE_SERVICE">Brake Service</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.service_date}
                      onChange={e => setForm(f => ({ ...f, service_date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-input"
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    >
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cost (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={form.service_cost}
                      onChange={e => setForm(f => ({ ...f, service_cost: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Service Provider</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.service_provider}
                    onChange={e => setForm(f => ({ ...f, service_provider: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
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

function PlusIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
