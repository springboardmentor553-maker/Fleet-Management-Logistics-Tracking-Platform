import { useState, useEffect } from 'react'
import { Users as UsersIcon } from 'lucide-react'
import api from '../api/axios'
import { getCurrentUser } from '../utils/permissions'

const ROLES = ['admin', 'fleet_manager', 'driver', 'dispatcher']

export default function UsersManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const currentUser = getCurrentUser()

  useEffect(() => {
    api.get('/users/')
      .then(res => setUsers(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.put(`/users/${userId}/role`, { role: newRole })
      setUsers(prev => prev.map(u => u.id === userId ? res.data : u))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update role')
    }
  }

  return (
    <div className="ff-section">
      <div className="ff-page-header">
        <div>
          <div className="ff-section-title"><UsersIcon size={16} /><span>Users & Roles</span></div>
          <p className="ff-page-subtitle">Manage user accounts and permissions</p>
        </div>
      </div>

      {error && <div className="ff-modal-error">{error}</div>}

      <div className="ff-table-wrap">
        <table className="ff-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th></tr>
          </thead>
          <tbody>
            {!loading && users.map(u => (
              <tr key={u.id}>
                <td className="ff-reg-cell">{u.name}</td>
                <td>{u.email}</td>
                <td>
                  {u.id === currentUser?.id ? (
                    <span className="ff-badge status-in_use">{u.role} (you)</span>
                  ) : (
                    <select className="ff-select" value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}