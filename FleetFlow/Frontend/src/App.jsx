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

function getNavForRole(role) {
  if (role === 'driver') {
    return [
      { id: 'dashboard', label: 'My Dashboard', icon: '📊' },
      { id: 'shipments', label: 'My Shipments', icon: '📦' },
      { id: 'map',       label: 'Trip Map',     icon: '🗺️' },
    ]
  }
  if (role === 'fleet_manager') {
    return [
      { id: 'dashboard', label: 'Fleet Overview', icon: '📊' },
      { id: 'vehicles',  label: 'Vehicles',       icon: '🚛' },
      { id: 'drivers',   label: 'Drivers',        icon: '👤' },
      { id: 'trips',     label: 'Trips',          icon: '🛣️' },
      { id: 'map',       label: 'Live Map',       icon: '🗺️' },
    ]
  }
  if (role === 'dispatcher') {
    return [
      { id: 'dashboard', label: 'Dispatch Overview', icon: '📊' },
      { id: 'shipments', label: 'Shipments',         icon: '📦' },
      { id: 'trips',     label: 'Trips',             icon: '🛣️' },
      { id: 'drivers',   label: 'Drivers',           icon: '👤' },
      { id: 'map',       label: 'Live Map',          icon: '🗺️' },
    ]
  }
  return NAV
}

function ProfileDetails({ user }) {
  if (!user) {
    return (
      <div className="page-content">
        <div className="status-msg">Loading user profile information...</div>
      </div>
    )
  }

  const roleLabels = {
    admin: 'Administrator',
    fleet_manager: 'Fleet Manager',
    dispatcher: 'Logistics Dispatcher',
    driver: 'Fleet Driver',
  }

  const roleColors = {
    admin: '#f59e0b',
    fleet_manager: '#3b82f6',
    dispatcher: '#8b5cf6',
    driver: '#10b981',
  }

  return (
    <div className="page-content">
      <div className="profile-hero">
        <div className="avatar-badge">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="profile-hero-info">
          <h2>{user.name}</h2>
          <div className="role-pill" style={{ '--pill-color': roleColors[user.role] || '#6366f1' }}>
            {roleLabels[user.role] || user.role}
          </div>
          <p>{user.email}</p>
        </div>
      </div>

      <div className="page-header" style={{ marginTop: '24px' }}>
        <div>
          <h2>Account Details & Security</h2>
          <p>Verified profile credentials and system role permissions</p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card-fancy">
          <h3>User Credentials</h3>
          <div className="profile-row-fancy">
            <span className="row-label">Full Name</span>
            <span className="row-val">{user.name}</span>
          </div>
          <div className="profile-row-fancy">
            <span className="row-label">Email Address</span>
            <span className="row-val">{user.email}</span>
          </div>
          <div className="profile-row-fancy">
            <span className="row-label">Assigned Role</span>
            <span className="row-val role-highlight">{roleLabels[user.role] || user.role}</span>
          </div>
          <div className="profile-row-fancy">
            <span className="row-label">Account ID</span>
            <span className="row-val">#{user.id}</span>
          </div>
        </div>

        <div className="profile-card-fancy">
          <h3>Security & Authorization</h3>
          <div className="profile-row-fancy">
            <span className="row-label">Account Status</span>
            <span className={`status-badge ${user.is_active ? 'available' : 'cancelled'}`}>
              {user.is_active ? 'Active & Authorized' : 'Inactive'}
            </span>
          </div>
          <div className="profile-row-fancy">
            <span className="row-label">Authentication Method</span>
            <span className="row-val">JWT Bearer Token</span>
          </div>
          <div className="profile-row-fancy">
            <span className="row-label">Member Since</span>
            <span className="row-val">{new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="profile-row-fancy">
            <span className="row-label">Session Security</span>
            <span className="row-val green-text">● Active Session Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsPage({ user }) {
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [mapLabels, setMapLabels] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [soundAlerts, setSoundAlerts] = useState(false)

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>System & User Preferences</h2>
          <p>Configure live map overlays, notification alerts, and workspace preferences</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="setting-card">
          <div className="setting-header-icon">⚙️</div>
          <h3>Account Session</h3>
          <p className="setting-desc">Signed in as <strong>{user?.email ?? 'unknown'}</strong></p>
          <div className="setting-meta">Role: {user?.role ? user.role.toUpperCase() : 'USER'}</div>
        </div>

        <div className="setting-card">
          <div className="setting-header-icon">🗺️</div>
          <h3>Live Map Overlays</h3>
          <p className="setting-desc">Toggle location tags, ETA badges, and vehicle labels on map markers.</p>
          <button
            className={`btn-toggle ${mapLabels ? 'active' : ''}`}
            onClick={() => setMapLabels((prev) => !prev)}
          >
            {mapLabels ? '✓ Map Labels Enabled' : '✕ Map Labels Hidden'}
          </button>
        </div>

        <div className="setting-card">
          <div className="setting-header-icon">🔔</div>
          <h3>Logistics Email Alerts</h3>
          <p className="setting-desc">Receive real-time notifications for delayed shipments and vehicle dispatches.</p>
          <button
            className={`btn-toggle ${emailAlerts ? 'active' : ''}`}
            onClick={() => setEmailAlerts((prev) => !prev)}
          >
            {emailAlerts ? '✓ Email Alerts Enabled' : '✕ Email Alerts Disabled'}
          </button>
        </div>

        <div className="setting-card">
          <div className="setting-header-icon">🔄</div>
          <h3>Automatic Feed Refresh</h3>
          <p className="setting-desc">Automatically poll backend WebSocket status and GPS updates in background.</p>
          <button
            className={`btn-toggle ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh((prev) => !prev)}
          >
            {autoRefresh ? '✓ Auto-Refresh Active' : '✕ Manual Refresh Only'}
          </button>
        </div>

        <div className="setting-card">
          <div className="setting-header-icon">🔊</div>
          <h3>Sound Notifications</h3>
          <p className="setting-desc">Play audio tone when trip status changes or shipment is delivered.</p>
          <button
            className={`btn-toggle ${soundAlerts ? 'active' : ''}`}
            onClick={() => setSoundAlerts((prev) => !prev)}
          >
            {soundAlerts ? '✓ Sound Alerts Enabled' : '✕ Sound Alerts Muted'}
          </button>
        </div>

        <div className="setting-card">
          <div className="setting-header-icon">🌐</div>
          <h3>Platform Status</h3>
          <p className="setting-desc">FleetFlow API Version 1.0.0 · Connection Operational</p>
          <span className="status-badge available" style={{ alignSelf: 'flex-start', marginTop: '12px' }}>
            ● System Healthy
          </span>
        </div>
      </div>
    </div>
  )
}

function Layout({ user, onLogout, page, setPage, onViewTripMap, selectedTripId }) {
  const navItems = getNavForRole(user?.role)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>🚚</span>
          <span className="brand-name">FleetFlow</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((n) => (
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
        {page === 'dashboard' && (
          <Dashboard
            user={user}
            onNavigate={setPage}
            onViewTripMap={onViewTripMap}
            onViewLive={() => setPage('map')}
          />
        )}
        {page === 'shipments' && <Shipments user={user} onViewTripMap={onViewTripMap} />}
        {page === 'trips' && <Trips onViewTripMap={onViewTripMap} />}
        {page === 'vehicles' && <Vehicles />}
        {page === 'drivers' && <Drivers />}
        {page === 'map' && <LiveMap tripId={selectedTripId} user={user} />}
        {page === 'profile' && <ProfileDetails user={user} />}
        {page === 'settings' && <SettingsPage user={user} />}
      </main>
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('ff_token') || '')
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [selectedTripId, setSelectedTripId] = useState(null)

  useEffect(() => {
    if (!token) return
    getMe()
      .then((userData) => {
        setUser(userData)
        setPage('dashboard')
      })
      .catch(() => {
        localStorage.removeItem('ff_token')
        setToken('')
        setUser(null)
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
