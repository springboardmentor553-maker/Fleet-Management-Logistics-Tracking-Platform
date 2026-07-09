import { useLocation, useNavigate } from 'react-router-dom'
import { clearStoredAuth } from '../services/api'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/drivers': 'Drivers',
  '/vehicles': 'Vehicles',
  '/shipments': 'Shipments',
  '/maintenance': 'Maintenance',
  '/reports': 'Reports',
  '/profile': 'Profile',
}

function getUserName() {
  try {
    const storedUser = localStorage.getItem('fleetflow_user')

    if (!storedUser) {
      return 'Admin'
    }

    const parsedUser = JSON.parse(storedUser)

    return (
      parsedUser?.name ||
      parsedUser?.fullName ||
      parsedUser?.username ||
      parsedUser?.email ||
      'Admin'
    )
  } catch {
    return 'Admin'
  }
}

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()

  const title = pageTitles[location.pathname] || 'FleetFlow'
  const userName = getUserName()

  const handleLogout = () => {
    clearStoredAuth()
    navigate('/login', { replace: true })
  }

  return (
    <div className="navbar" role="banner">
      <div className="navbar__section navbar__section--left">
        <div className="navbar__headingGroup">
          <p className="navbar__eyebrow">FleetFlow</p>
          <h1 className="navbar__title">{title}</h1>
        </div>
      </div>

      <div className="navbar__section navbar__section--center">
        <label className="navbar__search" aria-label="Search">
          <span className="navbar__searchIcon" aria-hidden="true">
            🔎
          </span>
          <input
            className="navbar__searchInput"
            type="search"
            placeholder="Search shipments, drivers, vehicles..."
          />
        </label>
      </div>

      <div className="navbar__section navbar__section--right">
        <button type="button" className="navbar__iconButton" aria-label="Notifications">
          <span className="navbar__icon" aria-hidden="true">
            🔔
          </span>
        </button>

        <div className="navbar__user" aria-label="Logged in user">
          <div className="navbar__avatar" aria-hidden="true">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="navbar__userName">{userName}</span>
        </div>

        <button type="button" className="navbar__logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}