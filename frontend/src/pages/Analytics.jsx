// REPLACE existing file: frontend/src/pages/Analytics.jsx
import { useState, useEffect } from 'react'
import { BarChart3, Truck, Package, Route as RouteIcon, IdCard, Wrench, Fuel, Gauge, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from 'recharts'
import api from '../api/axios'

// Color Palette
const COLORS = {
  blue: '#4c6ef5',
  lightBlue: '#c7dfff',
  green: '#51cf66',
  yellow: '#fcc419',
  orange: '#ff922b',
  purple: '#9775fa',
  teal: '#20c997',
  red: '#ff6b6b',
  border: '#eee'
}

// Status mappings — keys here MUST exactly match the lowercase field names
// returned by GET /analytics/operational (fleet/shipments/trips/drivers),
// otherwise that segment silently reads 0 and disappears from the pie.
const STATUS_MAP = {
  fleet: {
    IN_USE: { label: 'In Use', color: COLORS.green },
    AVAILABLE: { label: 'Available', color: COLORS.blue },
    MAINTENANCE: { label: 'In Maintenance', color: COLORS.red },
  },
  shipment: {
    CREATED: { label: 'Created', color: COLORS.lightBlue },
    ASSIGNED: { label: 'Assigned', color: COLORS.purple },
    PICKED_UP: { label: 'Picked Up', color: COLORS.teal },
    IN_TRANSIT: { label: 'In Transit', color: COLORS.blue },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: COLORS.yellow },
    DELAYED: { label: 'Delayed', color: COLORS.orange },
    DELIVERED: { label: 'Delivered', color: COLORS.green },
    CANCELLED: { label: 'Cancelled', color: '#999' },
  },
  trip: {
    COMPLETED: { label: 'Completed', color: COLORS.green },
    ONGOING: { label: 'Ongoing', color: COLORS.blue },
    SCHEDULED: { label: 'Scheduled', color: COLORS.orange },
    CANCELLED: { label: 'Cancelled', color: COLORS.red },
  },
  driver: {
    ACTIVE: { label: 'Available', color: COLORS.green },
    ASSIGNED: { label: 'Assigned', color: COLORS.blue },
    INACTIVE: { label: 'Inactive', color: COLORS.red },
  }
}

// Stat Card
const StatCard = ({ icon, label, value, unit, color }) => (
  <div className="ff-stat-card" style={{ borderColor: color ? `${color}30` : 'var(--border-light)' }}>
    <div className="ff-stat-icon-box" style={{ background: color ? `${color}15` : 'rgba(56, 126, 243, 0.1)', color: color || 'rgb(56, 126, 243)' }}>
      {icon}
    </div>
    <div className="ff-stat-text">
      <div className="ff-stat-label">{label}</div>
      <div className="ff-stat-value">{value} {unit && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{unit}</span>}</div>
    </div>
  </div>
)

// Donut Breakdown Widget
const BreakdownDonut = ({ title, total, segments }) => {
  const accountedFor = segments.reduce((sum, s) => sum + s.value, 0)
  const unaccounted = total - accountedFor

  // Safety net: if backend ever adds a status this page doesn't know about
  // yet, show it as "Other" instead of silently making totals not add up.
  const finalSegments = unaccounted > 0
    ? [...segments, { label: 'Other', value: unaccounted, color: '#ccc' }]
    : segments

  return (
    <div className="ff-widget-card" style={{ padding: '16px' }}>
      <div className="ff-widget-title" style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
        {title} ({total})
      </div>
      <div className="ff-donut-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '100px', height: '100px', flexShrink: 0, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={finalSegments} dataKey="value" innerRadius={32} outerRadius={46} paddingAngle={2} cx="50%" cy="50%">
                {finalSegments.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="ff-donut-center-num">{total}</text>
              <text x="50%" y="64%" textAnchor="middle" dominantBaseline="middle" className="ff-donut-center-text">Total</text>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="ff-donut-legend" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
          {finalSegments.map((s, i) => (
            <div className="ff-legend-item" key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="ff-legend-dot" style={{ background: s.color, width: '8px', height: '8px', borderRadius: '50%' }}></span>
              <span className="ff-legend-name" style={{ color: 'var(--text-muted)' }}>{s.label}:</span>
              <span className="ff-legend-meta" style={{ fontWeight: 600 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Analytics() {
  const [operational, setOperational] = useState(null)
  const [fuelAnalytics, setFuelAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/analytics/operational'),
      api.get('/analytics/fuel'),
    ])
      .then(([opRes, fuelRes]) => {
        setOperational(opRes.data)
        setFuelAnalytics(fuelRes.data)
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="ff-section"><p style={{ color: 'var(--text-muted)' }}>Loading analytics...</p></div>
  if (error || !operational || !fuelAnalytics) return <div className="ff-section"><p style={{ color: 'var(--red)' }}>{error || 'Something went wrong loading analytics'}</p></div>

  const { fleet, shipments, trips, drivers, maintenance } = operational

  // Helper to build pie data
  const getSegments = (dataGroup, mapKey) => {
    const map = STATUS_MAP[mapKey]
    return Object.entries(map).map(([key, value]) => ({
      label: value.label,
      value: dataGroup[key.toLowerCase()] || 0,
      color: value.color
    })).filter(s => s.value > 0)
  }

  const costBarData = [
    { name: 'Fuel Cost', cost: fuelAnalytics.total_fuel_cost, color: COLORS.orange },
    { name: 'Maintenance', cost: maintenance.total_cost, color: COLORS.red },
  ]

  return (
    <div className="ff-section">
      {/* Header */}
      <div className="ff-page-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="ff-section-title"><BarChart3 size={16} /><span>Fleet Analytics</span></div>
          <p className="ff-page-subtitle">Real-time performance and operational insight</p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="ff-stats" style={{ marginBottom: 18 }}>
        <StatCard icon={<TrendingUp size={20} />} label="Success Rate" value={`${shipments.success_rate}%`} color={COLORS.green} />
        <StatCard icon={<Truck size={20} />} label="Active Vehicles" value={fleet.in_use} color={COLORS.blue} />
        <StatCard icon={<Fuel size={20} />} label="Total Fuel Cost" value={`₹${fuelAnalytics.total_fuel_cost.toLocaleString('en-IN')}`} color={COLORS.orange} />
        <StatCard icon={<Wrench size={20} />} label="Maintenance Cost" value={`₹${maintenance.total_cost.toLocaleString('en-IN')}`} color={COLORS.red} />
      </div>

      {/* Cost Bar Chart */}
      <div className="ff-widget-card" style={{ marginBottom: 18 }}>
        <div className="ff-widget-title"><span>Operational Costs Overview</span></div>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costBarData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
              <Bar dataKey="cost" radius={[6, 6, 0, 0]}>
                {costBarData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut Breakdowns Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 18 }}>
        <BreakdownDonut title="Fleet Status" total={fleet.total_vehicles} segments={getSegments(fleet, 'fleet')} />
        <BreakdownDonut title="Trip Overview" total={trips.total} segments={getSegments(trips, 'trip')} />
        <BreakdownDonut title="Shipment Status" total={shipments.total} segments={getSegments(shipments, 'shipment')} />
        <BreakdownDonut title="Driver Status" total={drivers.total} segments={getSegments(drivers, 'driver')} />
      </div>

      {/* Quick Summary Bar */}
      <div className="ff-widget-card">
        <div className="ff-widget-title"><span><Clock size={14} style={{ marginRight: 6 }} />Maintenance & Activity Summary</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 12 }}>
          <div style={{ background: 'var(--bg-hover)', padding: 12, borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Completed Services</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.green }}>{maintenance.completed}</span>
          </div>
          <div style={{ background: 'var(--bg-hover)', padding: 12, borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Maintenance Due Soon</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.orange }}>{maintenance.due_soon}</span>
          </div>
          <div style={{ background: 'var(--bg-hover)', padding: 12, borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Overdue Maintenance</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.red }}>{maintenance.overdue}</span>
          </div>
          <div style={{ background: 'var(--bg-hover)', padding: 12, borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Avg Fuel Consumption</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.blue }}>{fuelAnalytics.average_fuel_consumption_liters} L</span>
          </div>
        </div>
      </div>
    </div>
  )
}
