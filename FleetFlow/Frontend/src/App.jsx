import { useState } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Vehicles from './components/Vehicles'
import Drivers from './components/Drivers'
import Wireframes from './components/Wireframes'
import './App.css'

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',  icon: '📊' },
  { id: 'vehicles',   label: 'Vehicles',   icon: '🚛' },
  { id: 'drivers',    label: 'Drivers',    icon: '👤' },
  { id: 'wireframes', label: 'Wireframes', icon: '🖼️' },
]

function Layout({ onLogout }) {
  const [page, setPage] = useState('dashboard')

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
        <button className="sidebar-logout" onClick={onLogout}>
          <span>🚪</span> Logout
        </button>
      </aside>

      <main className="main-area">
        {page === 'dashboard'  && <Dashboard />}
        {page === 'vehicles'   && <Vehicles />}
        {page === 'drivers'    && <Drivers />}
        {page === 'wireframes' && <Wireframes />}
      </main>
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('ff_token') || '')

  function handleLogin(accessToken) {
    localStorage.setItem('ff_token', accessToken)
    setToken(accessToken)
  }

  function handleLogout() {
    localStorage.removeItem('ff_token')
    setToken('')
  }

  return token
    ? <Layout onLogout={handleLogout} />
    : <Login onLogin={handleLogin} />
}
