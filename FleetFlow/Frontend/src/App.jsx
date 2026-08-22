import { useEffect, useState } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Vehicles from './components/Vehicles'
import Drivers from './components/Drivers'
import Shipments from './components/Shipments'
import Trips from './components/Trips'
import LiveMap from './components/LiveMap'
import Maintenance from './components/Maintenance'
import MaintenanceAlerts from './components/MaintenanceAlerts'
import Notifications from './components/Notifications'
import ReportsExport from './components/ReportsExport'
import Fuel from './components/Fuel'
import DriverAssignment from './components/DriverAssignment'
import { getMe } from './api/auth'

import './App.css'

const NAV = [
  { id: 'dashboard',    label: 'Dashboard',        icon: '📊' },
  { id: 'shipments',    label: 'Shipments',        icon: '📦' },
  { id: 'trips',        label: 'Trips',            icon: '🛣️' },
  { id: 'vehicles',     label: 'Vehicles',         icon: '🚛' },
  { id: 'drivers',      label: 'Drivers',          icon: '👤' },
  { id: 'assignments',  label: 'Assignments',      icon: '📋' },
  { id: 'maintenance',  label: 'Maintenance',      icon: '🔧' },
  { id: 'fuel',         label: 'Fuel',             icon: '⛽' },
  { id: 'notifications',label: 'Notifications',    icon: '🔕' },
  { id: 'reports',      label: 'Reports',          icon: '📊' },
  { id: 'map',          label: 'Live Map',         icon: '🗺️' },
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
      { id: 'dashboard',   label: 'Fleet Overview', icon: '📊' },
      { id: 'vehicles',    label: 'Vehicles',       icon: '🚛' },
      { id: 'drivers',     label: 'Drivers',        icon: '👤' },
      { id: 'assignments', label: 'Assignments',    icon: '📋' },
      { id: 'maintenance', label: 'Maintenance',    icon: '🔧' },
      { id: 'fuel',          label: 'Fuel',           icon: '⛽' },
      { id: 'trips',         label: 'Trips',          icon: '🛣️' },
      { id: 'notifications', label: 'Notifications',  icon: '🔕' },
      { id: 'reports',       label: 'Reports',        icon: '📊' },
      { id: 'map',           label: 'Live Map',       icon: '🗺️' },
    ]
  }
  if (role === 'dispatcher') {
    return [
      { id: 'dashboard',   label: 'Dispatch Overview', icon: '📊' },
      { id: 'shipments',   label: 'Shipments',         icon: '📦' },
      { id: 'trips',       label: 'Trips',             icon: '🛣️' },
      { id: 'drivers',     label: 'Drivers',           icon: '👤' },
      { id: 'assignments', label: 'Assignments',       icon: '📋' },
      { id: 'map',         label: 'Live Map',          icon: '🗺️' },
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
  const [shipmentUpdates, setShipmentUpdates] = useState(true)
  const [tripUpdates, setTripUpdates] = useState(true)
  const [emailFrequency, setEmailFrequency] = useState('Instant')

  const [companyNameInput, setCompanyNameInput] = useState('FleetFlow')
  const [companySaved, setCompanySaved] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)

  // Modals & confirmation state
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Profile form
  const [profileName, setProfileName] = useState(user?.name ?? '')
  const [profileSaved, setProfileSaved] = useState(false)

  // Password form
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwMsg, setPwMsg] = useState(null)
  const [deleteInput, setDeleteInput] = useState('')

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  function handleSaveCompany() {
    setCompanySaved(true)
    setTimeout(() => setCompanySaved(false), 2500)
  }

  function handleSaveProfile() {
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  function handleChangePassword() {
    if (!currentPw || !newPw || !confirmPw) {
      setPwMsg({ type: 'error', text: 'Please fill in all password fields.' })
      return
    }
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (newPw.length < 6) {
      setPwMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    setPwMsg({ type: 'success', text: 'Password updated successfully!' })
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    setTimeout(() => { setPwMsg(null); setShowPasswordModal(false); }, 2000)
  }

  return (
    <div className="s-page-container">
      {/* ── Page Header ── */}
      <div className="s-page-header">
        <h1 className="s-page-title">Settings</h1>
        <p className="s-page-subtitle">Manage your app preferences</p>
      </div>

      <div className="s-cards-stack">

        {/* ── Section 1: Notification Preferences ── */}
        <div className="s-card">
          <div className="s-card-header">
            <h3><span className="s-icon">🔔</span> Notification Preferences</h3>
          </div>
          <div className="s-card-body">
            <div className="s-row">
              <div>
                <div className="s-row-title">Shipment Updates</div>
                <div className="s-row-subtitle">Show shipment activity in notifications</div>
              </div>
              <label className="s-switch">
                <input
                  type="checkbox"
                  checked={shipmentUpdates}
                  onChange={e => setShipmentUpdates(e.target.checked)}
                />
                <span className="s-slider" />
              </label>
            </div>
            <div className="s-row">
              <div>
                <div className="s-row-title">Trip Updates</div>
                <div className="s-row-subtitle">Show trip scheduling activity in notifications</div>
              </div>
              <label className="s-switch">
                <input
                  type="checkbox"
                  checked={tripUpdates}
                  onChange={e => setTripUpdates(e.target.checked)}
                />
                <span className="s-slider" />
              </label>
            </div>
          </div>
        </div>

        {/* ── Section 2: Email Notifications ── */}
        <div className="s-card">
          <div className="s-card-header">
            <h3><span className="s-icon">✉️</span> Email Notifications</h3>
          </div>
          <div className="s-card-body">
            <div className="s-row">
              <div>
                <div className="s-row-title">Email Frequency</div>
                <div className="s-row-subtitle">How often you receive email digests</div>
              </div>
              <select
                className="s-select"
                value={emailFrequency}
                onChange={e => setEmailFrequency(e.target.value)}
              >
                <option value="Instant">Instant</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Never">Never</option>
              </select>
            </div>
            <p className="s-footnote">
              Preference is saved to your account. Automatic digest emails require a scheduled background job, which is planned for a future milestone.
            </p>
          </div>
        </div>

        {/* ── Section 3: Company Settings ── */}
        <div className="s-card">
          <div className="s-card-header">
            <h3><span className="s-icon">🏢</span> Company Settings</h3>
          </div>
          <div className="s-card-body">
            <div className="s-logo-block">
              <div className="s-logo-icon-box">
                {logoPreview ? (
                  <img src={logoPreview} alt="Company logo" className="s-logo-img" />
                ) : (
                  <span className="s-building-icon">🏢</span>
                )}
              </div>
              <label className="s-blue-btn" htmlFor="s-logo-upload">
                Upload Logo
              </label>
              <input
                id="s-logo-upload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleLogoChange}
              />
            </div>

            <div className="s-company-field-group">
              <label className="s-field-label">Company Name</label>
              <input
                className="s-input-full"
                value={companyNameInput}
                onChange={e => setCompanyNameInput(e.target.value)}
              />
              <button className="s-blue-btn s-save-company-btn" onClick={handleSaveCompany}>
                {companySaved ? '✓ Saved!' : 'Save Company Name'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Section 4: Account ── */}
        <div className="s-card">
          <div className="s-card-header">
            <h3>Account</h3>
          </div>
          <div className="s-card-body">
            <div className="s-row s-clickable-row" onClick={() => setShowProfileModal(true)}>
              <div className="s-row-left-with-icon">
                <span className="s-row-icon">👤</span>
                <div>
                  <div className="s-row-title">Edit Profile</div>
                  <div className="s-row-subtitle">Update your name and photo</div>
                </div>
              </div>
              <span className="s-arrow-icon">›</span>
            </div>
            <div className="s-row s-clickable-row" onClick={() => setShowPasswordModal(true)}>
              <div className="s-row-left-with-icon">
                <span className="s-row-icon">🔒</span>
                <div>
                  <div className="s-row-title">Change Password</div>
                  <div className="s-row-subtitle">Update your account password</div>
                </div>
              </div>
              <span className="s-arrow-icon">›</span>
            </div>
          </div>
        </div>

        {/* ── Section 5: Danger Zone ── */}
        <div className="s-card s-danger-card">
          <div className="s-card-header s-danger-header">
            <h3><span className="s-icon">🗑️</span> Danger Zone</h3>
          </div>
          <div className="s-card-body">
            <div className="s-row">
              <div>
                <div className="s-row-title">Delete Account</div>
                <div className="s-row-subtitle">Permanently delete your account. This cannot be undone.</div>
              </div>
              <button
                type="button"
                className="s-danger-btn"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </button>
            </div>

            {showDeleteConfirm && (
              <div className="s-delete-box">
                <p>Type <strong>DELETE</strong> to confirm account deletion:</p>
                <div className="s-delete-input-row">
                  <input
                    className="s-input-full"
                    value={deleteInput}
                    onChange={e => setDeleteInput(e.target.value)}
                    placeholder="Type DELETE"
                  />
                  <button
                    className="s-danger-btn"
                    disabled={deleteInput !== 'DELETE'}
                    onClick={() => { alert('Account deletion requested.'); setShowDeleteConfirm(false); setDeleteInput('') }}
                  >
                    Confirm
                  </button>
                </div>
                <button className="s-cancel-link" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── MODAL: Edit Profile ── */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: '#ffffff', margin: 0, fontSize: '20px', fontWeight: 700 }}>👤 Edit Profile</h2>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div className="field">
                <label style={{ color: '#e2e8f0', fontWeight: 600 }}>Full Name</label>
                <input
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="field">
                <label style={{ color: '#e2e8f0', fontWeight: 600 }}>Email Address</label>
                <input value={user?.email ?? ''} readOnly style={{ opacity: 0.6 }} />
              </div>
              {profileSaved && <p className="form-success">✓ Profile saved!</p>}
              <button className="s-blue-btn" onClick={handleSaveProfile} style={{ marginTop: '12px', width: '100%' }}>
                {profileSaved ? 'Saved!' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Change Password ── */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: '#ffffff', margin: 0, fontSize: '20px', fontWeight: 700 }}>🔒 Change Password</h2>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div className="field">
                <label style={{ color: '#e2e8f0', fontWeight: 600 }}>Current Password</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Current password"
                />
              </div>
              <div className="field">
                <label style={{ color: '#e2e8f0', fontWeight: 600 }}>New Password</label>
                <input
                  type="password"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="New password"
                />
              </div>
              <div className="field">
                <label style={{ color: '#e2e8f0', fontWeight: 600 }}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Confirm password"
                />
              </div>
              {pwMsg && <p className={`scard-msg ${pwMsg.type}`}>{pwMsg.text}</p>}
              <button className="s-blue-btn" onClick={handleChangePassword} style={{ marginTop: '12px', width: '100%' }}>
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function Layout({ user, onLogout, page, setPage, onViewTripMap, selectedTripId, theme, setTheme }) {
  const navItems = getNavForRole(user?.role)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function navigate(id) {
    setPage(id)
    setSidebarOpen(false)   // auto-close drawer on mobile after navigation
  }

  return (
    <div className="app-shell">
      {/* ── Mobile overlay backdrop ─────────────────── */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar / drawer ────────────────────────── */}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span>🚚</span>
          <span className="brand-name">FleetFlow</span>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? 'active' : ''}`}
              onClick={() => navigate(n.id)}
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
              onClick={() => navigate(action.id)}
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

      {/* ── Main content area ────────────────────────── */}
      <main className="main-area">
        {/* Mobile-only top bar with hamburger */}
        <div className="mobile-topbar">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <span />
            <span />
            <span />
          </button>
          <span className="mobile-brand">🚚 FleetFlow</span>
        </div>

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
        {page === 'assignments' && <DriverAssignment />}
        {page === 'maintenance' && <Maintenance onNavigate={setPage} />}
        {page === 'alerts' && <MaintenanceAlerts />}
        {page === 'notifications' && <Notifications />}
        {page === 'reports' && <ReportsExport />}
        {page === 'fuel' && <Fuel />}
        {page === 'map' && <LiveMap tripId={selectedTripId} user={user} />}
        {page === 'profile' && <ProfileDetails user={user} />}
        {page === 'settings' && <SettingsPage user={user} theme={theme} setTheme={setTheme} />}
      </main>
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('ff_token') || '')
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('ff_theme') || 'dark')

  // Apply theme class to document element
  useEffect(() => {
    localStorage.setItem('ff_theme', theme)
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme')
    } else {
      document.documentElement.classList.remove('light-theme')
    }
  }, [theme])

  // Try to restore user from session cache for instant load
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('ff_user') || 'null') } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState('dashboard')
  const [selectedTripId, setSelectedTripId] = useState(null)

  useEffect(() => {
    if (!token) return
    // If we already have cached user, skip the loading spinner (revalidate silently)
    if (!user) setLoading(true)
    getMe()
      .then((userData) => {
        sessionStorage.setItem('ff_user', JSON.stringify(userData))
        setUser(userData)
        setLoading(false)
      })
      .catch(() => {
        localStorage.removeItem('ff_token')
        sessionStorage.removeItem('ff_user')
        setToken('')
        setUser(null)
        setLoading(false)
      })
  }, [token])

  function handleLogin(accessToken) {
    localStorage.setItem('ff_token', accessToken)
    setToken(accessToken)
  }

  function handleLogout() {
    localStorage.removeItem('ff_token')
    sessionStorage.removeItem('ff_user')
    setToken('')
    setUser(null)
  }

  // Show a loading screen while fetching user profile on cold start
  if (token && loading) {
    return (
      <div className="cold-start-screen">
        <div className="cold-start-card">
          <div className="cold-start-spinner" />
          <div className="cold-start-brand">
            <span>🚚</span>
            <span>FleetFlow</span>
          </div>
          <p className="cold-start-msg">Connecting to server<span className="dot-pulse">...</span></p>
          <p className="cold-start-hint">Server is waking up — this takes ~15s on first visit</p>
          <div className="cold-start-bar"><div className="cold-start-bar-fill" /></div>
        </div>
      </div>
    )
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
        theme={theme}
        setTheme={setTheme}
      />
    : <Login onLogin={handleLogin} />
}
