import { useEffect, useState } from 'react'
import api, { getApiErrorMessage } from '../services/api'
import { 
  Download, 
  Printer, 
  TrendingUp, 
  Users, 
  Wrench, 
  Package, 
  Activity, 
  AlertTriangle
} from 'lucide-react'

export default function Reports() {
  const [data, setData] = useState({
    drivers: [],
    vehicles: [],
    shipments: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const [driversRes, vehiclesRes, shipmentsRes] = await Promise.all([
        api.get('/drivers/'),
        api.get('/vehicles/'),
        api.get('/shipments/'),
      ])
      setData({
        drivers: driversRes.data || [],
        vehicles: vehiclesRes.data || [],
        shipments: shipmentsRes.data || [],
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to fetch directory items to generate reports.'))
    } finally {
      setLoading(false)
    }
  }

  // Calculations
  const { drivers, vehicles, shipments } = data
  const totalDrivers = drivers.length
  const totalVehicles = vehicles.length
  const totalShipments = shipments.length

  const availableVehicles = vehicles.filter((v) => v.status?.toLowerCase() === 'available').length
  const maintenanceVehicles = vehicles.filter((v) => v.status?.toLowerCase() === 'maintenance' || v.status?.toLowerCase() === 'under maintenance').length
  const busyVehicles = vehicles.filter((v) => v.status?.toLowerCase() === 'in use' || v.status?.toLowerCase() === 'busy').length

  const deliveredShipments = shipments.filter((s) => s.current_status?.toLowerCase() === 'delivered').length
  const transitShipments = shipments.filter((s) => s.current_status?.toLowerCase() === 'in transit' || s.current_status?.toLowerCase() === 'transit').length
  const pendingShipments = shipments.filter((s) => s.current_status?.toLowerCase() === 'created' || s.current_status?.toLowerCase() === 'pending').length

  const handleExportCSV = () => {
    const csvRows = [
      ['FleetFlow Operations Report'],
      ['Generated On', new Date().toLocaleString()],
      [],
      ['Operational Metric', 'Value', 'Percentage (%)'],
      ['Total Drivers Registered', totalDrivers, '-'],
      ['Total Vehicles Fleet Size', totalVehicles, '-'],
      ['Available Vehicles', availableVehicles, `${totalVehicles ? ((availableVehicles / totalVehicles) * 100).toFixed(1) : 0}%`],
      ['Vehicles In Maintenance', maintenanceVehicles, `${totalVehicles ? ((maintenanceVehicles / totalVehicles) * 100).toFixed(1) : 0}%`],
      ['Vehicles In Use / Busy', busyVehicles, `${totalVehicles ? ((busyVehicles / totalVehicles) * 100).toFixed(1) : 0}%`],
      ['Total Shipments Assigned', totalShipments, '-'],
      ['Delivered Shipments', deliveredShipments, `${totalShipments ? ((deliveredShipments / totalShipments) * 100).toFixed(1) : 0}%`],
      ['Shipments In Transit', transitShipments, `${totalShipments ? ((transitShipments / totalShipments) * 100).toFixed(1) : 0}%`],
      ['Pending / Unfinished Shipments', pendingShipments, `${totalShipments ? ((pendingShipments / totalShipments) * 100).toFixed(1) : 0}%`],
    ]

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      csvRows.map((row) => row.map((val) => `"${val}"`).join(',')).join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `fleetflow_report_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrintPDF = () => {
    window.print()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="printable-report">
      
      {/* Top Header & Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }} className="no-print">
        <div>
          <h1 className="page-title">Operations Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Extract metrics, logs, and export database summary metrics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn--secondary" onClick={handleExportCSV}>
            <Download style={{ width: '16px', height: '16px' }} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn--primary" onClick={handlePrintPDF}>
            <Printer style={{ width: '16px', height: '16px' }} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Print-Only Header (Hidden on Screen) */}
      <div className="print-only" style={{ display: 'none', borderBottom: '2px solid var(--text-main)', paddingBottom: '16px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '18px', height: '18px', stroke: '#FFFFFF', strokeWidth: 2.5, fill: 'none' }} viewBox="0 0 32 32">
              <path d="M8 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0-3h16M24 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            </svg>
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800' }}>FleetFlow Operations Report</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Generated on: {new Date().toLocaleString()}</p>
      </div>

      {error ? (
        <div className="error-card">
          <AlertTriangle className="error-card__icon" />
          <h2 className="error-card__title">Retrieve Failed</h2>
          <p className="error-card__desc">{error}</p>
          <button className="btn btn--primary" onClick={fetchData}>
            Retry Load
          </button>
        </div>
      ) : loading ? (
        <div className="loading-container" style={{ minHeight: '40vh' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Metrics Overview Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Fleet breakdown */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <TrendingUp style={{ width: '18px', height: '18px', color: 'var(--primary)' }} />
                <h3 className="card-title">Fleet Breakdown</h3>
              </div>
              <div style={rowStyle}>
                <span>Active Fleets</span>
                <strong style={{ fontSize: '15px' }}>{totalVehicles}</strong>
              </div>
              <div style={rowStyle}>
                <span>Available</span>
                <span className="badge badge--success">
                  {availableVehicles} Available
                </span>
              </div>
              <div style={rowStyle}>
                <span>Under Maintenance</span>
                <span className="badge badge--danger" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                  <Wrench style={{ width: '12px', height: '12px' }} />
                  <span>{maintenanceVehicles} Repairing</span>
                </span>
              </div>
              <div style={rowStyle}>
                <span>On Active Trip</span>
                <span className="badge badge--secondary" style={{ backgroundColor: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD' }}>
                  {busyVehicles} Dispatched
                </span>
              </div>
            </div>

            {/* Shipments breakdown */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <Package style={{ width: '18px', height: '18px', color: 'var(--warning)' }} />
                <h3 className="card-title">Shipments Progress</h3>
              </div>
              <div style={rowStyle}>
                <span>Total Dispatched</span>
                <strong style={{ fontSize: '15px' }}>{totalShipments}</strong>
              </div>
              <div style={rowStyle}>
                <span>Delivered</span>
                <span className="badge badge--success">
                  {deliveredShipments} Completed
                </span>
              </div>
              <div style={rowStyle}>
                <span>In Transit</span>
                <span className="badge badge--warning" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                  <Activity style={{ width: '12px', height: '12px' }} />
                  <span>{transitShipments} Transit</span>
                </span>
              </div>
              <div style={rowStyle}>
                <span>Pending Dispatch</span>
                <span className="badge badge--secondary">
                  {pendingShipments} Pending
                </span>
              </div>
            </div>

            {/* HR breakdown */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <Users style={{ width: '18px', height: '18px', color: 'var(--success)' }} />
                <h3 className="card-title">Human Resources</h3>
              </div>
              <div style={rowStyle}>
                <span>Registered Drivers</span>
                <strong style={{ fontSize: '15px' }}>{totalDrivers}</strong>
              </div>
              <div style={rowStyle}>
                <span>Available (Standby)</span>
                <span className="badge badge--success">
                  {drivers.filter((d) => d.status?.toLowerCase() === 'available').length} Standby
                </span>
              </div>
              <div style={rowStyle}>
                <span>On Duty</span>
                <span className="badge badge--warning">
                  {drivers.filter((d) => d.status?.toLowerCase() === 'busy').length} Active
                </span>
              </div>
              <div style={rowStyle}>
                <span>On Leave</span>
                <span className="badge badge--secondary">
                  {drivers.filter((d) => d.status?.toLowerCase() === 'on leave').length} Leave
                </span>
              </div>
            </div>
          </div>

          {/* Detailed breakdown data sheets for print layout */}
          <div className="datagrid-container">
            <div className="datagrid-header-bar" style={{ borderBottom: 'none' }}>
              <h3 className="section-title" style={{ fontSize: '15px' }}>Detailed Fleet Share Analysis</h3>
            </div>
            <div className="datagrid-wrapper">
              <table className="datagrid">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Total Count</th>
                    <th>Percentage Share</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Available Fleets</td>
                    <td style={{ fontWeight: 600 }}>{availableVehicles}</td>
                    <td>{totalVehicles ? ((availableVehicles / totalVehicles) * 100).toFixed(1) : 0}%</td>
                  </tr>
                  <tr>
                    <td>Vehicles Under Maintenance</td>
                    <td style={{ fontWeight: 600 }}>{maintenanceVehicles}</td>
                    <td>{totalVehicles ? ((maintenanceVehicles / totalVehicles) * 100).toFixed(1) : 0}%</td>
                  </tr>
                  <tr>
                    <td>Vehicles In Active Trip</td>
                    <td style={{ fontWeight: 600 }}>{busyVehicles}</td>
                    <td>{totalVehicles ? ((busyVehicles / totalVehicles) * 100).toFixed(1) : 0}%</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid var(--border-color)', backgroundColor: '#FAFCFD' }}>
                    <td style={{ fontWeight: 700 }}>Total Fleet Size</td>
                    <td style={{ fontWeight: 700 }}>{totalVehicles}</td>
                    <td style={{ fontWeight: 700 }}>100.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CSS Rules to handle printing hide/show */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .main-layout__sidebar {
            display: none !important;
          }
          .main-layout__content {
            margin-left: 0 !important;
          }
          .main-layout__navbar {
            display: none !important;
          }
          .printable-report {
            padding: 0 !important;
          }
          .card {
            border: 1px solid #000000 !important;
            box-shadow: none !important;
          }
          .datagrid-container {
            border: 1px solid #000000 !important;
            box-shadow: none !important;
          }
          .datagrid th {
            background-color: #e2e8f0 !important;
            color: #000000 !important;
            border-bottom: 2px solid #000000 !important;
          }
          .datagrid td {
            border-bottom: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>
    </div>
  )
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '13.5px',
}