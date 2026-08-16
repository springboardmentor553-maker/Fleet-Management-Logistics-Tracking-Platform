import { useEffect, useState } from 'react'
import {
  getFuelRecords,
  createFuelRecord,
  updateFuelRecord,
  deleteFuelRecord,
  getFuelAnalytics,
} from '../api/fuel'
import { getVehicles } from '../api/vehicles'
import { getDrivers } from '../api/drivers'

const EMPTY_FORM = {
  vehicle_id: '',
  driver_id: '',
  fuel_quantity: '',
  fuel_cost: '',
  odometer_reading: '',
  fuel_station: '',
  fuel_date: new Date().toISOString().split('T')[0],
  remarks: '',
}

export default function Fuel() {
  const [records, setRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErr, setFormErr] = useState('')
  const [saving, setSaving] = useState(false)

  function loadData() {
    setLoading(true)
    Promise.all([
      getFuelRecords().catch(() => []),
      getVehicles().catch(() => []),
      getDrivers().catch(() => []),
      getFuelAnalytics().catch(() => null),
    ])
      .then(([recList, vList, dList, aData]) => {
        setRecords(recList || [])
        setVehicles(vList || [])
        setDrivers(dList || [])
        setAnalytics(aData)
        setError('')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadData, [])

  function openAddModal() {
    setEditingId(null)
    setForm({
      ...EMPTY_FORM,
      fuel_date: new Date().toISOString().split('T')[0],
    })
    setFormErr('')
    setShowModal(true)
  }

  function openEditModal(r) {
    setEditingId(r.id)
    setForm({
      vehicle_id: r.vehicle_id || '',
      driver_id: r.driver_id || '',
      fuel_quantity: r.fuel_quantity || '',
      fuel_cost: r.fuel_cost || '',
      odometer_reading: r.odometer_reading || '',
      fuel_station: r.fuel_station || '',
      fuel_date: r.fuel_date ? r.fuel_date.split('T')[0] : new Date().toISOString().split('T')[0],
      remarks: r.remarks || '',
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

    const quantity = parseFloat(form.fuel_quantity)
    const cost = parseFloat(form.fuel_cost)

    if (!form.vehicle_id) {
      setFormErr('Please select a vehicle')
      return
    }
    if (!form.driver_id) {
      setFormErr('Please select a driver')
      return
    }
    if (isNaN(quantity) || quantity <= 0) {
      setFormErr('Fuel quantity must be greater than zero')
      return
    }
    if (isNaN(cost) || cost <= 0) {
      setFormErr('Fuel cost must be greater than zero')
      return
    }

    setSaving(true)

    const payload = {
      vehicle_id: parseInt(form.vehicle_id),
      driver_id: parseInt(form.driver_id),
      fuel_quantity: quantity,
      fuel_cost: cost,
      odometer_reading: form.odometer_reading ? parseFloat(form.odometer_reading) : 0,
      fuel_station: form.fuel_station || null,
      fuel_date: form.fuel_date || new Date().toISOString(),
      remarks: form.remarks || null,
    }

    try {
      if (editingId) {
        await updateFuelRecord(editingId, payload)
      } else {
        await createFuelRecord(payload)
      }
      closeModal()
      loadData()
    } catch (err) {
      setFormErr(err.response?.data?.detail || err.message || 'Failed to save fuel record')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this fuel record?')) return
    try {
      await deleteFuelRecord(id)
      setRecords((prev) => prev.filter((r) => r.id !== id))
      loadData()
    } catch (err) {
      alert(err.response?.data?.detail || err.message)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Fuel Monitoring Module</h2>
          <p>Track fuel usage, costs, odometer readings, and analyze fleet fuel efficiency</p>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={openAddModal}>
            + Add Fuel Record
          </button>
        </div>
      </div>

      {loading && <div className="status-msg">Loading fuel monitoring hub...</div>}
      {error && <div className="status-msg error">{error}</div>}

      {/* FUEL ANALYTICS DASHBOARD */}
      {!loading && analytics && (
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          <div className="stat-card" style={{ '--card-color': '#06b6d4' }}>
            <div className="stat-icon">⛽</div>
            <div className="stat-info">
              <div className="stat-value">{analytics.total_fuel_consumed.toLocaleString()} L</div>
              <div className="stat-label">Total Fuel Consumed</div>
            </div>
          </div>

          <div className="stat-card" style={{ '--card-color': '#10b981' }}>
            <div className="stat-icon">💵</div>
            <div className="stat-info">
              <div className="stat-value">₹{analytics.total_fuel_cost.toLocaleString()}</div>
              <div className="stat-label">Total Fuel Cost</div>
            </div>
          </div>
          <div className="stat-card" style={{ '--card-color': '#3b82f6' }}>
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-value">
              {records.length > 0
                ? (
                    records.reduce(
                      (total, record) => total + Number(record.fuel_quantity || 0),
                      0
                    ) / records.length
                  ).toFixed(2)
                : '0.00'} L
            </div>
            <div className="stat-label">Avg Fuel Consumption</div>
          </div>
        </div>
          <div className="stat-card" style={{ '--card-color': '#ef4444' }}>
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <div className="stat-value" style={{ fontSize: 16 }}>
                {analytics.vehicle_highest_usage
                  ? `${analytics.vehicle_highest_usage.plate_number} (${analytics.vehicle_highest_usage.total_fuel} L)`
                  : 'N/A'}
              </div>
              <div className="stat-label">Highest Usage Vehicle</div>
            </div>
          </div>

          <div className="stat-card" style={{ '--card-color': '#8b5cf6' }}>
            <div className="stat-icon">📉</div>
            <div className="stat-info">
              <div className="stat-value" style={{ fontSize: 16 }}>
                {analytics.vehicle_lowest_usage
                  ? `${analytics.vehicle_lowest_usage.plate_number} (${analytics.vehicle_lowest_usage.total_fuel} L)`
                  : 'N/A'}
              </div>
              <div className="stat-label">Lowest Usage Vehicle</div>
            </div>
          </div>
        </div>
      )}

      {/* FUEL RECORDS TABLE */}
      {!loading && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Fuel Quantity</th>
                <th>Cost</th>
                <th>Odometer</th>
                <th>Fuel Station</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty-row">
                    No fuel records found. Click "+ Add Fuel Record" to create one.
                  </td>
                </tr>
              )}
              {records.map((r) => {
                const vehicle = vehicles.find((v) => v.id === r.vehicle_id)
                const driver = drivers.find((d) => d.id === r.driver_id)
                const plateText = r.vehicle?.plate_number || vehicle?.plate_number || `Vehicle #${r.vehicle_id}`
                const driverText = r.driver?.name || driver?.name || `Driver #${r.driver_id}`

                return (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>
                      <span className="plate-badge">🚛 {plateText}</span>
                    </td>
                    <td>👤 {driverText}</td>
                    <td>
                      <span className="cyan-val">{r.fuel_quantity} L</span>
                    </td>
                    <td>
                      <span className="green-val">₹{r.fuel_cost.toLocaleString()}</span>
                    </td>
                    <td>{r.odometer_reading ? `${r.odometer_reading.toLocaleString()} km` : '—'}</td>
                    <td>{r.fuel_station || '—'}</td>
                    <td>{r.fuel_date ? new Date(r.fuel_date).toLocaleDateString() : '—'}</td>
                    <td className="actions">
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

      {/* ADD / EDIT FUEL MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Fuel Record' : 'Add New Fuel Record'}</h3>
              <button className="modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="field">
                <label>Select Vehicle *</label>
                <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} required>
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      🚛 {v.plate_number} ({v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Select Driver *</label>
                <select name="driver_id" value={form.driver_id} onChange={handleChange} required>
                  <option value="">-- Choose Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      👤 {d.name} ({d.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group-2">
                <div className="field">
                  <label>Fuel Quantity (Liters) *</label>
                  <input
                    name="fuel_quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.fuel_quantity}
                    onChange={handleChange}
                    placeholder="e.g. 45.5"
                    required
                  />
                </div>

                <div className="field">
                  <label>Fuel Cost ($) *</label>
                  <input
                    name="fuel_cost"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.fuel_cost}
                    onChange={handleChange}
                    placeholder="e.g. 120.00"
                    required
                  />
                </div>
              </div>

              <div className="field-group-2">
                <div className="field">
                  <label>Odometer Reading (km)</label>
                  <input
                    name="odometer_reading"
                    type="number"
                    step="0.1"
                    value={form.odometer_reading}
                    onChange={handleChange}
                    placeholder="e.g. 45200"
                  />
                </div>

                <div className="field">
                  <label>Fuel Date</label>
                  <input
                    name="fuel_date"
                    type="date"
                    value={form.fuel_date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="field">
                <label>Fuel Station</label>
                <input
                  name="fuel_station"
                  value={form.fuel_station}
                  onChange={handleChange}
                  placeholder="e.g. Shell Express #402"
                />
              </div>

              <div className="field">
                <label>Remarks</label>
                <textarea
                  name="remarks"
                  rows={2}
                  value={form.remarks}
                  onChange={handleChange}
                  placeholder="Optional notes or receipt references..."
                />
              </div>

              {formErr && <p className="form-error">{formErr}</p>}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
