import { useEffect, useState } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Vehicles from './components/Vehicles'
import Drivers from './components/Drivers'
import Shipments from './components/Shipments'
import Trips from './components/Trips'
import LiveMap from './components/LiveMap'
import { getMe } from './api/auth'

import './App.css'

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',  icon: '📊' },
  { id: 'shipments',  label: 'Shipments',  icon: '📦' },
  { id: 'trips',      label: 'Trips',      icon: '🛣️' },
  { id: 'vehicles',   label: 'Vehicles',   icon: '🚛' },
  { id: 'drivers',    label: 'Drivers',    icon: '👤' },
  { id: 'map',        label: 'Live Map',   icon: '🗺️' },
]

const FOOTER_ACTIONS = [
  { id: 'profile',  label: 'Profile',  icon: '👤' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

function ProfileDetails({ user }) {
  if (!user) {
    return (
      <div className="page-content">
        <div className="status-msg">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>My Profile</h2>
          <p>Details for the currently logged in user</p>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-row">
          <span>Name</span>
          <strong>{user.name}</strong>
        </div>
        <div className="profile-row">
          <span>Email</span>
          <strong>{user.email}</strong>
        </div>
        <div className="profile-row">
          <span>Role</span>
          <strong>{user.role}</strong>
        </div>
        <div className="profile-row">
          <span>Status</span>
          <strong>{user.is_active ? 'Active' : 'Inactive'}</strong>
        </div>
        <div className="profile-row">
          <span>Joined</span>
          <strong>{new Date(user.created_at).toLocaleDateString()}</strong>
        </div>
      </div>
    </div>
  )
}

function SettingsPage({ user }) {
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [mapLabels, setMapLabels] = useState(true)

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p>Customize how FleetFlow works for you</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="setting-card">
          <h3>Account</h3>
          <p>Signed in as {user?.email ?? 'unknown'} ({user?.role ?? 'role'})</p>
        </div>

        <div className="setting-card">
          <h3>Live map labels</h3>
          <p>Show or hide route and status labels on the live map.</p>
          <button className="btn-primary" onClick={() => setMapLabels((prev) => !prev)}>
            {mapLabels ? 'Hide map labels' : 'Show map labels'}
          </button>
        </div>

        <div className="setting-card">
          <h3>Email alerts</h3>
          <p>Receive notifications for vehicle updates and shipment changes.</p>
          <button className="btn-primary" onClick={() => setEmailAlerts((prev) => !prev)}>
            {emailAlerts ? 'Disable email alerts' : 'Enable email alerts'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Layout({ user, onLogout, page, setPage, onViewTripMap, selectedTripId }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>🚚</span>
          <span className="brand-name">FleetFlow</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? 'active' : ''}`}
              onClick={() => setPage(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {FOOTER_ACTIONS.map((action) => (
            <button
              key={action.id}
              className={`sidebar-action ${page === action.id ? 'active' : ''}`}
              onClick={() => setPage(action.id)}
            >
              <span>{action.icon}</span>
              {action.label}
            </button>
          ))}

          <button className="sidebar-logout" onClick={onLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      <main className="main-area">
        {page === 'dashboard' && <Dashboard onViewLive={() => setPage('map')} />}
        {page === 'shipments' && <Shipments />}
        {page === 'trips' && <Trips onViewTripMap={onViewTripMap} />}
        {page === 'vehicles' && <Vehicles />}
        {page === 'drivers' && <Drivers />}
        {page === 'map' && <LiveMap tripId={selectedTripId} />}
        {page === 'profile' && <ProfileDetails user={user} />}
        {page === 'settings' && <SettingsPage user={user} />}
      </main>
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('ff_token') || '')
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!token) return
    getMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('ff_token')
        setToken('')
      })
  }, [token])

  function handleLogin(accessToken) {
    localStorage.setItem('ff_token', accessToken)
    setToken(accessToken)
  }

  function handleLogout() {
    localStorage.removeItem('ff_token')
    setToken('')
    setUser(null)
  }

  const [page, setPage] = useState('dashboard')
  const [selectedTripId, setSelectedTripId] = useState(null)

  return token
    ? <Layout
        user={user}
        page={page}
        setPage={setPage}
        selectedTripId={selectedTripId}
        onViewTripMap={(tripId) => {
          setSelectedTripId(tripId)
          setPage('map')
        }}
        onLogout={handleLogout}
      />
    : <Login onLogin={handleLogin} />
}
