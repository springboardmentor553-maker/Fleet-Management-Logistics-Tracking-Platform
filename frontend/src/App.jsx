import { useState, useEffect } from 'react'
import axios from 'axios'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import {
  LayoutDashboard, Truck, Package, Route, IdCard, Wrench,
  BarChart3, FileText, Bell, Settings, Search, Moon, Sun,
  MoreVertical, MapPin, CheckCircle2, Menu, X
} from 'lucide-react'
import './App.css'

const STATUS_MAPPING = {
  available: { label: 'Running', color: '#1a9c5c' },
  in_use: { label: 'Idle', color: '#c9820a' },
  maintenance: { label: 'Maintenance', color: '#dc4444' }
}

const SHIPMENT_STATUS = [
  { label: 'Delivered', count: 12, pct: 57, color: '#1a9c5c', bg: '#e7f9ee' },
  { label: 'In Transit', count: 6, pct: 29, color: '#2f6fed', bg: '#e8f1fe' },
  { label: 'Delayed', count: 2, pct: 10, color: '#c9820a', bg: '#fff3e6' },
  { label: 'Cancelled', count: 1, pct: 4, color: '#dc4444', bg: '#fdeaea' },
]

const RECENT_ACTIVITY = [
  { icon: <Truck size={14} />, bg: 'var(--cyan-bg)', color: 'var(--accent)', text: 'Driver John started trip from Delhi to Mumbai', time: '10 min ago' },
  { icon: <Package size={14} />, bg: 'var(--green-bg)', color: 'var(--green)', text: 'Shipment SHP-00123 delivered successfully', time: '1 hr ago' },
  { icon: <Wrench size={14} />, bg: 'var(--amber-bg)', color: 'var(--amber)', text: 'Maintenance due for a fleet vehicle', time: '2 hr ago' },
]

const UPCOMING_MAINTENANCE = [
  { vehicle: '—', service: 'Oil Change', status: 'due_soon' },
  { vehicle: '—', service: 'Brake Service', status: 'due_soon' },
  { vehicle: '—', service: 'Tire Replacement', status: 'upcoming' },
]

const NAV_ITEMS = [
  { icon: <LayoutDashboard size={16} />, label: 'Dashboard', active: true },
  { icon: <Truck size={16} />, label: 'Fleet' },
  { icon: <Package size={16} />, label: 'Shipments' },
  { icon: <Route size={16} />, label: 'Routes' },
  { icon: <IdCard size={16} />, label: 'Drivers' },
  { icon: <Wrench size={16} />, label: 'Maintenance' },
  { icon: <BarChart3 size={16} />, label: 'Analytics' },
  { icon: <FileText size={16} />, label: 'Reports' },
  { icon: <Bell size={16} />, label: 'Notifications', badge: 5 },
  { icon: <Settings size={16} />, label: 'Settings' },
]

function App() {
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      axios.get('http://127.0.0.1:8000/vehicles/'),
      axios.get('http://127.0.0.1:8000/drivers/')
    ])
      .then(([vehiclesRes, driversRes]) => {
        setVehicles(vehiclesRes.data)
        setDrivers(driversRes.data)
      })
      .catch(error => console.log(error))
      .finally(() => setLoading(false))
  }, [])

  const availableVehicles = vehicles.filter(v => v.status === 'available').length
  const activeDrivers = drivers.filter(d => d.status === 'active').length
  const totalVehicles = vehicles.length

  const initialCounts = { available: 0, in_use: 0, maintenance: 0 }
  const statusCounts = vehicles.reduce((acc, v) => {
    if (acc[v.status] !== undefined) {
      acc[v.status] += 1
    } else {
      acc[v.status] = 1
    }
    return acc
  }, initialCounts)

  const donutData = Object.keys(statusCounts).map(status => {
    const config = STATUS_MAPPING[status] || { label: status, color: '#94a3b8' }
    const count = statusCounts[status]
    const percentage = totalVehicles > 0 ? Math.round((count / totalVehicles) * 100) : 0
    return {
      name: status,
      label: config.label,
      value: count,
      percentage: percentage,
      color: config.color
    }
  })

  const filteredVehicles = vehicles.filter(v =>
    v.registration_number.toLowerCase().includes(search.toLowerCase()) ||
    v.vehicle_type.toLowerCase().includes(search.toLowerCase())
  )
  const filteredDrivers = drivers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.license_number.toLowerCase().includes(search.toLowerCase())
  )

  const initials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }

  return (
    <div className={`ff-app ${darkMode ? 'dark' : ''}`}>

      <header className="ff-mobile-header">
        <button className="ff-menu-trigger" onClick={() => setMenuOpen(!menuOpen)}>
          <Menu size={22} />
        </button>
        <div className="ff-logo-mobile">
          <div className="ff-logo-icon"><Truck size={15} /></div>
          <span className="ff-logo-text">FleetFlow</span>
        </div>
        <div style={{ width: 22 }} />
      </header>

      {menuOpen && <div className="ff-sidebar-overlay" onClick={() => setMenuOpen(false)} />}

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
            <div 
              className={`ff-nav-item ${item.active ? 'active' : ''}`} 
              key={item.label}
              onClick={() => setMenuOpen(false)}
            >
              <span className="ff-nav-icon">{item.icon}</span>
              <span className="ff-nav-label">{item.label}</span>
              {item.badge && <span className="ff-nav-badge">{item.badge}</span>}
            </div>
          ))}
        </nav>

        <div className="ff-sidebar-footer">FleetFlow v0.1</div>
      </aside>

      <main className="ff-main">

        <div className="ff-topbar">
          <div className="ff-search">
            <span className="ff-search-icon"><Search size={15} /></span>
            <input
              placeholder="Search vehicles, drivers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="ff-topbar-actions">
            <div className="ff-icon-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle dark mode">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </div>
            <div className="ff-icon-btn" title="Notifications">
              <Bell size={16} />
              <span className="ff-notif-dot">5</span>
            </div>
            <div className="ff-profile">
              <div className="ff-avatar">AD</div>
              <div className="ff-profile-text">
                <div className="ff-profile-name">Admin</div>
                <div className="ff-profile-role">Super Admin</div>
              </div>
            </div>
          </div>
        </div>

        <div className="ff-stats">
          <div className="ff-stat-card">
            <div className="ff-stat-icon-box green"><Truck size={20} fill="currentColor" fillOpacity={0.1} /></div>
            <div className="ff-stat-text">
              <span className="ff-stat-label">Active Vehicles</span>
              <span className="ff-stat-value">{loading ? '—' : vehicles.length}</span>
              <span className="ff-stat-trend">+5 Today</span>
            </div>
          </div>
          <div className="ff-stat-card">
            <div className="ff-stat-icon-box blue"><IdCard size={20} fill="currentColor" fillOpacity={0.1} /></div>
            <div className="ff-stat-text">
              <span className="ff-stat-label">Active Drivers</span>
              <span className="ff-stat-value">{loading ? '—' : activeDrivers}</span>
              <span className="ff-stat-trend">+3 Today</span>
            </div>
          </div>
          <div className="ff-stat-card">
            <div className="ff-stat-icon-box orange"><Package size={20} fill="currentColor" fillOpacity={0.1} /></div>
            <div className="ff-stat-text">
              <span className="ff-stat-label">Active Shipments</span>
              <span className="ff-stat-value">210</span>
              <span className="ff-stat-trend">+18 Today</span>
            </div>
          </div>
          <div className="ff-stat-card">
            <div className="ff-stat-icon-box dark-blue"><Route size={20} /></div>
            <div className="ff-stat-text">
              <span className="ff-stat-label">Today's Trips</span>
              <span className="ff-stat-value">42</span>
              <span className="ff-stat-trend">+7 Today</span>
            </div>
          </div>
        </div>

        <div className="ff-widget-row">
          <div className="ff-widget-card">
            <div className="ff-widget-title"><span>Fleet Status</span><span className="ff-widget-more"><MoreVertical size={15} /></span></div>
            {totalVehicles > 0 ? (
              <div className="ff-donut-wrap">
                <div style={{ width: '120px', height: '120px', flexShrink: 0, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={donutData} 
                        dataKey="value" 
                        innerRadius={40} 
                        outerRadius={54} 
                        paddingAngle={2}
                        cx="50%"
                        cy="50%"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="ff-donut-center-num">
                        {totalVehicles}
                      </text>
                      <text x="50%" y="64%" textAnchor="middle" dominantBaseline="middle" className="ff-donut-center-text">
                        Total
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="ff-donut-legend">
                  {donutData.map(entry => (
                    <div className="ff-legend-item" key={entry.name}>
                      <span className="ff-legend-dot" style={{ background: entry.color }}></span>
                      <div className="ff-legend-text-group">
                        <span className="ff-legend-name">{entry.label}</span>
                        <span className="ff-legend-meta">{entry.value} ({entry.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No vehicle data yet</p>}
          </div>

          {/* NEW: Semi-Circle Progress Gauges for Shipment Status (Matches image layout) */}
          <div className="ff-widget-card">
            <div className="ff-widget-title"><span>Shipment Status</span><span className="ff-widget-more"><MoreVertical size={15} /></span></div>
            <div className="ff-gauge-container">
              {SHIPMENT_STATUS.map(s => {
                // Semicircle calculations for dynamic data fills
                const gaugeData = [
                  { value: s.pct, color: s.color },
                  { value: 100 - s.pct, color: 'var(--bg-track)' }
                ];
                return (
                  <div className="ff-gauge-row" key={s.label}>
                    <div className="ff-gauge-chart-box">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                          <Pie
                            data={gaugeData}
                            dataKey="value"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={20}
                            outerRadius={28}
                            cx="50%"
                            cy="100%"
                            stroke="none"
                          >
                            <Cell fill={s.color} />
                            <Cell fill="var(--bg-track)" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="ff-gauge-meta-box">
                      <span className="ff-gauge-label">{s.label}</span>
                      <span className="ff-gauge-numbers" style={{ color: s.color }}>
                        {s.count} <span className="ff-gauge-pct">({s.pct}%)</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ff-widget-card">
            <div className="ff-widget-title"><span>Live Vehicle Tracking</span><span className="ff-widget-more"><MoreVertical size={15} /></span></div>
            <div className="ff-map-placeholder">
              <span className="ff-map-pin" style={{ top: '26%', left: '30%' }}><MapPin size={20} fill="currentColor" /></span>
              <span className="ff-map-pin" style={{ top: '54%', left: '62%' }}><MapPin size={20} fill="currentColor" /></span>
              <div className="ff-map-note">Map integration arrives Week 4</div>
            </div>
          </div>
        </div>

        <div className="ff-bottom-row">
          <div className="ff-widget-card">
            <div className="ff-widget-title"><span>Recent Activities</span><span className="ff-widget-more"><MoreVertical size={15} /></span></div>
            {RECENT_ACTIVITY.map((a, i) => (
              <div className="ff-activity-item" key={i}>
                <div className="ff-activity-icon" style={{ background: a.bg, color: a.color }}>{a.icon}</div>
                <div className="ff-activity-text">{a.text}</div>
                <div className="ff-activity-time">{a.time}</div>
              </div>
            ))}
          </div>

          <div className="ff-widget-card">
            <div className="ff-widget-title"><span>Upcoming Maintenance</span><span className="ff-widget-more"><MoreVertical size={15} /></span></div>
            <table className="ff-mini-table">
              <thead>
                <tr><th>Vehicle</th><th>Service</th><th>Status</th></tr>
              </thead>
              <tbody>
                {UPCOMING_MAINTENANCE.map((m, i) => (
                  <tr key={i}>
                    <td>{vehicles[i]?.registration_number || m.vehicle}</td>
                    <td>{m.service}</td>
                    <td><span className={`ff-badge status-${m.status}`}>{m.status.replace('_', ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ff-section">
          <div className="ff-section-header">
            <div className="ff-section-title"><Truck size={16} /><span>Vehicles</span></div>
            <span className="ff-count-pill">{filteredVehicles.length} shown</span>
          </div>
          <div className="ff-table-wrap">
            <table className="ff-table">
              <thead>
                <tr><th>Registration</th><th>Type</th><th>Fuel</th><th>Capacity</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filteredVehicles.length === 0 && !loading && (
                  <tr className="ff-empty-row"><td colSpan="5">No vehicles match your search</td></tr>
                )}
                {filteredVehicles.map(v => (
                  <tr key={v.id}>
                    <td className="ff-reg-cell" data-label="Registration">{v.registration_number}</td>
                    <td data-label="Type">{v.vehicle_type}</td>
                    <td data-label="Fuel">{v.fuel_type || '—'}</td>
                    <td data-label="Capacity">{v.capacity ? `${v.capacity} kg` : '—'}</td>
                    <td data-label="Status"><span className={`ff-badge status-${v.status}`}>{v.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ff-section">
          <div className="ff-section-header">
            <div className="ff-section-title"><IdCard size={16} /><span>Drivers</span></div>
            <span className="ff-count-pill">{filteredDrivers.length} shown</span>
          </div>
          <div className="ff-table-wrap">
            <table className="ff-table">
              <thead>
                <tr><th>Driver</th><th>License Number</th><th>Phone</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filteredDrivers.length === 0 && !loading && (
                  <tr className="ff-empty-row"><td colSpan="4">No drivers match your search</td></tr>
                )}
                {filteredDrivers.map(d => (
                  <tr key={d.id}>
                    <td data-label="Driver">
                      <div className="ff-driver-cell">
                        <div className="ff-driver-avatar">{initials(d.name)}</div>
                        <span style={{ fontWeight: '500' }}>{d.name}</span>
                      </div>
                    </td>
                    <td className="ff-reg-cell" data-label="License Number">{d.license_number}</td>
                    <td data-label="Phone">{d.phone || '—'}</td>
                    <td data-label="Status"><span className={`ff-badge status-${d.status}`}>{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}

export default App