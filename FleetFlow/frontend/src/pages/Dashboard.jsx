import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { dashboardApi, vehicleApi, analyticsApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState('current_month')
  const [fleetStats, setFleetStats] = useState(null)
  const [fuelStats, setFuelStats] = useState(null)
  const [opStats, setOpStats] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [fleetRes, fuelRes, opRes, v] = await Promise.all([
          dashboardApi.fleet({ time_range: timeRange }),
          analyticsApi.fuel({ time_range: timeRange }),
          analyticsApi.operations({ time_range: timeRange }),
          vehicleApi.list()
        ])
        setFleetStats(fleetRes.data)
        setFuelStats(fuelRes.data)
        setOpStats(opRes.data)
        setVehicles(v.data.slice(0, 6)) // show latest 6
      } catch (err) {
        console.error("Dashboard error:", err)
      }
      setLoading(false)
    }
    load()
  }, [timeRange])

  const now = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="top-bar">
          <div>
            <div className="top-bar-title">Fleet Dashboard</div>
            <div className="top-bar-subtitle">{now}</div>
          </div>
          <div className="top-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <select 
              className="form-select" 
              style={{ width: '160px', padding: '6px 12px', fontSize: '0.85rem' }}
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_6_months">Last 6 Months</option>
            </select>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Signed in as <strong>{user?.email}</strong>
            </span>
          </div>
        </header>

        <main className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <h2 style={{ fontSize: '1.2rem', marginBottom: '-10px' }}>Fleet & Drivers</h2>
          <div className="stat-grid">
            <StatCard
              label="Total Vehicles"
              value={loading ? '…' : fleetStats?.total_vehicles}
              variant="total"
              desc={`${(fleetStats?.total_vehicles || 0) - (fleetStats?.active_vehicles || 0) - (fleetStats?.maintenance_vehicles || 0)} available`}
              icon={<TruckIcon color="var(--stat-total)" />}
            />
            <StatCard
              label="Vehicles On Trip"
              value={loading ? '…' : fleetStats?.active_vehicles}
              variant="active"
              desc="Currently deployed"
              icon={<ActiveIcon />}
            />
            <StatCard
              label="Under Maintenance"
              value={loading ? '…' : fleetStats?.maintenance_vehicles}
              variant="maint"
              desc="In service"
              icon={<WrenchIcon />}
            />
            <StatCard
              label="Drivers On Duty"
              value={loading ? '…' : fleetStats?.on_duty_drivers}
              variant="avail"
              desc={`Out of ${fleetStats?.total_drivers || 0} total`}
              icon={<UserIcon color="var(--stat-available)" />}
            />
          </div>

          <h2 style={{ fontSize: '1.2rem', marginBottom: '-10px', marginTop: '10px' }}>Logistics & Operations</h2>
          <div className="stat-grid">
            <StatCard
              label="Active Shipments"
              value={loading ? '…' : fleetStats?.active_shipments}
              variant="total"
              desc={`${fleetStats?.delivered_shipments || 0} delivered`}
              icon={<BoxIcon color="var(--stat-total)" />}
            />
            <StatCard
              label="Delivery Success Rate"
              value={loading ? '…' : `${opStats?.delivery_success_rate?.toFixed(1) || 0}%`}
              variant="avail"
              desc={`${opStats?.successful_deliveries || 0} total successful`}
              icon={<CheckIcon color="var(--stat-available)" />}
            />
            <StatCard
              label="Avg Trip Distance"
              value={loading ? '…' : `${opStats?.avg_trip_distance_km?.toFixed(0) || 0} km`}
              variant="active"
              desc="Based on coordinates"
              icon={<RouteIcon color="var(--stat-active)" />}
            />
            <StatCard
              label="Delayed Shipments"
              value={loading ? '…' : opStats?.delayed_deliveries || 0}
              variant="maint"
              desc="Needs attention"
              icon={<AlertIcon />}
            />
          </div>

          <h2 style={{ fontSize: '1.2rem', marginBottom: '-10px', marginTop: '10px' }}>Fuel Analytics</h2>
          <div className="stat-grid">
            <StatCard
              label="Total Fuel Consumed"
              value={loading ? '…' : `${fuelStats?.total_fuel_consumed_ltrs || 0} L`}
              variant="total"
              desc="Across all vehicles"
              icon={<FuelIcon />}
            />
            <StatCard
              label="Total Fuel Cost"
              value={loading ? '…' : `₹${fuelStats?.total_fuel_cost?.toLocaleString() || 0}`}
              variant="active"
              desc={`₹${fuelStats?.avg_cost_per_litre?.toFixed(1) || 0} per liter`}
              icon={<ChartIcon />}
            />
            <StatCard
              label="Highest Consumer"
              value={loading ? '…' : fuelStats?.vehicle_highest_usage?.registration_number || 'N/A'}
              variant="maint"
              desc={`${fuelStats?.vehicle_highest_usage?.total_litres || 0} Liters`}
              icon={<TruckIcon color="var(--stat-maint)" />}
            />
            <StatCard
              label="Most Efficient"
              value={loading ? '…' : fuelStats?.vehicle_lowest_usage?.registration_number || 'N/A'}
              variant="avail"
              desc={`${fuelStats?.vehicle_lowest_usage?.total_litres || 0} Liters`}
              icon={<CheckIcon color="var(--stat-available)" />}
            />
          </div>

          <h2 style={{ fontSize: '1.2rem', marginBottom: '-10px', marginTop: '10px' }}>Visualizations</h2>
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            
            {/* 1. Fleet Status (Donut) */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Fleet Composition</div>
              </div>
              <div className="card-body" style={{ height: '300px' }}>
                {loading ? <div className="skeleton" style={{ height: '100%' }} /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Available', value: Math.max(0, (fleetStats?.total_vehicles || 0) - (fleetStats?.active_vehicles || 0) - (fleetStats?.maintenance_vehicles || 0)) },
                          { name: 'On Trip', value: fleetStats?.active_vehicles || 0 },
                          { name: 'Maintenance', value: fleetStats?.maintenance_vehicles || 0 }
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={65} outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#0ea5e9" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'var(--text-secondary)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 2. Trip Overview (Bar) */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Trip Status</div>
              </div>
              <div className="card-body" style={{ height: '300px' }}>
                {loading ? <div className="skeleton" style={{ height: '100%' }} /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Scheduled', count: fleetStats?.scheduled_trips || 0 },
                        { name: 'Active', count: fleetStats?.active_trips || 0 },
                        { name: 'Completed', count: fleetStats?.completed_trips || 0 },
                        { name: 'Cancelled', count: fleetStats?.cancelled_trips || 0 }
                      ]}
                      margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(128,128,128,0.1)' }} 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} 
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                        <Cell fill="#a5b4fc" />
                        <Cell fill="#0ea5e9" />
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 3. Delivery Outcomes (Pie) */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Delivery Outcomes</div>
              </div>
              <div className="card-body" style={{ height: '300px' }}>
                {loading ? <div className="skeleton" style={{ height: '100%' }} /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Successful', value: opStats?.successful_deliveries || 0 },
                          { name: 'Delayed', value: opStats?.delayed_deliveries || 0 },
                          { name: 'Cancelled', value: opStats?.cancelled_deliveries || 0 }
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={0} outerRadius={100}
                        dataKey="value"
                        stroke="var(--bg-card)"
                        strokeWidth={2}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'var(--text-secondary)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* Quick fleet overview */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Recent Fleet Activity</div>
                <div className="card-subtitle">Last 6 registered vehicles</div>
              </div>
              <Link to="/vehicles" className="btn btn-outline btn-sm">View All →</Link>
            </div>
            <div className="table-wrapper">
              {loading ? (
                <div style={{ padding: 24 }}>
                  {[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
                </div>
              ) : vehicles.length === 0 ? (
                <div className="table-empty">
                  <div className="table-empty-icon">🚛</div>
                  <p>No vehicles registered yet.</p>
                  <Link to="/vehicles" className="btn btn-primary btn-sm" style={{ marginTop: 12, display: 'inline-flex' }}>
                    Register first vehicle
                  </Link>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Registration</th>
                      <th>Type</th>
                      <th>Fuel</th>
                      <th>Capacity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v) => (
                      <tr key={v.id}>
                        <td><strong>{v.registration_number}</strong></td>
                        <td>{v.vehicle_type}</td>
                        <td>{v.fuel_type}</td>
                        <td>{v.capacity}t</td>
                        <td><StatusBadge status={v.current_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Icons
function TruckIcon({ color }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>
}
function ActiveIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--stat-active)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
}
function WrenchIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--stat-maint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
}
function CheckIcon({ color }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color||"var(--stat-available)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
}
function UserIcon({ color }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
}
function BoxIcon({ color }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
}
function RouteIcon({ color }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" /></svg>
}
function AlertIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--stat-maint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
}
function FuelIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22v-4a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v4" /><path d="M7 22v-4" /><path d="M11 22v-4" /><circle cx="9" cy="7" r="4" /><path d="M14 22h6v-6a4 4 0 0 0-4-4v0a4 4 0 0 0-4 4v6z" /></svg>
}
function ChartIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
}

