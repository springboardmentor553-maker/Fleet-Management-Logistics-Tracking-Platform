// New file: frontend/src/pages/FuelRecords.jsx
import { useState, useEffect } from 'react'
import { Fuel, Plus, Droplet, IndianRupee, Gauge } from 'lucide-react'
import AddFuelModal from '../components/AddFuelModal'
import RowMenu from '../components/RowMenu'
import api from '../api/axios'
import { canEdit } from '../utils/permissions'

const formatDate = (isoString) => {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

const StatCard = ({ icon, label, value, color }) => (
  <div className="ff-stat-card">
    <div className={`ff-stat-icon-box ${color}`}>{icon}</div>
    <div className="ff-stat-text">
      <span className="ff-stat-label">{label}</span>
      <span className="ff-stat-value">{value}</span>
    </div>
  </div>
)

export default function FuelRecords({ vehicles = [], drivers = [], search = '' }) {
  const [fuelRecords, setFuelRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)

  const fetchFuelRecords = () => {
    setLoading(true)
    api.get('/fuel/')
      .then(res => setFuelRecords(res.data))
      .catch(err => console.log('Failed to fetch fuel records:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchFuelRecords()
  }, [])

  const vehicleReg = (id) => vehicles.find(v => v.id === id)?.registration_number || '—'
  const driverName = (id) => drivers.find(d => d.id === id)?.name || '—'

  const filteredRecords = fuelRecords.filter(r => {
    const reg = vehicleReg(r.vehicle_id).toLowerCase()
    const dName = driverName(r.driver_id).toLowerCase()
    const station = (r.fuel_station || '').toLowerCase()
    const q = search.toLowerCase()
    return reg.includes(q) || dName.includes(q) || station.includes(q)
  })

  const handleDelete = async (recordId) => {
    if (!window.confirm('Delete this fuel record?')) return
    try {
      await api.delete(`/fuel/${recordId}`)
      setFuelRecords(prev => prev.filter(r => r.id !== recordId))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete fuel record')
    }
  }

  const handleAdded = (record, isEdit = false) => {
    if (isEdit) {
      setFuelRecords(prev => prev.map(r => r.id === record.id ? record : r))
    } else {
      setFuelRecords(prev => [record, ...prev])
    }
  }

  const totalRecords = fuelRecords.length
  const totalLiters = fuelRecords.reduce((sum, r) => sum + r.fuel_quantity, 0)
  const totalCost = fuelRecords.reduce((sum, r) => sum + r.fuel_cost, 0)
  const avgConsumption = totalRecords > 0 ? (totalLiters / totalRecords) : 0

  return (
    <div className="ff-section">
      <div className="ff-page-header">
        <div>
          <div className="ff-section-title"><Fuel size={16} /><span>Fuel Monitoring</span></div>
          <p className="ff-page-subtitle">Track fuel consumption and cost across your fleet</p>
        </div>
        {canEdit() && (
          <button className="ff-btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Fuel Record
          </button>
        )}
      </div>

      <div className="ff-stats" style={{ marginBottom: 18 }}>
        <StatCard icon={<Droplet size={20} />} label="Total Fuel Consumed" value={loading ? '—' : `${totalLiters.toFixed(1)} L`} color="blue" />
        <StatCard icon={<IndianRupee size={20} />} label="Total Fuel Cost" value={loading ? '—' : `₹${totalCost.toLocaleString()}`} color="green" />
        <StatCard icon={<Gauge size={20} />} label="Avg. Consumption / Fill-up" value={loading ? '—' : `${avgConsumption.toFixed(1)} L`} color="orange" />
        <StatCard icon={<Fuel size={20} />} label="Total Records" value={loading ? '—' : totalRecords} color="dark-blue" />
      </div>

      <div className="ff-filter-bar">
        <span className="ff-count-pill">{filteredRecords.length} shown</span>
      </div>

      <div className="ff-table-wrap">
        <table className="ff-table">
          <thead>
            <tr>
              <th>Vehicle</th><th>Driver</th><th>Quantity</th><th>Cost</th><th>Odometer</th><th>Date</th><th>Station</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 && !loading && (
              <tr className="ff-empty-row"><td colSpan="8">No fuel records match your search</td></tr>
            )}
            {filteredRecords.map(r => (
              <tr key={r.id}>
                <td className="ff-reg-cell" data-label="Vehicle">{vehicleReg(r.vehicle_id)}</td>
                <td data-label="Driver">{driverName(r.driver_id)}</td>
                <td data-label="Quantity">{r.fuel_quantity} L</td>
                <td data-label="Cost">₹{r.fuel_cost.toLocaleString()}</td>
                <td data-label="Odometer">{r.odometer_reading != null ? `${r.odometer_reading} km` : '—'}</td>
                <td data-label="Date">{formatDate(r.fuel_date)}</td>
                <td data-label="Station">{r.fuel_station || '—'}</td>
                <td data-label="" style={{ textAlign: 'right' }}>
                  {canEdit() && (
                    <RowMenu
                      onEdit={() => setEditingRecord(r)}
                      onDelete={() => handleDelete(r.id)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AddFuelModal
          vehicles={vehicles}
          drivers={drivers}
          onClose={() => setShowModal(false)}
          onSuccess={(record) => handleAdded(record)}
        />
      )}

      {editingRecord && (
        <AddFuelModal
          vehicles={vehicles}
          drivers={drivers}
          recordToEdit={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSuccess={(record, isEdit) => handleAdded(record, isEdit)}
        />
      )}
    </div>
  )
}
