import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import { fuelApi, vehicleApi, driverApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import * as XLSX from 'xlsx'

export default function FuelRecords() {
  const { canManage } = useAuth()
  const [records, setRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | record-obj
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Filters
  const [filterVehicle, setFilterVehicle] = useState('')

  const [form, setForm] = useState({
    vehicle_id: '', driver_id: '', fuel_quantity: '', fuel_cost: '',
    odometer_reading: '', fuel_date: new Date().toISOString().slice(0, 10), fuel_station: '', remarks: ''
  })
  const [formErr, setFormErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [fRes, vRes, dRes] = await Promise.all([
        fuelApi.list(filterVehicle ? { vehicle_id: filterVehicle } : {}),
        vehicleApi.list(),
        driverApi.list(),
      ])
      setRecords(fRes.data)
      setVehicles(vRes.data)
      setDrivers(dRes.data)
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

  function driverLabel(id) {
    if (!id) return 'Unassigned';
    const d = drivers.find(x => x.id === Number(id))
    return d ? (d.name || d.license_details) : `#${id}`
  }

  function openCreate() {
    setForm({
      vehicle_id: '', driver_id: '', fuel_quantity: '', fuel_cost: '',
      odometer_reading: '', fuel_date: new Date().toISOString().slice(0, 10), fuel_station: '', remarks: ''
    })
    setFormErr('')
    setModal('create')
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.vehicle_id || !form.fuel_quantity || !form.fuel_cost) {
      setFormErr('Vehicle, Quantity and Cost are required.')
      return
    }
    setSaving(true); setFormErr('')
    try {
      const payload = {
        vehicle_id: Number(form.vehicle_id),
        driver_id: form.driver_id ? Number(form.driver_id) : null,
        fuel_quantity: Number(form.fuel_quantity),
        fuel_cost: Number(form.fuel_cost),
        odometer_reading: form.odometer_reading ? Number(form.odometer_reading) : null,
        fuel_date: form.fuel_date,
        fuel_station: form.fuel_station || null,
        remarks: form.remarks || null,
      }
      await fuelApi.create(payload)
      showToast('Fuel record added successfully')
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
      driver_id: rec.driver_id || '',
      fuel_quantity: rec.fuel_quantity,
      fuel_cost: rec.fuel_cost || '',
      odometer_reading: rec.odometer_reading || '',
      fuel_date: rec.fuel_date,
      fuel_station: rec.fuel_station || '',
      remarks: rec.remarks || ''
    })
    setFormErr('')
    setModal(rec)
  }

  async function handleUpdate(e) {
    e.preventDefault()
    setSaving(true); setFormErr('')
    try {
      const payload = {
        fuel_quantity: Number(form.fuel_quantity),
        fuel_cost: Number(form.fuel_cost),
        odometer_reading: form.odometer_reading ? Number(form.odometer_reading) : null,
        fuel_date: form.fuel_date,
        fuel_station: form.fuel_station || null,
        remarks: form.remarks || null,
      }
      await fuelApi.update(modal.id, payload)
      showToast('Fuel record updated')
      setModal(null)
      load()
    } catch (err) {
      setFormErr(err.response?.data?.detail || 'Update failed.')
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this fuel record?")) return
    setDeletingId(id)
    try {
      await fuelApi.delete(id)
      showToast('Record deleted')
      load()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Delete failed', 'error')
    }
    setDeletingId(null)
  }

  const exportToCSV = () => {
    if (!records.length) return;
    const data = records.map(r => ({
      Date: new Date(r.fuel_date).toLocaleDateString('en-IN'),
      Vehicle: vehicleLabel(r.vehicle_id),
      Driver: driverLabel(r.driver_id),
      'Quantity (L)': r.fuel_quantity,
      'Cost (INR)': r.fuel_cost,
      Odometer: r.odometer_reading || '',
      Station: r.fuel_station || '',
      Remarks: r.remarks || ''
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Fuel Records");
    XLSX.writeFile(wb, `Fuel_Records.xlsx`);
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="top-bar">
          <div>
            <div className="top-bar-title">Fuel Monitoring</div>
            <div className="top-bar-subtitle">Track fuel consumption and costs</div>
          </div>
        </header>

        <main className="page-content">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Fuel Records</h1>
              <p>{records.length} total record{records.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="top-bar-right">
              <button className="btn btn-outline" onClick={exportToCSV} disabled={records.length === 0}>
                Export Excel
              </button>
              {canManage && (
                <button className="btn btn-primary" onClick={openCreate}>
                  <PlusIcon /> Add Fuel Record
                </button>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">All Fuel Entries</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="form-input"
                  style={{ maxWidth: 200 }}
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
                  <div className="table-empty-icon">⛽</div>
                  <p>No fuel records found.</p>
                  {canManage && (
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={openCreate}>
                      Add first record
                    </button>
                  )}
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Vehicle</th>
                      <th>Driver</th>
                      <th>Quantity</th>
                      <th>Cost</th>
                      <th>Odometer</th>
                      <th>Station</th>
                      {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {new Date(r.fuel_date).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                            {vehicleLabel(r.vehicle_id)}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{driverLabel(r.driver_id)}</td>
                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{r.fuel_quantity} L</td>
                        <td style={{ fontWeight: 600 }}>₹{r.fuel_cost}</td>
                        <td style={{ fontSize: '0.85rem' }}>{r.odometer_reading || '—'}</td>
                        <td style={{ fontSize: '0.85rem' }}>{r.fuel_station || '—'}</td>
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
          </div>
        </main>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {modal === 'create' ? 'Add Fuel Record' : `Edit Record #${modal.id}`}
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
                  <div className="form-grid">
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
                    <div className="form-group">
                      <label className="form-label">Driver (Optional)</label>
                      <select
                        className="form-input"
                        value={form.driver_id}
                        onChange={e => setForm(f => ({ ...f, driver_id: e.target.value }))}
                      >
                        <option value="">— Auto-assign or Select —</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name ? `${d.name} (${d.license_details})` : d.license_details}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.fuel_date}
                    onChange={e => setForm(f => ({ ...f, fuel_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Fuel Quantity (L) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={form.fuel_quantity}
                      onChange={e => setForm(f => ({ ...f, fuel_quantity: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Cost (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={form.fuel_cost}
                      onChange={e => setForm(f => ({ ...f, fuel_cost: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Odometer Reading</label>
                    <input
                      type="number"
                      className="form-input"
                      value={form.odometer_reading}
                      onChange={e => setForm(f => ({ ...f, odometer_reading: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fuel Station</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.fuel_station}
                      onChange={e => setForm(f => ({ ...f, fuel_station: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <textarea
                    className="form-input"
                    rows="2"
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
