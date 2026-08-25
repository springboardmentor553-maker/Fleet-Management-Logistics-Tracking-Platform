import { useState } from 'react'
import { UserCheck, Plus, CalendarCheck } from 'lucide-react'
import AssignDriverModal from '../components/AssignDriverModal'
import LogAttendanceModal from '../components/LogAttendanceModal'
import RowMenu from '../components/RowMenu'
import api from '../api/axios'
import { canEdit } from '../utils/permissions'
import { ASSIGNMENT_STATUS_BADGE, ATTENDANCE_STATUS_BADGE } from '../utils/assignmentStatus'

const MAIN_TABS = ['Assignments', 'Attendance']

const formatDate = (isoString) => {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatTime = (isoString) => {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

const DriverAssignments = ({
  drivers = [], vehicles = [],
  driverAssignments = [], driverAttendance = [],
  loading, search,
  onAssignmentAdded, onAssignmentDeleted,
  onAttendanceAdded, onAttendanceDeleted,
}) => {
  const [mainTab, setMainTab] = useState('Assignments')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [editingAttendance, setEditingAttendance] = useState(null)

  const driverName = (id) => drivers.find(d => d.id === id)?.name || '—'
  const vehicleReg = (id) => vehicles.find(v => v.id === id)?.registration_number || '—'

  const filteredAssignments = (driverAssignments || []).filter(a => {
    const dName = driverName(a.driver_id).toLowerCase()
    const vReg = vehicleReg(a.vehicle_id).toLowerCase()
    return dName.includes(search.toLowerCase()) || vReg.includes(search.toLowerCase())
  })

  const filteredAttendance = (driverAttendance || []).filter(r => {
    const dName = driverName(r.driver_id).toLowerCase()
    return dName.includes(search.toLowerCase())
  })

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Remove this assignment?')) return
    try {
      await api.delete(`/driver-assignments/${id}`)
      onAssignmentDeleted(id)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove assignment')
    }
  }

  const handleDeleteAttendance = async (id) => {
    if (!window.confirm('Delete this attendance record?')) return
    try {
      await api.delete(`/driver-attendance/${id}`)
      onAttendanceDeleted(id)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete attendance record')
    }
  }

  return (
    <div className="ff-section">
      <div className="ff-page-header">
        <div>
          <div className="ff-section-title"><UserCheck size={16} /><span>Driver Assignment</span></div>
          <p className="ff-page-subtitle">Assign drivers to vehicles and track attendance</p>
        </div>
        {canEdit() && (
          mainTab === 'Assignments' ? (
            <button className="ff-btn-primary" onClick={() => setShowAssignModal(true)}>
              <Plus size={15} /> Assign Driver
            </button>
          ) : (
            <button className="ff-btn-primary" onClick={() => setShowAttendanceModal(true)}>
              <CalendarCheck size={15} /> Log Attendance
            </button>
          )
        )}
      </div>

      <div className="ff-tabs">
        {MAIN_TABS.map(tab => (
          <button
            key={tab}
            className={`ff-tab ${mainTab === tab ? 'active' : ''}`}
            onClick={() => setMainTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {mainTab === 'Assignments' && (
        <div className="ff-table-wrap">
          <table className="ff-table">
            <thead>
              <tr>
                <th>Driver</th><th>Vehicle</th><th>Trip</th><th>Date</th><th>Status</th><th>Remarks</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.length === 0 && !loading && (
                <tr className="ff-empty-row"><td colSpan="7">No driver assignments match your search</td></tr>
              )}
              {filteredAssignments.map(a => {
                const badge = ASSIGNMENT_STATUS_BADGE[a.status] || { label: a.status, className: '' }
                return (
                  <tr key={a.id}>
                    <td className="ff-reg-cell" data-label="Driver">{driverName(a.driver_id)}</td>
                    <td data-label="Vehicle">{vehicleReg(a.vehicle_id)}</td>
                    <td data-label="Trip">{a.trip_id || '—'}</td>
                    <td data-label="Date">{formatDate(a.assignment_date)}</td>
                    <td data-label="Status">
                      <span className={`ff-badge ${badge.className}`}>{badge.label}</span>
                    </td>
                    <td data-label="Remarks">{a.remarks || '—'}</td>
                    <td data-label="" style={{ textAlign: 'right' }}>
                      {canEdit() && (
                        <RowMenu
                          onEdit={() => setEditingAssignment(a)}
                          onDelete={() => handleDeleteAssignment(a.id)}
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {mainTab === 'Attendance' && (
        <div className="ff-table-wrap">
          <table className="ff-table">
            <thead>
              <tr>
                <th>Driver</th><th>Date</th><th>Status</th><th>Check-In</th><th>Check-Out</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length === 0 && !loading && (
                <tr className="ff-empty-row"><td colSpan="6">No attendance records match your search</td></tr>
              )}
              {filteredAttendance.map(r => {
                const badge = ATTENDANCE_STATUS_BADGE[r.status] || { label: r.status, className: '' }
                return (
                  <tr key={r.id}>
                    <td className="ff-reg-cell" data-label="Driver">{driverName(r.driver_id)}</td>
                    <td data-label="Date">{formatDate(r.date)}</td>
                    <td data-label="Status">
                      <span className={`ff-badge ${badge.className}`}>{badge.label}</span>
                    </td>
                    <td data-label="Check-In">{formatTime(r.check_in_time)}</td>
                    <td data-label="Check-Out">{formatTime(r.check_out_time)}</td>
                    <td data-label="" style={{ textAlign: 'right' }}>
                      {canEdit() && (
                        <RowMenu
                          onEdit={() => setEditingAttendance(r)}
                          onDelete={() => handleDeleteAttendance(r.id)}
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAssignModal && (
        <AssignDriverModal
          drivers={drivers}
          vehicles={vehicles}
          onClose={() => setShowAssignModal(false)}
          onSuccess={(record) => onAssignmentAdded(record)}
        />
      )}
      {editingAssignment && (
        <AssignDriverModal
          drivers={drivers}
          vehicles={vehicles}
          recordToEdit={editingAssignment}
          onClose={() => setEditingAssignment(null)}
          onSuccess={(record, isEdit) => { if (isEdit) onAssignmentAdded(record, true) }}
        />
      )}

      {showAttendanceModal && (
        <LogAttendanceModal
          drivers={drivers}
          onClose={() => setShowAttendanceModal(false)}
          onSuccess={(record) => onAttendanceAdded(record)}
        />
      )}
      {editingAttendance && (
        <LogAttendanceModal
          drivers={drivers}
          recordToEdit={editingAttendance}
          onClose={() => setEditingAttendance(null)}
          onSuccess={(record, isEdit) => { if (isEdit) onAttendanceAdded(record, true) }}
        />
      )}
    </div>
  )
}

export default DriverAssignments
