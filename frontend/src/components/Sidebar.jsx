import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Truck, Package, Route, IdCard, Wrench, UserCheck,
  BarChart3, FileText, Bell, Settings, X, LogOut, Calendar, Fuel
} from 'lucide-react'
import { clearAuth } from '../utils/authStorage'

// Array configuration for central sidebar navigation links
const NAV_ITEMS = [
  { group: 'Workspace', icon: <LayoutDashboard size={16} />, label: 'Dashboard', path: '/' },
  { group: 'Operations', icon: <Truck size={16} />, label: 'Fleet', path: '/fleet' },
  { group: 'Operations', icon: <Package size={16} />, label: 'Shipments', path: '/shipments' },
  { group: 'Operations', icon: <Route size={16} />, label: 'Routes', path: '/routes' },
  { group: 'Operations', icon: <Calendar size={16} />, label: 'Trips', path: '/trips' },
  { group: 'Operations', icon: <IdCard size={16} />, label: 'Drivers', path: '/drivers' },
  { group: 'Operations', icon: <Wrench size={16} />, label: 'Maintenance', path: '/maintenance' },
  { group: 'Operations', icon: <Fuel size={16} />, label: 'Fuel Monitoring', path: '/fuel-records' },
  { group: 'Operations', icon: <UserCheck size={16} />, label: 'Driver Assignment', path: '/driver-assignments' },
  { group: 'Insights', icon: <BarChart3 size={16} />, label: 'Analytics', path: '/analytics' },
  { group: 'Insights', icon: <FileText size={16} />, label: 'Reports', path: '/reports' },
  { group: 'Workspace', icon: <Bell size={16} />, label: 'Notifications', path: '/notifications' },
  { group: 'Workspace', icon: <Settings size={16} />, label: 'Settings', path: '/settings' },
]

const Sidebar = ({ menuOpen, setMenuOpen }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
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
        {NAV_ITEMS.map((item, index) => (
          <React.Fragment key={item.label}>
            {(index === 0 || NAV_ITEMS[index - 1].group !== item.group) && (
              <div className="ff-nav-group-label">{item.group}</div>
            )}
            <NavLink
              to={item.path}
              className={({ isActive }) => `ff-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
              style={{ textDecoration: 'none' }}
            >
              <span className="ff-nav-icon">{item.icon}</span>
              <span className="ff-nav-label">{item.label}</span>
              {item.badge && <span className="ff-nav-badge">{item.badge}</span>}
            </NavLink>
          </React.Fragment>
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