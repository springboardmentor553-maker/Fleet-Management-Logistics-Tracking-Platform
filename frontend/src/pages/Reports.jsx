import { useState, useEffect, useMemo, useRef } from 'react'
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  Truck,
  Fuel,
  UserCheck,
  PackageCheck,
  Wrench,
  ChevronDown,
  Calendar,
  X,
  ListChecks,
  TrendingUp,
  Award
} from 'lucide-react'
import api from '../api/axios'
import AppDatePicker from '../components/AppDatePicker'

const REPORT_TYPES = [
  { value: 'fleet_utilization', label: 'Fleet Utilization', icon: <Truck size={16} color="#3b82f6" /> },
  { value: 'fuel_consumption', label: 'Fuel Consumption', icon: <Fuel size={16} color="#f5a623" /> },
  { value: 'driver_performance', label: 'Driver Performance', icon: <UserCheck size={16} color="#10b981" /> },
  { value: 'delivery_performance', label: 'Delivery Performance', icon: <PackageCheck size={16} color="#2563eb" /> },
  { value: 'maintenance', label: 'Maintenance Report', icon: <Wrench size={16} color="#ef4444" /> },
]

const COLUMN_LABELS = {
  fleet_utilization: { name: 'Vehicle', metric1: 'Utilization %', metric2: 'KM' },
  fuel_consumption: { name: 'Vehicle', metric1: 'Fuel Used %', metric2: 'Cost (Rs)' },
  driver_performance: { name: 'Driver', metric1: 'Completion Rate %', metric2: 'Completed Trips' },
  delivery_performance: { name: 'Vehicle', metric1: 'Success Rate %', metric2: 'Total Shipments' },
  maintenance: { name: 'Vehicle', metric1: 'Completed %', metric2: 'Total Cost (Rs)' },
}

const ENTITY_LABEL = {
  fleet_utilization: 'Vehicles',
  fuel_consumption: 'Vehicles',
  driver_performance: 'Drivers',
  delivery_performance: 'Vehicles',
  maintenance: 'Vehicles',
}

const toDateInput = (d) => d.toISOString().slice(0, 10)

// A date string is only "usable" once it parses to a real date. While the
// user is mid-way through typing one manually, this stops us from ever
// calling toISOString() on an Invalid Date (which throws and blanks the page).
const isValidDateStr = (str) => {
  if (!str) return false
  const d = new Date(str)
  return !isNaN(d.getTime())
}

const barColor = (pct) => {
  if (pct >= 70) return 'var(--green, #10b981)'
  if (pct >= 40) return '#f5a623'
  return 'var(--red, #ef4444)'
}

export default function Reports({ vehicles = [], drivers = [], trips = [], shipments = [], maintenanceRecords = [] }) {
  const [reportType, setReportType] = useState('fleet_utilization')
  const [startDate, setStartDate] = useState(toDateInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
  const [endDate, setEndDate] = useState(toDateInput(new Date()))
  
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const [fuelRecords, setFuelRecords] = useState([])
  const [fleetUtilData, setFleetUtilData] = useState(null)
  const [loading, setLoading] = useState(true)

  const datePickerRef = useRef(null)
  const typeDropdownRef = useRef(null)

  // Outside click listeners for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false)
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
        setShowTypeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    api.get('/fuel/')
      .then(res => setFuelRecords(res.data))
      .catch(err => console.log('Failed to fetch fuel records:', err))
  }, [])

  useEffect(() => {
    if (reportType !== 'fleet_utilization') { setLoading(false); return }
    // While the user is still typing a date manually, startDate/endDate can
    // briefly be incomplete or unparsable. Skip the fetch until both are
    // valid instead of letting toISOString() throw and crash the page.
    if (!isValidDateStr(startDate) || !isValidDateStr(endDate)) { setLoading(false); return }
    setLoading(true)
    api.get('/reports/fleet-utilization', {
      params: {
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate + 'T23:59:59').toISOString(),
      },
    })
      .then(res => setFleetUtilData(res.data))
      .catch(err => console.log('Failed to fetch fleet utilization:', err))
      .finally(() => setLoading(false))
  }, [reportType, startDate, endDate])

  const inRange = (dateStr) => {
    if (!dateStr) return false
    if (!isValidDateStr(startDate) || !isValidDateStr(endDate)) return false
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return false
    return d >= new Date(startDate) && d <= new Date(endDate + 'T23:59:59')
  }

  const vehicleReg = (id) => vehicles.find(v => v.id === id)?.registration_number || `#${id}`
  const driverName = (id) => drivers.find(d => d.id === id)?.name || `#${id}`

  const rows = useMemo(() => {
    if (reportType === 'fleet_utilization') {
      if (!fleetUtilData) return []
      return fleetUtilData.vehicles.map(v => ({
        name: v.registration_number,
        metric1: v.utilization_percent,
        metric2: `${v.distance_km} KM`,
      }))
    }

    if (reportType === 'fuel_consumption') {
      const filtered = fuelRecords.filter(r => inRange(r.fuel_date))
      const byVehicle = {}
      filtered.forEach(r => {
        if (!byVehicle[r.vehicle_id]) byVehicle[r.vehicle_id] = { liters: 0, cost: 0 }
        byVehicle[r.vehicle_id].liters += r.fuel_quantity
        byVehicle[r.vehicle_id].cost += r.fuel_cost
      })
      const maxLiters = Math.max(...Object.values(byVehicle).map(v => v.liters), 1)
      return Object.entries(byVehicle).map(([vehicleId, v]) => ({
        name: vehicleReg(parseInt(vehicleId)),
        metric1: Math.round((v.liters / maxLiters) * 100),
        metric2: `₹${Math.round(v.cost)}`,
      }))
    }

    if (reportType === 'driver_performance') {
      const filtered = trips.filter(t => inRange(t.scheduled_start))
      const byDriver = {}
      filtered.forEach(t => {
        if (!byDriver[t.driver_id]) byDriver[t.driver_id] = { total: 0, completed: 0 }
        byDriver[t.driver_id].total += 1
        if (t.status === 'completed') byDriver[t.driver_id].completed += 1
      })
      return Object.entries(byDriver).map(([driverId, d]) => ({
        name: driverName(parseInt(driverId)),
        metric1: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
        metric2: `${d.completed} Trips`,
      }))
    }

    if (reportType === 'delivery_performance') {
      const filtered = shipments.filter(s => inRange(s.created_at))
      const byVehicle = {}
      filtered.forEach(s => {
        const key = s.vehicle_id || 'unassigned'
        if (!byVehicle[key]) byVehicle[key] = { total: 0, delivered: 0, cancelled: 0 }
        byVehicle[key].total += 1
        if (s.status === 'delivered') byVehicle[key].delivered += 1
        if (s.status === 'cancelled') byVehicle[key].cancelled += 1
      })
      return Object.entries(byVehicle).map(([vehicleId, s]) => {
        const nonCancelled = s.total - s.cancelled
        return {
          name: vehicleId === 'unassigned' ? 'Unassigned' : vehicleReg(parseInt(vehicleId)),
          metric1: nonCancelled > 0 ? Math.round((s.delivered / nonCancelled) * 100) : 0,
          metric2: `${s.total} Orders`,
        }
      })
    }

    if (reportType === 'maintenance') {
      const filtered = maintenanceRecords.filter(m => inRange(m.service_date))
      const byVehicle = {}
      filtered.forEach(m => {
        if (!byVehicle[m.vehicle_id]) byVehicle[m.vehicle_id] = { total: 0, completed: 0, cost: 0 }
        byVehicle[m.vehicle_id].total += 1
        if (m.status === 'completed') byVehicle[m.vehicle_id].completed += 1
        byVehicle[m.vehicle_id].cost += m.service_cost || 0
      })
      return Object.entries(byVehicle).map(([vehicleId, m]) => ({
        name: vehicleReg(parseInt(vehicleId)),
        metric1: m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0,
        metric2: `₹${Math.round(m.cost)}`,
      }))
    }

    return []
  }, [reportType, fleetUtilData, fuelRecords, trips, shipments, maintenanceRecords, startDate, endDate])

  const cols = COLUMN_LABELS[reportType]
  const currentReportObj = REPORT_TYPES.find(r => r.value === reportType)

  const avgMetric1 = rows.length > 0
    ? Math.round(rows.reduce((sum, r) => sum + r.metric1, 0) / rows.length)
    : 0

  const topRow = rows.length > 0
    ? rows.reduce((best, r) => (r.metric1 > best.metric1 ? r : best), rows[0])
    : null

  const buildExportRows = () => rows.map(r => ({
    [cols.name]: r.name,
    [cols.metric1]: `${r.metric1}%`,
    [cols.metric2]: r.metric2,
  }))

  const downloadBlob = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const data = buildExportRows()
    if (data.length === 0) return
    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h]}"`).join(',')),
    ]
    downloadBlob(csvRows.join('\n'), `${reportType}_${startDate}_to_${endDate}.csv`, 'text/csv')
  }

  const exportExcel = () => {
    const data = buildExportRows()
    if (data.length === 0) return
    const headers = Object.keys(data[0])
    const tableRows = data.map(row => `<tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>`).join('')
    const html = `<table border="1"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table>`
    downloadBlob(html, `${reportType}_${startDate}_to_${endDate}.xls`, 'application/vnd.ms-excel')
  }

  const openPrintableReport = () => {
    const data = buildExportRows()
    const headers = data.length > 0 ? Object.keys(data[0]) : []
    const tableRows = data.map(row => `<tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>`).join('')
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>${currentReportObj?.label}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h2 { margin-bottom: 4px; }
            p { color: #666; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h2>${currentReportObj?.label}</h2>
          <p>${startDate} to ${endDate}</p>
          <table>
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 300)
  }

  const formatDateDisplay = (dateStr) => {
    if (!isValidDateStr(dateStr)) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="ff-section">
      <div className="ff-page-header">
        <div>
          <div className="ff-section-title"><FileText size={16} /><span>Reports & Export</span></div>
          <p className="ff-page-subtitle">Generate and export fleet performance reports</p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="ff-stats" style={{ marginBottom: 18 }}>
        <div className="ff-stat-card">
          <div className="ff-stat-icon-box blue">{currentReportObj?.icon}</div>
          <div className="ff-stat-text">
            <span className="ff-stat-label">{cols.name} Type</span>
            <span className="ff-stat-value" style={{ fontSize: 16 }}>{currentReportObj?.label}</span>
          </div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon-box dark-blue"><ListChecks size={20} /></div>
          <div className="ff-stat-text">
            <span className="ff-stat-label">Total {ENTITY_LABEL[reportType]}</span>
            <span className="ff-stat-value">{loading ? '—' : rows.length}</span>
          </div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon-box orange"><TrendingUp size={20} /></div>
          <div className="ff-stat-text">
            <span className="ff-stat-label">Avg. {cols.metric1}</span>
            <span className="ff-stat-value">{loading ? '—' : `${avgMetric1}%`}</span>
          </div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon-box green"><Award size={20} /></div>
          <div className="ff-stat-text">
            <span className="ff-stat-label">Top Performer</span>
            <span className="ff-stat-value" style={{ fontSize: 16 }}>{loading || !topRow ? '—' : topRow.name}</span>
          </div>
        </div>
      </div>

      <div className="ff-widget-card ff-reports-card">

        {/* Top Controls: Dropdowns Header */}
        <div className="ff-reports-header">
          <h2 className="ff-reports-title">{currentReportObj?.label}</h2>

          <div className="ff-reports-controls">

            {/* 1. Custom Report Type Dropdown */}
            <div className="ff-reports-dropdown-wrap" ref={typeDropdownRef}>
              <button className="ff-reports-pill-btn" onClick={() => setShowTypeDropdown(!showTypeDropdown)}>
                {currentReportObj?.icon}
                <span>{currentReportObj?.label}</span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {showTypeDropdown && (
                <div className="ff-reports-dropdown-menu">
                  {REPORT_TYPES.map(item => (
                    <div
                      key={item.value}
                      onClick={() => {
                        setReportType(item.value)
                        setShowTypeDropdown(false)
                      }}
                      className={`ff-reports-dropdown-item ${reportType === item.value ? 'active' : ''}`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Custom Date Range Picker Pill & Popup */}
            <div className="ff-reports-dropdown-wrap" ref={datePickerRef}>
              <button className="ff-reports-pill-btn" onClick={() => setShowDatePicker(!showDatePicker)}>
                <Calendar size={14} color="var(--text-muted)" />
                <span>{formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}</span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {/* Date Input Popup Box */}
              {showDatePicker && (
                <div className="ff-reports-date-popup">
                  <div className="ff-reports-date-popup-head">
                    <span>Select Custom Dates</span>
                    <button onClick={() => setShowDatePicker(false)} className="ff-reports-icon-btn">
                      <X size={14} />
                    </button>
                  </div>

                  <div className="ff-reports-date-fields">
                    <div>
                      <label>Start Date</label>
                      <AppDatePicker
                        value={startDate}
                        onChange={setStartDate}
                        maxDate={endDate}
                        placeholder="Start date"
                      />
                    </div>
                    <div>
                      <label>End Date</label>
                      <AppDatePicker
                        value={endDate}
                        onChange={setEndDate}
                        minDate={startDate}
                        placeholder="End date"
                      />
                    </div>
                    <button className="ff-reports-apply-btn" onClick={() => setShowDatePicker(false)}>
                      Apply Range
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Export Toolbar */}
        <div className="ff-reports-toolbar">
          <span className="ff-count-pill">{loading ? '…' : rows.length} {ENTITY_LABEL[reportType]}</span>
          <div className="ff-reports-toolbar-actions">
            <button onClick={openPrintableReport} className="ff-export-btn pdf" title="Export PDF">
              <FileText size={14} /> <span>PDF</span>
            </button>
            <button onClick={exportExcel} className="ff-export-btn excel" title="Export Excel">
              <FileSpreadsheet size={14} /> <span>Excel</span>
            </button>
            <button onClick={exportCSV} className="ff-export-btn csv" title="Export CSV">
              <Download size={14} /> <span>CSV</span>
            </button>
            <button onClick={openPrintableReport} className="ff-export-btn print" title="Print Report">
              <Printer size={14} /> <span>Print</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="ff-table-wrap">
          <table className="ff-table">
            <thead>
              <tr>
                <th>{cols.name}</th>
                <th>{cols.metric1}</th>
                <th className="ff-col-right">{cols.metric2}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className="ff-empty-row"><td colSpan="3">Loading report data...</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr className="ff-empty-row"><td colSpan="3">No data for this date range</td></tr>
              )}
              {!loading && rows.map((r, i) => (
                <tr key={i}>
                  <td className="ff-reg-cell" data-label={cols.name}>{r.name}</td>
                  <td data-label={cols.metric1}>
                    <div className="ff-progress-cell">
                      <div className="ff-progress-track">
                        <div className="ff-progress-fill" style={{ width: `${Math.min(r.metric1, 100)}%`, background: barColor(r.metric1) }} />
                      </div>
                      <span className="ff-progress-pct">{r.metric1}%</span>
                    </div>
                  </td>
                  <td className="ff-col-right ff-col-bold" data-label={cols.metric2}>{r.metric2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}