import api from './axios'

/* ── Report JSON data ────────────────────────────────── */
export const getFleetUtilization    = () => api.get('/reports/fleet-utilization').then(r => r.data)
export const getFuelConsumption     = () => api.get('/reports/fuel-consumption').then(r => r.data)
export const getDriverPerformance   = () => api.get('/reports/driver-performance').then(r => r.data)
export const getDeliveryPerformance = () => api.get('/reports/delivery-performance').then(r => r.data)
export const getMaintenanceReport   = () => api.get('/reports/maintenance').then(r => r.data)

/* ── PDF Export ──────────────────────────────────────── */
export const downloadPDF = async (reportName) => {
  const token = localStorage.getItem('ff_token')
  const res = await fetch(
    `http://localhost:8000/reports/export/pdf/${reportName}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error('PDF export failed')
  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `fleetflow_${reportName}_${new Date().toISOString().slice(0,10)}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

/* ── Excel Export ────────────────────────────────────── */
export const downloadExcel = async (reportName) => {
  const token = localStorage.getItem('ff_token')
  const res = await fetch(
    `http://localhost:8000/reports/export/excel/${reportName}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error('Excel export failed')
  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `fleetflow_${reportName}_${new Date().toISOString().slice(0,10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
