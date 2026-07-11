import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, ChevronDown } from 'lucide-react'
import { getCurrentUser } from '../utils/permissions'

const roleLabels = {
  admin: 'Administrator',
  fleet_manager: 'Fleet Manager',
  driver: 'Driver',
  dispatcher: 'Dispatcher',
}

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const user = getCurrentUser()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }

  const renderAvatar = (size) => {
  if (user.photo_url) {
    return (
      <img
        src={`http://127.0.0.1:8000${user.photo_url}`}
        alt="Profile"
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
      />
    )
  }
  return <div className="ff-avatar" style={{ width: size, height: size }}>{initials(user.name)}</div>
}

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (!user) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className="ff-profile" style={{ cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        {renderAvatar(36)}
        <div className="ff-profile-text">
          <div className="ff-profile-name">{user.name}</div>
          <div className="ff-profile-role">{roleLabels[user.role] || user.role}</div>
        </div>
        <ChevronDown size={14} style={{ marginLeft: 4, color: 'var(--text-muted)' }} />
      </div>

      {open && (
        <div className="ff-profile-dropdown">
          <div className="ff-profile-dropdown-header">
            {renderAvatar(40)}
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{user.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
            </div>
          </div>
          <div className="ff-profile-dropdown-item" onClick={() => { setOpen(false); navigate('/profile') }}>
            <User size={15} /> View Profile
          </div>
          <div className="ff-profile-dropdown-item danger" onClick={handleLogout}>
            <LogOut size={15} /> Logout
          </div>
        </div>
      )}
    </div>
  )
}