import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Truck, IdCard, Package, Route, MoreVertical, MapPin, Wrench, Calendar, Send, CheckCircle2, AlertTriangle } from 'lucide-react'
import WidgetMenu from '../components/WidgetMenu'
import LiveMap from '../components/LiveMap'

const STATUS_MAPPING = {
  available: { label: 'Running', color: '#1a9c5c' },
  in_use: { label: 'Idle', color: '#c9820a' },
  'in use': { label: 'Idle', color: '#c9820a' },
  maintenance: { label: 'Maintenance', color: '#dc4444' }
}

const UPCOMING_MAINTENANCE = [
  { vehicle: '—', service: 'Oil Change', status: 'due_soon' },
  { vehicle: '—', service: 'Brake Service', status: 'due_soon' },
  { vehicle: '—', service: 'Tire Replacement', status: 'upcoming' },
]

const timeAgo = (dateString) => {
  if (!dateString) return ''
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

const shipmentActivityStyle = (status) => {
  if (status === 'delivered') return { icon: <Package size={14} />, bg: 'var(--green-bg)', color: 'var(--green)' }
  if (status === 'cancelled') return { icon: <Package size={14} />, bg: 'var(--red-bg)', color: 'var(--red)' }
  if (status === 'delayed') return { icon: <Package size={14} />, bg: 'var(--amber-bg)', color: 'var(--amber)' }
  return { icon: <Package size={14} />, bg: 'var(--cyan-bg)', color: 'var(--accent)' }
}

const DashboardHome = ({ vehicles = [], drivers = [], shipments = [], trips = [], loading, search, onRefresh }) => {
  const activeDrivers = vehicles ? drivers.filter(d => d.status === 'active').length : 0
  const totalVehicles = vehicles ? vehicles.length : 0

  // Standard collection logic for vehicle status groups
  const initialCounts = { available: 0, in_use: 0, maintenance: 0 }
  const statusCounts = (vehicles || []).reduce((acc, v) => {
    if (acc[v.status] !== undefined) acc[v.status] += 1
    else acc[v.status] = 1
    return acc
  }, initialCounts)

  const donutData = Object.keys(statusCounts).map(status => {
    const config = STATUS_MAPPING[status] || { label: status, color: '#94a3b8' }
    const count = statusCounts[status]
    const percentage = totalVehicles > 0 ? Math.round((count / totalVehicles) * 100) : 0
    return { name: status, label: config.label, value: count, percentage, color: config.color }
  })

  // Safe tracking computation arrays for live shipment status matrix elements
  const totalShipmentsCount = shipments ? shipments.length : 0
  const activeDeliveryStatuses = ['assigned', 'picked_up', 'in_transit', 'out_for_delivery']
  const activeDeliveriesCount = (shipments || []).filter(s => activeDeliveryStatuses.includes(s.status)).length
  const initialShipmentCounts = { delivered: 0, in_transit: 0, delayed: 0, cancelled: 0 }
  const computedShipmentCounts = (shipments || []).reduce((acc, s) => {
    const status = s.status || 'in_transit'

    if (status === 'created' || status === 'assigned') {
      acc.in_transit += 1
    } else if (acc[status] !== undefined) {
      acc[status] += 1
    }
    return acc
  }, initialShipmentCounts)

  const liveShipmentStatusData = [
    { label: 'Delivered', count: computedShipmentCounts.delivered, color: '#1a9c5c' },
    { label: 'In Transit', count: computedShipmentCounts.in_transit, color: '#2f6fed' },
    { label: 'Delayed', count: computedShipmentCounts.delayed, color: '#c9820a' },
    { label: 'Cancelled', count: computedShipmentCounts.cancelled, color: '#dc4444' },
  ].map(item => {
    const pct = totalShipmentsCount > 0 ? Math.round((item.count / totalShipmentsCount) * 100) : 0
    return { ...item, pct }
  })

  // Extra context metrics for the shipment summary card trend lines
  const shipmentsAddedToday = (shipments || []).filter(s => {
    if (!s.created_at) return false
    const d = new Date(s.created_at)
    const today = new Date()
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  }).length
  const deliveryRate = totalShipmentsCount > 0 ? Math.round((computedShipmentCounts.delivered / totalShipmentsCount) * 100) : 0

  // Real trip counts, derived from the Trip Scheduling data
  const totalTripsCount = trips.length
  const tripsToday = trips.filter(t => {
    if (!t.scheduled_start) return false
    const d = new Date(t.scheduled_start)
    const today = new Date()
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  }).length

  // Build a real "recent activity" feed from shipments, trips, vehicles, and drivers — sorted by most recent
  const shipmentActivities = (shipments || []).map(s => ({
    ...shipmentActivityStyle(s.status),
    text: `Shipment ${s.tracking_id} — ${s.origin} to ${s.destination} (${s.status.replace('_', ' ')})`,
    time: timeAgo(s.created_at),
    timestamp: s.created_at,
  }))

  const tripActivities = (trips || []).map(t => ({
    icon: <Calendar size={14} />,
    bg: 'var(--cyan-bg)',
    color: 'var(--accent)',
    text: `Trip scheduled: ${t.origin} to ${t.destination} (${t.status})`,
    time: timeAgo(t.created_at),
    timestamp: t.created_at,
  }))

  const vehicleActivities = (vehicles || []).map(v => ({
    icon: <Truck size={14} />,
    bg: 'var(--green-bg)',
    color: 'var(--green)',
    text: `Vehicle ${v.registration_number} added to fleet`,
    time: timeAgo(v.created_at),
    timestamp: v.created_at,
  }))

  const driverActivities = (drivers || []).map(d => ({
    icon: <IdCard size={14} />,
    bg: 'var(--cyan-bg)',
    color: 'var(--accent)',
    text: `Driver ${d.name} joined the team`,
    time: timeAgo(d.created_at),
    timestamp: d.created_at,
  }))

  const recentActivities = [...shipmentActivities, ...tripActivities, ...vehicleActivities, ...driverActivities]
    .filter(a => a.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5)

  return (
    <>
      {/* Top Statistical Counters Section */}
      <div className="ff-stats">
        <div className="ff-stat-card">
          <div className="ff-stat-icon-box green"><Truck size={20} fill="currentColor" fillOpacity={0.1} /></div>
          <div className="ff-stat-text">
            <span className="ff-stat-label">Total Vehicles</span>
            <span className="ff-stat-value">{loading ? '—' : totalVehicles}</span>
          </div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon-box blue"><IdCard size={20} fill="currentColor" fillOpacity={0.1} /></div>
          <div className="ff-stat-text">
            <span className="ff-stat-label">Active Drivers</span>
            <span className="ff-stat-value">{loading ? '—' : activeDrivers}</span>
          </div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon-box orange"><Package size={20} fill="currentColor" fillOpacity={0.1} /></div>
          <div className="ff-stat-text">
            <span className="ff-stat-label">Active Shipments</span>
            <span className="ff-stat-value">{loading ? '—' : activeDeliveriesCount}</span>
            <span className="ff-stat-trend">{loading ? '' : `of ${totalShipmentsCount} total`}</span>
          </div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon-box dark-blue"><Route size={20} /></div>
          <div className="ff-stat-text">
            <span className="ff-stat-label">Today's Trips</span>
            <span className="ff-stat-value">{loading ? '—' : tripsToday}</span>
            <span className="ff-stat-trend">{loading ? '' : `${totalTripsCount} total trips`}</span>
          </div>
        </div>

        {/* Shipment summary cards — Milestone 2, Task 5: Dashboard Enhancements */}
        <div className="ff-stat-card">
          <div className="ff-stat-icon-box orange"><Package size={20} fill="currentColor" fillOpacity={0.1} /></div>
          <div className="ff-stat-text">
            <span className="ff-stat-label">Total Shipments</span>
            <span className="ff-stat-value">{loading ? '—' : totalShipmentsCount}</span>
            <span className="ff-stat-trend">{loading ? '' : `${shipmentsAddedToday} added today`}</span>
          </div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon-box blue"><Send size={20} fill="currentColor" fillOpacity={0.1} /></div>
          <div className="ff-stat-text">
            <span className="ff-stat-label">Active Deliveries</span>
            <span className="ff-stat-value">{loading ? '—' : activeDeliveriesCount}</span>
            <span className="ff-stat-trend">{loading ? '' : `${computedShipmentCounts.delayed} delayed`}</span>
          </div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon-box green"><CheckCircle2 size={20} fill="currentColor" fillOpacity={0.1} /></div>
          <div className="ff-stat-text">
            <span className="ff-stat-label">Delivered Shipments</span>
            <span className="ff-stat-value">{loading ? '—' : computedShipmentCounts.delivered}</span>
            <span className="ff-stat-trend">{loading ? '' : `${deliveryRate}% success rate`}</span>
          </div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon-box dark-blue"><AlertTriangle size={20} fill="currentColor" fillOpacity={0.1} /></div>
          <div className="ff-stat-text">
            <span className="ff-stat-label">Delayed Shipments</span>
            <span className="ff-stat-value">{loading ? '—' : computedShipmentCounts.delayed}</span>
            <span className="ff-stat-trend">{loading ? '' : computedShipmentCounts.delayed > 0 ? 'Needs attention' : 'All on schedule'}</span>
          </div>
        </div>
      </div>

      {/* Central Analytical Visual Widget Panels */}
      <div className="ff-widget-row">
        {/* Fleet Utilization Ring Breakdown */}
        <div className="ff-widget-card">
          <div className="ff-widget-title"><span>Fleet Status</span><WidgetMenu viewAllPath="/fleet" onRefresh={onRefresh} /></div>
          {totalVehicles > 0 ? (
            <div className="ff-donut-wrap">
              <div style={{ width: '120px', height: '120px', flexShrink: 0, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} dataKey="value" innerRadius={40} outerRadius={54} paddingAngle={2} cx="50%" cy="50%">
                      {donutData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="ff-donut-center-num">{totalVehicles}</text>
                    <text x="50%" y="64%" textAnchor="middle" dominantBaseline="middle" className="ff-donut-center-text">Total</text>
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

        {/* Shipment Log Gauges */}
        <div className="ff-widget-card">
          <div className="ff-widget-title"><span>Shipment Status</span><WidgetMenu viewAllPath="/shipments" onRefresh={onRefresh} /></div>
          <div className="ff-gauge-container">
            {liveShipmentStatusData.map(s => {
              const gaugeData = [{ value: s.count }, { value: totalShipmentsCount > 0 ? totalShipmentsCount - s.count : 100 }];
              return (
                <div className="ff-gauge-row" key={s.label}>
                  <div className="ff-gauge-chart-box">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie data={gaugeData} dataKey="value" startAngle={180} endAngle={0} innerRadius={20} outerRadius={28} cx="50%" cy="100%" stroke="none">
                          <Cell fill={s.count > 0 ? s.color : 'var(--bg-track)'} />
                          <Cell fill="var(--bg-track)" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="ff-gauge-meta-box">
                    <span className="ff-gauge-label">{s.label}</span>
                    <span className="ff-gauge-numbers" style={{ color: s.count > 0 ? s.color : 'var(--text-muted)' }}>
                      {s.count} <span className="ff-gauge-pct">({s.pct}%)</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Vehicle Tracking Map */}
        <div className="ff-widget-card">
          <div className="ff-widget-title"><span>Live Vehicle Tracking</span><WidgetMenu viewAllPath="/fleet" onRefresh={onRefresh} /></div>
          <div style={{ height: '220px' }}>
            <LiveMap vehicles={vehicles} />
          </div>
        </div>
      </div>

      {/* Auxiliary Operation Logs & Preventive Maintenance Layout */}
      <div className="ff-bottom-row">
        <div className="ff-widget-card">
          <div className="ff-widget-title"><span>Recent Activities</span><span className="ff-widget-more"><MoreVertical size={15} /></span></div>
          {recentActivities.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No recent activity yet</p>
          )}
          {recentActivities.map((a, i) => (
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
    </>
  )
}

export default DashboardHome
