import { useEffect, useState, useCallback } from 'react'
import {
  getFleetUtilization, getFuelConsumption,
  getDriverPerformance, getDeliveryPerformance, getMaintenanceReport,
  downloadPDF, downloadExcel,
} from '../api/reports'

/* ─── Report config ─────────────────────────────────── */
const REPORTS = [
  {
    id: 'fleet-utilization',
    label: 'Fleet Utilization',
    icon: '🚛',
    color: '#6366f1',
    desc: 'Vehicle availability, utilization rate, fleet composition',
    fetch: getFleetUtilization,
  },
  {
    id: 'fuel-consumption',
    label: 'Fuel Consumption',
    icon: '⛽',
    color: '#f59e0b',
    desc: 'Total fuel consumed, cost breakdown, per-vehicle stats',
    fetch: getFuelConsumption,
  },
  {
    id: 'driver-performance',
    label: 'Driver Performance',
    icon: '👤',
    color: '#22c55e',
    desc: 'Trip counts, safety scores, ratings, distance driven',
    fetch: getDriverPerformance,
  },
  {
    id: 'delivery-performance',
    label: 'Delivery Performance',
    icon: '📦',
    color: '#3b82f6',
    desc: 'Shipment success rate, avg delivery time, trip completion',
    fetch: getDeliveryPerformance,
  },
  {
    id: 'maintenance',
    label: 'Maintenance Report',
    icon: '🔧',
    color: '#ef4444',
    desc: 'Completed vs overdue services, total cost, top category',
    fetch: getMaintenanceReport,
  },
]

/* ─── Helpers ────────────────────────────────────────── */
const fmtInr = v => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)

function StatBox({ label, value, color = '#6366f1', icon }) {
  return (
    <div className="rpt-stat-box" style={{ '--rbox-color': color }}>
      {icon && <div className="rpt-stat-icon">{icon}</div>}
      <div className="rpt-stat-value">{value}</div>
      <div className="rpt-stat-label">{label}</div>
    </div>
  )
}

function SectionTitle({ children }) {
  return <h3 className="rpt-section-title">{children}</h3>
}

/* ─── Per-report renderers ───────────────────────────── */
function FleetReport({ data }) {
  return (
    <>
      <div className="rpt-stat-grid">
        <StatBox icon="🚛" label="Total Vehicles"      value={data.total_vehicles}           color="#6366f1" />
        <StatBox icon="✅" label="Available"           value={data.available}                color="#22c55e" />
        <StatBox icon="🔄" label="In Transit"          value={data.in_transit}               color="#3b82f6" />
        <StatBox icon="🔧" label="Under Maintenance"   value={data.under_maintenance}         color="#f59e0b" />
        <StatBox icon="📊" label="Utilization Rate"    value={`${data.utilization_rate_pct}%`} color="#8b5cf6" />
      </div>
      {data.by_type && Object.keys(data.by_type).length > 0 && (
        <>
          <SectionTitle>Fleet by Vehicle Type</SectionTitle>
          <div className="rpt-bar-list">
            {Object.entries(data.by_type).map(([type, cnt]) => (
              <div key={type} className="rpt-bar-row">
                <span className="rpt-bar-label">{type}</span>
                <div className="rpt-bar-track">
                  <div className="rpt-bar-fill" style={{ width: `${(cnt / data.total_vehicles) * 100}%`, background: '#6366f1' }} />
                </div>
                <span className="rpt-bar-val">{cnt}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {data.by_fuel_type && Object.keys(data.by_fuel_type).length > 0 && (
        <>
          <SectionTitle>Fleet by Fuel Type</SectionTitle>
          <div className="rpt-bar-list">
            {Object.entries(data.by_fuel_type).map(([ft, cnt]) => (
              <div key={ft} className="rpt-bar-row">
                <span className="rpt-bar-label">{ft}</span>
                <div className="rpt-bar-track">
                  <div className="rpt-bar-fill" style={{ width: `${(cnt / data.total_vehicles) * 100}%`, background: '#06b6d4' }} />
                </div>
                <span className="rpt-bar-val">{cnt}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function FuelReport({ data }) {
  const maxLiters = Math.max(...(data.vehicle_breakdown || []).map(v => v.total_liters), 1)
  return (
    <>
      <div className="rpt-stat-grid">
        <StatBox icon="⛽" label="Total Fuel (L)"    value={`${data.total_fuel_liters} L`}  color="#f59e0b" />
        <StatBox icon="💰" label="Total Cost"        value={fmtInr(data.total_fuel_cost)}    color="#22c55e" />
        <StatBox icon="📉" label="Avg ₹/Litre"       value={fmtInr(data.avg_cost_per_liter)} color="#3b82f6" />
        <StatBox icon="🔢" label="Total Fill-ups"    value={data.total_fill_count}           color="#8b5cf6" />
      </div>
      {data.vehicle_breakdown?.length > 0 && (
        <>
          <SectionTitle>Per-Vehicle Fuel Usage</SectionTitle>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Vehicle</th><th>Litres</th><th>Cost</th><th>Fill-ups</th><th>Usage Bar</th></tr>
              </thead>
              <tbody>
                {data.vehicle_breakdown.map(v => (
                  <tr key={v.vehicle_id}>
                    <td><span className="plate-badge">🚛 {v.plate_number}</span></td>
                    <td><span className="cyan-val">{v.total_liters} L</span></td>
                    <td><span className="green-val">{fmtInr(v.total_cost)}</span></td>
                    <td>{v.fill_count}</td>
                    <td style={{ minWidth: 120 }}>
                      <div className="rpt-bar-track" style={{ margin: 0 }}>
                        <div className="rpt-bar-fill" style={{ width: `${(v.total_liters / maxLiters) * 100}%`, background: '#f59e0b' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}

function DriverReport({ data }) {
  return (
    <>
      <div className="rpt-stat-grid">
        <StatBox icon="👥" label="Total Drivers"    value={data.total_drivers}            color="#22c55e" />
        <StatBox icon="✅" label="Available"        value={data.available_drivers}        color="#3b82f6" />
        <StatBox icon="🛡️" label="Avg Safety Score" value={`${data.avg_safety_score}/100`} color="#f59e0b" />
        <StatBox icon="⭐" label="Avg Rating"       value={`${data.avg_rating}/5`}       color="#8b5cf6" />
        <StatBox icon="🏆" label="Top Performer"   value={data.top_driver_name || 'N/A'} color="#6366f1" />
      </div>
      {data.driver_rows?.length > 0 && (
        <>
          <SectionTitle>Driver Leaderboard</SectionTitle>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Rank</th><th>Driver</th><th>Trips</th><th>Total KM</th><th>Safety</th><th>Rating</th><th>Status</th><th>Attendance</th></tr>
              </thead>
              <tbody>
                {data.driver_rows.map((d, i) => {
                  const safeColor = d.safety_score >= 85 ? '#22c55e' : d.safety_score >= 70 ? '#f59e0b' : '#ef4444'
                  return (
                    <tr key={d.driver_id}>
                      <td className="id-cell">#{i + 1}</td>
                      <td><strong style={{ color: '#f1f5f9' }}>{d.name}</strong></td>
                      <td><span className="cyan-val">{d.trips_completed}</span></td>
                      <td><span className="amber-val">{d.total_km} km</span></td>
                      <td><strong style={{ color: safeColor }}>{d.safety_score}</strong></td>
                      <td><span style={{ color: '#f59e0b' }}>⭐ {d.rating}</span></td>
                      <td>
                        <span className={`status-badge ${d.status === 'Available' ? 'available' : 'in-transit'}`}>
                          {d.status}
                        </span>
                      </td>
                      <td><span className="type-badge">{d.attendance}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}

function DeliveryReport({ data }) {
  const total = data.total_shipments || 1
  return (
    <>
      <div className="rpt-stat-grid">
        <StatBox icon="📦" label="Total Shipments"    value={data.total_shipments}              color="#3b82f6" />
        <StatBox icon="✅" label="Delivered"          value={data.delivered}                    color="#22c55e" />
        <StatBox icon="🚚" label="In Transit"         value={data.in_transit}                   color="#6366f1" />
        <StatBox icon="⏳" label="Pending"            value={data.pending}                      color="#f59e0b" />
        <StatBox icon="❌" label="Cancelled"          value={data.cancelled}                    color="#ef4444" />
        <StatBox icon="📊" label="Success Rate"       value={`${data.success_rate_pct}%`}       color="#22c55e" />
        <StatBox icon="⏱️" label="Avg Delivery (hrs)" value={`${data.avg_delivery_time_hours}h`} color="#8b5cf6" />
        <StatBox icon="🛣️" label="Total Trips"        value={data.total_trips}                  color="#06b6d4" />
      </div>
      <SectionTitle>Shipment Breakdown</SectionTitle>
      <div className="rpt-bar-list">
        {[
          { label: 'Delivered', val: data.delivered, color: '#22c55e' },
          { label: 'In Transit', val: data.in_transit, color: '#3b82f6' },
          { label: 'Pending',   val: data.pending,   color: '#f59e0b' },
          { label: 'Cancelled', val: data.cancelled, color: '#ef4444' },
        ].map(row => (
          <div key={row.label} className="rpt-bar-row">
            <span className="rpt-bar-label">{row.label}</span>
            <div className="rpt-bar-track">
              <div className="rpt-bar-fill" style={{ width: `${(row.val / total) * 100}%`, background: row.color }} />
            </div>
            <span className="rpt-bar-val">{row.val}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function MaintenanceRpt({ data }) {
  const total = data.total_records || 1
  return (
    <>
      <div className="rpt-stat-grid">
        <StatBox icon="📋" label="Total Records"  value={data.total_records}         color="#6366f1" />
        <StatBox icon="✅" label="Completed"      value={data.completed}             color="#22c55e" />
        <StatBox icon="📅" label="Scheduled"      value={data.scheduled}             color="#3b82f6" />
        <StatBox icon="🔄" label="In Progress"    value={data.in_progress}           color="#f59e0b" />
        <StatBox icon="⚠️" label="Overdue"        value={data.overdue}              color="#ef4444" />
        <StatBox icon="💰" label="Total Cost"     value={fmtInr(data.total_cost)}   color="#22c55e" />
        <StatBox icon="🏆" label="Top Category"   value={data.top_category || 'N/A'} color="#8b5cf6" />
      </div>
      <SectionTitle>Status Breakdown</SectionTitle>
      <div className="rpt-bar-list">
        {[
          { label: 'Completed',   val: data.completed,   color: '#22c55e' },
          { label: 'Scheduled',   val: data.scheduled,   color: '#3b82f6' },
          { label: 'In Progress', val: data.in_progress, color: '#f59e0b' },
          { label: 'Overdue',     val: data.overdue,     color: '#ef4444' },
        ].map(row => (
          <div key={row.label} className="rpt-bar-row">
            <span className="rpt-bar-label">{row.label}</span>
            <div className="rpt-bar-track">
              <div className="rpt-bar-fill" style={{ width: `${(row.val / total) * 100}%`, background: row.color }} />
            </div>
            <span className="rpt-bar-val">{row.val}</span>
          </div>
        ))}
      </div>
    </>
  )
}

const RENDERERS = {
  'fleet-utilization':    FleetReport,
  'fuel-consumption':     FuelReport,
  'driver-performance':   DriverReport,
  'delivery-performance': DeliveryReport,
  'maintenance':          MaintenanceRpt,
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function ReportsExport() {
  const [activeReport, setActiveReport] = useState('fleet-utilization')
  const [data,         setData]         = useState({})
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [exporting,    setExporting]    = useState('')  // 'pdf' | 'excel' | ''

  const loadReport = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const cfg = REPORTS.find(r => r.id === id)
      const result = await cfg.fetch()
      setData(prev => ({ ...prev, [id]: result }))
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!data[activeReport]) loadReport(activeReport)
  }, [activeReport, data, loadReport])

  async function handleExport(type) {
    setExporting(type)
    try {
      if (type === 'pdf')   await downloadPDF(activeReport)
      if (type === 'excel') await downloadExcel(activeReport)
    } catch (e) {
      alert(e.message)
    } finally {
      setExporting('')
    }
  }

  const cfg = REPORTS.find(r => r.id === activeReport)
  const Renderer = RENDERERS[activeReport]
  const reportData = data[activeReport]

  return (
    <div className="page-content">

      {/* ── HEADER ── */}
      <div className="page-header">
        <div>
          <h2>📊 Reports &amp; Export</h2>
          <p>Fleet · Fuel · Drivers · Deliveries · Maintenance — PDF &amp; Excel download</p>
        </div>
        <div className="page-actions">
          <button
            className="rpt-export-btn pdf"
            onClick={() => handleExport('pdf')}
            disabled={!!exporting || loading}
          >
            {exporting === 'pdf' ? '⏳ Generating…' : '📄 Export PDF'}
          </button>
          <button
            className="rpt-export-btn excel"
            onClick={() => handleExport('excel')}
            disabled={!!exporting || loading}
          >
            {exporting === 'excel' ? '⏳ Generating…' : '📊 Export Excel'}
          </button>
          <button
            className="btn-ghost"
            onClick={() => { setData(prev => ({ ...prev, [activeReport]: null })); loadReport(activeReport) }}
          >↺ Refresh</button>
        </div>
      </div>

      {/* ── REPORT SELECTOR TABS ── */}
      <div className="rpt-selector-row">
        {REPORTS.map(r => (
          <button
            key={r.id}
            className={`rpt-selector-tab ${activeReport === r.id ? 'active' : ''}`}
            style={{ '--tab-color': r.color }}
            onClick={() => setActiveReport(r.id)}
          >
            <span className="rpt-tab-icon">{r.icon}</span>
            <div className="rpt-tab-body">
              <span className="rpt-tab-label">{r.label}</span>
              <span className="rpt-tab-desc">{r.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {/* ── REPORT BODY ── */}
      <div className="rpt-body-card">
        <div className="rpt-body-header" style={{ borderLeftColor: cfg?.color }}>
          <span style={{ fontSize: 24 }}>{cfg?.icon}</span>
          <div>
            <h3 style={{ color: '#f1f5f9', margin: 0 }}>{cfg?.label}</h3>
            <p style={{ color: '#64748b', margin: 0, fontSize: 13 }}>{cfg?.desc}</p>
          </div>
        </div>

        {loading && <div className="status-msg" style={{ margin: '24px 0' }}>Loading report data…</div>}
        {error   && <div className="status-msg error" style={{ margin: '24px 0' }}>{error}</div>}

        {!loading && !error && reportData && Renderer && (
          <div className="rpt-content">
            <Renderer data={reportData} />
          </div>
        )}
      </div>
    </div>
  )
}
