import { useState } from 'react'
import { IdCard, Plus, Phone, User } from 'lucide-react'
import AddDriverModal from '../components/AddDriverModal'
import RowMenu from '../components/RowMenu'
import api from '../api/axios'
import { canEdit } from '../utils/permissions'

const Drivers = ({ drivers = [], loading, search, onDriverAdded, onDriverDeleted }) => {
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
  const activeCount = safeDrivers.filter(d => d.status === 'active').length
  const inactiveCount = safeDrivers.filter(d => d.status === 'inactive').length

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
      <div className="ff-driver-stats">
        <div className="ff-mini-stat">
          <span className="ff-mini-stat-label">Total Drivers</span>
          <span className="ff-mini-stat-value">{loading ? '—' : totalDrivers}</span>
        </div>
        <div className="ff-mini-stat">
          <span className="ff-mini-stat-label">Active</span>
          <span className="ff-mini-stat-value" style={{ color: 'var(--green)' }}>{loading ? '—' : activeCount}</span>
        </div>
        <div className="ff-mini-stat">
          <span className="ff-mini-stat-label">Inactive</span>
          <span className="ff-mini-stat-value" style={{ color: 'var(--text-muted)' }}>{loading ? '—' : inactiveCount}</span>
        </div>
      </div>

      <div className="ff-filter-bar">
        <select className="ff-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="ff-count-pill">{filteredDrivers.length} shown</span>
      </div>

      <div className="ff-driver-layout">
        {/* Table */}
        <div className="ff-table-wrap">
          <table className="ff-table">
            <thead>
              <tr><th>Driver</th><th>License Number</th><th>Phone</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filteredDrivers.length === 0 && !loading && (
                <tr className="ff-empty-row"><td colSpan="4">No drivers match your search</td></tr>
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
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              License: {selectedDriver.license_number}
            </p>

            <div className="ff-driver-detail-row">
              <Phone size={14} />
              <span>{selectedDriver.phone || 'No phone on record'}</span>
            </div>
            <div className="ff-driver-detail-row">
              <User size={14} />
              <span className={`ff-badge status-${selectedDriver.status}`}>{selectedDriver.status}</span>
            </div>

            <button className="ff-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
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