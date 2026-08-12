import api from './axios'

/* ── Report JSON data ────────────────────────────────── */
export const getFleetUtilization    = () => api.get('/reports/fleet-utilization').then(r => r.data)
export const getFuelConsumption     = () => api.get('/reports/fuel-consumption').then(r => r.data)
export const getDriverPerformance   = () => api.get('/reports/driver-performance').then(r => r.data)
export const getDeliveryPerformance = () => api.get('/reports/delivery-performance').then(r => r.data)
export const getMaintenanceReport   = () => api.get('/reports/maintenance').then(r => r.data)

/* ── PDF Export ──────────────────────────────────────── */
export const downloadPDF = async (reportName) => {
  try {
    const res = await api.get(`/reports/export/pdf/${reportName}`, {
      responseType: 'blob',
    })
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fleetflow_${reportName}_${new Date().toISOString().slice(0, 10)}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    let msg = err.message
    if (err.response && err.response.data) {
      try {
        const errorText = err.response.data instanceof Blob ? await err.response.data.text() : JSON.stringify(err.response.data)
        const parsed = JSON.parse(errorText)
        if (parsed.detail) msg = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail)
      } catch {
        // use default msg
      }
    }
    throw new Error(msg || 'PDF export failed')
  }
}

/* ── Excel Export ────────────────────────────────────── */
export const downloadExcel = async (reportName) => {
  try {
    const res = await api.get(`/reports/export/excel/${reportName}`, {
      responseType: 'blob',
    })
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fleetflow_${reportName}_${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    let msg = err.message
    if (err.response && err.response.data) {
      try {
        const errorText = err.response.data instanceof Blob ? await err.response.data.text() : JSON.stringify(err.response.data)
        const parsed = JSON.parse(errorText)
        if (parsed.detail) msg = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail)
      } catch {
        // use default msg
      }
    }
    throw new Error(msg || 'Excel export failed')
  }
}
