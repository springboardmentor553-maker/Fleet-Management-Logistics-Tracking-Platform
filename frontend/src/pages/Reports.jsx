import { useEffect, useState } from 'react'
import api, { getApiErrorMessage } from '../services/api'

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

  const deliveredShipments = shipments.filter((s) => s.status?.toLowerCase() === 'delivered').length
  const transitShipments = shipments.filter((s) => s.status?.toLowerCase() === 'in transit' || s.status?.toLowerCase() === 'transit').length
  const pendingShipments = shipments.filter((s) => s.status?.toLowerCase() === 'created' || s.status?.toLowerCase() === 'pending').length

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="printable-report">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '6px' }}>Operations Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Extract metrics, logs, and export database summary metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn--secondary" onClick={handleExportCSV}>
            📥 Export CSV
          </button>
          <button className="btn btn--primary" onClick={handlePrintPDF}>
            🖨️ Export PDF / Print
          </button>
        </div>
      </div>

      {/* Print-Only Header */}
      <div className="print-only" style={{ display: 'none', borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>FleetFlow Operations Report</h1>
        <p style={{ color: '#555', fontSize: '0.9rem' }}>Generated: {new Date().toLocaleString()}</p>
      </div>

      {error ? (
        <div style={errorCardStyle}>
          <p style={{ color: 'var(--danger-color)', fontWeight: 500 }}>{error}</p>
        </div>
      ) : loading ? (
        <div className="loading-container" style={{ minHeight: '40vh' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Metrics Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div style={reportCardStyle}>
              <h3 style={cardTitleStyle}>Fleet Status Breakdown</h3>
              <div style={rowStyle}>
                <span>Active Fleets</span>
                <strong>{totalVehicles}</strong>
              </div>
              <div style={rowStyle}>
                <span>Available</span>
                <span className="badge badge--available">{availableVehicles}</span>
              </div>
              <div style={rowStyle}>
                <span>Under Maintenance</span>
                <span className="badge badge--maintenance">{maintenanceVehicles}</span>
              </div>
              <div style={rowStyle}>
                <span>On Trip</span>
                <span className="badge badge--unassigned" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>{busyVehicles}</span>
              </div>
            </div>

            <div style={reportCardStyle}>
              <h3 style={cardTitleStyle}>Shipments Progress</h3>
              <div style={rowStyle}>
                <span>Total Dispatched</span>
                <strong>{totalShipments}</strong>
              </div>
              <div style={rowStyle}>
                <span>Delivered</span>
                <span className="badge badge--delivered">{deliveredShipments}</span>
              </div>
              <div style={rowStyle}>
                <span>In Transit</span>
                <span className="badge badge--transit" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>{transitShipments}</span>
              </div>
              <div style={rowStyle}>
                <span>Pending Log</span>
                <span className="badge badge--created">{pendingShipments}</span>
              </div>
            </div>

            <div style={reportCardStyle}>
              <h3 style={cardTitleStyle}>Human Resources</h3>
              <div style={rowStyle}>
                <span>Total Active Drivers</span>
                <strong>{totalDrivers}</strong>
              </div>
              <div style={rowStyle}>
                <span>Available (Standby)</span>
                <span className="badge badge--available">
                  {drivers.filter((d) => d.status?.toLowerCase() === 'available').length}
                </span>
              </div>
              <div style={rowStyle}>
                <span>On Duty</span>
                <span className="badge badge--busy">
                  {drivers.filter((d) => d.status?.toLowerCase() === 'busy').length}
                </span>
              </div>
              <div style={rowStyle}>
                <span>Inactive / On Leave</span>
                <span className="badge badge--maintenance" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                  {drivers.filter((d) => d.status?.toLowerCase() === 'on leave').length}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed breakdown data sheets for print layout */}
          <div style={panelStyle}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Detailed Fleet Analysis</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#fafbfd' }}>
                  <th style={thStyle}>Metric</th>
                  <th style={thStyle}>Total Count</th>
                  <th style={thStyle}>Percentage Share</th>
                </tr>
              </thead>
              <tbody>
                <tr style={trStyle}>
                  <td style={tdStyle}>Available Fleets</td>
                  <td style={tdStyle}>{availableVehicles}</td>
                  <td style={tdStyle}>{totalVehicles ? ((availableVehicles / totalVehicles) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr style={trStyle}>
                  <td style={tdStyle}>Vehicles Under Maintenance</td>
                  <td style={tdStyle}>{maintenanceVehicles}</td>
                  <td style={tdStyle}>{totalVehicles ? ((maintenanceVehicles / totalVehicles) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr style={trStyle}>
                  <td style={tdStyle}>Vehicles In Active Trip</td>
                  <td style={tdStyle}>{busyVehicles}</td>
                  <td style={tdStyle}>{totalVehicles ? ((busyVehicles / totalVehicles) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr style={trStyle}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>Total Fleet Size</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{totalVehicles}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add CSS Rules dynamically to handle hide on printing */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background-color: #fff !important;
            color: #000 !important;
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
        }
      `}</style>
    </div>
  )
}

const reportCardStyle = {
  backgroundColor: '#fff',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: 'var(--shadow-sm)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const cardTitleStyle = {
  fontSize: '0.95rem',
  fontWeight: 600,
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '8px',
  marginBottom: '4px',
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.9rem',
}

const panelStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
  padding: '24px',
  boxShadow: 'var(--shadow-sm)',
}

const thStyle = {
  textAlign: 'left',
  padding: '12px 16px',
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  color: 'var(--text-secondary)',
  fontWeight: 600,
}

const tdStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid var(--border-color)',
  fontSize: '0.9rem',
}

const trStyle = {
  borderBottom: '1px solid var(--border-color)',
}

const errorCardStyle = {
  padding: '24px',
  backgroundColor: '#fef2f2',
  border: '1px solid #fee2e2',
  borderRadius: '12px',
  textAlign: 'center',
}