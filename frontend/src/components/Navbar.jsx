import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { clearStoredAuth } from '../services/api'
import { Search, Bell, ChevronDown, LogOut, User } from 'lucide-react'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/users': 'User Accounts',
  '/drivers': 'Drivers',
  '/vehicles': 'Vehicles',
  '/shipments': 'Shipments',
  '/trips': 'Trips & Assignments',
  '/maintenance': 'Maintenance',
  '/reports': 'Reports',
  '/profile': 'Profile',
  '/403': 'Access Denied',
}


function getUserDetails() {
  try {
    const storedUser = localStorage.getItem('fleetflow_user')

    if (!storedUser) {
      return { name: 'Admin', role: 'Fleet Manager', email: 'admin@fleetflow.com' }
    }

    const parsedUser = JSON.parse(storedUser)

    return {
      name: parsedUser?.name || parsedUser?.fullName || parsedUser?.username || parsedUser?.email?.split('@')[0] || 'Admin',
      role: parsedUser?.role || 'Fleet Manager',
      email: parsedUser?.email || 'admin@fleetflow.com'
    }
  } catch {
    return { name: 'Admin', role: 'Fleet Manager', email: 'admin@fleetflow.com' }
  }
}

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const title = pageTitles[location.pathname] || 'FleetFlow'
  const user = getUserDetails()

  const handleLogout = () => {
    clearStoredAuth()
    navigate('/login', { replace: true })
  }

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="navbar" role="banner" style={{ position: 'relative' }}>
      {/* Title */}
      <div className="navbar__section navbar__section--left">
        <h1 className="navbar__title">{title}</h1>
      </div>

      {/* Global Search Bar */}
      <div className="navbar__section navbar__section--center">
        <label className="navbar__search" htmlFor="navbar-global-search">
          <Search className="navbar__searchIcon" aria-hidden="true" />
          <input
            id="navbar-global-search"
            className="navbar__searchInput"
            type="search"
            placeholder="Search shipments, drivers, vehicles..."
          />
        </label>
      </div>

      {/* Action Icons and User Profile */}
      <div className="navbar__section navbar__section--right">
        {/* Notifications */}
        <button type="button" className="navbar__iconButton" aria-label="Notifications">
          <Bell className="navbar__iconButton-svg" aria-hidden="true" />
        </button>

        {/* User Dropdown Group */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            className="navbar__user-profile"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="User account menu"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none' }}
          >
            <div className="navbar__avatar" aria-hidden="true">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="navbar__user-info">
              <span className="navbar__userName">{user.name}</span>
              <span className="navbar__userRole">{user.role}</span>
            </div>
            <ChevronDown style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '200px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 50,
                overflow: 'hidden',
                animation: 'scaleUp 0.15s ease-out'
              }}
              role="menu"
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: '#FAFCFD' }}>
                <p style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false)
                  navigate('/profile')
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--text-main)',
                  transition: 'background-color 0.15s ease'
                }}
                role="menuitem"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <User style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
                View Profile
              </button>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--danger-text)',
                  borderTop: '1px solid var(--border-color)',
                  transition: 'background-color 0.15s ease'
                }}
                role="menuitem"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut style={{ width: '16px', height: '16px', color: 'var(--danger)' }} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}