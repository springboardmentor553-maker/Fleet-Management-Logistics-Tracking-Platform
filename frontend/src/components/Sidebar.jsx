import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Truck, Package, Route, IdCard, Wrench,
  BarChart3, FileText, Bell, Settings, X, LogOut, Calendar
} from 'lucide-react'

// Array configuration for central sidebar navigation links
const NAV_ITEMS = [
  { icon: <LayoutDashboard size={16} />, label: 'Dashboard', path: '/' },
  { icon: <Truck size={16} />, label: 'Fleet', path: '/fleet' },
  { icon: <Package size={16} />, label: 'Shipments', path: '/shipments' },
  { icon: <Route size={16} />, label: 'Routes', path: '/routes' },
  { icon: <Calendar size={16} />, label: 'Trips', path: '/trips' },
  { icon: <IdCard size={16} />, label: 'Drivers', path: '/drivers' },
  { icon: <Wrench size={16} />, label: 'Maintenance', path: '/maintenance' },
  { icon: <BarChart3 size={16} />, label: 'Analytics', path: '/analytics' },
  { icon: <FileText size={16} />, label: 'Reports', path: '/reports' },
  { icon: <Bell size={16} />, label: 'Notifications', path: '/notifications' },
  { icon: <Settings size={16} />, label: 'Settings', path: '/settings' },
]

const Sidebar = ({ menuOpen, setMenuOpen }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <aside className={`ff-sidebar ${menuOpen ? 'open' : ''}`}>
      <div className="ff-logo">
        <div className="ff-logo-layout-wrapper">
          <div className="ff-logo-icon"><Truck size={17} /></div>
          <span className="ff-logo-text">FleetFlow</span>
        </div>
        <button className="ff-sidebar-close-btn" onClick={() => setMenuOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <nav className="ff-nav">
        {NAV_ITEMS.map(item => (
          <NavLink 
            to={item.path}
            className={({ isActive }) => `ff-nav-item ${isActive ? 'active' : ''}`} 
            key={item.label}
            onClick={() => setMenuOpen(false)}
            style={{ textDecoration: 'none' }}
          >
            <span className="ff-nav-icon">{item.icon}</span>
            <span className="ff-nav-label">{item.label}</span>
            {item.badge && <span className="ff-nav-badge">{item.badge}</span>}
          </NavLink>
        ))}

        <div className="ff-nav-item ff-logout-btn" onClick={handleLogout}>
          <span className="ff-nav-icon"><LogOut size={16} /></span>
          <span className="ff-nav-label">Logout</span>
        </div>
      </nav>

      <div className="ff-sidebar-footer">FleetFlow v0.1</div>
    </aside>
  )
}

export default Sidebar