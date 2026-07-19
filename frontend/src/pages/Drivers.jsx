import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IdCard, Plus, Phone, User, Users, Navigation, Star, Moon, Calendar, CheckCircle2 } from 'lucide-react'
import AddDriverModal from '../components/AddDriverModal'
import RowMenu from '../components/RowMenu'
import CustomSelect from '../components/CustomSelect'
import api from '../api/axios'
import { canEdit } from '../utils/permissions'

// Real performance rating (0–5 stars), calculated from each driver's shipment history.
// Cancelled shipments are excluded since they aren't a reflection of driver performance.
// Returns null when there isn't enough data yet, so the UI can show "No data" instead of a misleading 0.
function calculateRating(driverId, shipments) {
  const relevant = (shipments || []).filter(s => s.driver_id === driverId && s.status !== 'cancelled')
  if (relevant.length === 0) return null
  const delivered = relevant.filter(s => s.status === 'delivered').length
  return Math.round((delivered / relevant.length) * 5 * 10) / 10
}

function StarRating({ rating }) {
  if (rating === null || rating === undefined) {
    return <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>No data</span>
  }
  const rounded = Math.round(rating)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', gap: 1 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={13}
            fill={i <= rounded ? '#f5a623' : 'none'}
            color={i <= rounded ? '#f5a623' : 'var(--border)'}
          />
        ))}
      </div>
      <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>{rating}</span>
    </div>
  )
}

const Drivers = ({ drivers = [], shipments = [], trips = [], loading, search, onDriverAdded, onDriverDeleted }) => {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const safeDrivers = drivers || []

  const filteredDrivers = safeDrivers.filter(d => {
    const matchesSearch =
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.license_number?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (driverId) => {
    if (deletingId === driverId) return
    if (!window.confirm('Are you sure you want to delete this driver?')) return

    setDeletingId(driverId)
    try {
      await api.delete(`/drivers/${driverId}`)
      onDriverDeleted(driverId)
      alert('Driver deleted successfully!')
    } catch (err) {
      const reason = err.response?.data?.detail || 'Failed to delete driver'
      alert(reason)
    } finally {
      setDeletingId(null)
    }
  }

  const totalDrivers = safeDrivers.length
  const inactiveCount = safeDrivers.filter(d => d.status === 'inactive').length

  // Drivers currently on an ongoing trip — real data from the Trips module
  const onTripDriverIds = new Set((trips || []).filter(t => t.status === 'ongoing').map(t => t.driver_id))
  const onActiveTripCount = safeDrivers.filter(d => onTripDriverIds.has(d.id)).length

  // Average performance rating across all drivers who have at least one non-cancelled shipment
  const ratedDrivers = safeDrivers
    .map(d => calculateRating(d.id, shipments))
    .filter(r => r !== null)
  const avgRating = ratedDrivers.length > 0
    ? Math.round((ratedDrivers.reduce((a, b) => a + b, 0) / ratedDrivers.length) * 10) / 10
    : null

  const initials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }

  return (
    <div className="ff-section">
      <div className="ff-page-header">
        <div>
          <div className="ff-section-title"><IdCard size={16} /><span>Driver Management</span></div>
          <p className="ff-page-subtitle">Manage your drivers and track their performance</p>
        </div>
        {canEdit() && (
          <button className="ff-btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Driver
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="ff-stats" style={{ marginBottom: 18 }}>
        <div className="ff-stat-card">
          <div className="ff-stat-icon-box blue"><Users size={20} fill="currentColor" fillOpacity={0.1} /></div>
          <div className="ff-stat-text">
            <span className="ff-stat-label">Total Drivers</span>
            <span className="ff-stat-value">{loading ? '—' : totalDrivers}</span>
          </div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon-box green"><Navigation size={20} fill="currentColor" fillOpacity={0.1} /></div>
          <div className="ff-stat-text">
            <span className="ff-stat-label">On Active Trip</span>
            <span className="ff-stat-value">{loading ? '—' : onActiveTripCount}</span>
          </div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon-box orange"><Star size={20} fill="currentColor" fillOpacity={0.1} /></div>
          <div className="ff-stat-text">
            <span className="ff-stat-label">Avg. Rating</span>
            <span className="ff-stat-value">{loading ? '—' : (avgRating !== null ? avgRating : '—')}</span>
          </div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon-box dark-blue"><Moon size={20} /></div>
          <div className="ff-stat-text">
            <span className="ff-stat-label">Off Duty</span>
            <span className="ff-stat-value">{loading ? '—' : inactiveCount}</span>
          </div>
        </div>
      </div>

      <div className="ff-filter-bar">
        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
        <span className="ff-count-pill">{filteredDrivers.length} shown</span>
      </div>

      <div className="ff-driver-layout">
        {/* Table */}
        <div className="ff-table-wrap">
          <table className="ff-table">
            <thead>
              <tr><th>Driver</th><th>License Number</th><th>Phone</th><th>Performance</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filteredDrivers.length === 0 && !loading && (
                <tr className="ff-empty-row"><td colSpan="6">No drivers match your search</td></tr>
              )}
              {filteredDrivers.map(d => (
                <tr
                  key={d.id}
                  onClick={() => setSelectedDriver(d)}
                  style={{ cursor: 'pointer' }}
                  className={selectedDriver?.id === d.id ? 'ff-row-selected' : ''}
                >
                  <td data-label="Driver">
                    <div className="ff-driver-cell">
                      <div className="ff-driver-avatar">{initials(d.name)}</div>
                      <span style={{ fontWeight: '500' }}>{d.name}</span>
                    </div>
                  </td>
                  <td className="ff-reg-cell" data-label="License Number">{d.license_number}</td>
                  <td data-label="Phone">{d.phone || '—'}</td>
                  <td data-label="Performance"><StarRating rating={calculateRating(d.id, shipments)} /></td>
                  <td data-label="Status"><span className={`ff-badge status-${d.status}`}>{d.status}</span></td>
                  <td data-label="" style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    {canEdit() && (
                      <RowMenu
                        onEdit={() => setEditingDriver(d)}
                        onDelete={() => handleDelete(d.id)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail card */}
        {selectedDriver && (
          <div className="ff-driver-detail-card">
            <div className="ff-driver-detail-avatar">{initials(selectedDriver.name)}</div>
            <h3 style={{ margin: '10px 0 2px' }}>{selectedDriver.name}</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              License: {selectedDriver.license_number}
            </p>

            <div style={{ marginBottom: 12 }}>
              <StarRating rating={calculateRating(selectedDriver.id, shipments)} />
            </div>

            <div className="ff-driver-detail-row">
              <Phone size={14} />
              <span>{selectedDriver.phone || 'No phone on record'}</span>
            </div>
            <div className="ff-driver-detail-row">
              <User size={14} />
              <span className={`ff-badge status-${selectedDriver.status}`}>{selectedDriver.status}</span>
            </div>
            <div className="ff-driver-detail-row">
              <Calendar size={14} />
              <span>{selectedDriver.experience_years != null ? `${selectedDriver.experience_years} years experience` : 'Experience not recorded'}</span>
            </div>
            <div className="ff-driver-detail-row">
              <CheckCircle2 size={14} />
              <span>{selectedDriver.attendance_percentage != null ? `${selectedDriver.attendance_percentage}% attendance` : 'Attendance not recorded'}</span>
            </div>

            <button
              className="ff-btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
              onClick={() => navigate(`/drivers/${selectedDriver.id}`)}
            >
              View Full Profile
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <AddDriverModal
          onClose={() => setShowModal(false)}
          onSuccess={(driver) => onDriverAdded(driver)}
        />
      )}

      {editingDriver && (
        <AddDriverModal
          driverToEdit={editingDriver}
          onClose={() => setEditingDriver(null)}
          onSuccess={(driver, isEdit) => {
            if (isEdit) onDriverAdded(driver, true)
          }}
        />
      )}
    </div>
  )
}

export default Drivers
