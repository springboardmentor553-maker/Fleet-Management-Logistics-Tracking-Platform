import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { auditApi } from '../api/client'
import * as XLSX from 'xlsx'
export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [filterAction, setFilterAction] = useState('')

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterType) params.resource_type = filterType
      if (filterAction) params.action = filterAction
      const res = await auditApi.list(params)
      setLogs(res.data)
    } catch (err) {
      console.error("Failed to load audit logs", err)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadLogs()
  }, [filterType, filterAction])

  const formatDate = (isoString) => {
    const d = new Date(isoString)
    return d.toLocaleString()
  }

  const exportToCSV = () => {
    if (!logs.length) return;
    const data = logs.map(log => ({
      'Timestamp': formatDate(log.timestamp),
      'Action': log.action,
      'Resource Type': log.resource_type,
      'Resource ID': log.resource_id,
      'User ID': log.user_id,
      'Details': typeof log.details === 'object' ? JSON.stringify(log.details) : log.details
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "AuditLogs");
    XLSX.writeFile(wb, `AuditLogs_Report.xlsx`);
  }

  const formatDetails = (details) => {
    if (!details) return "None";
    if (typeof details !== 'object') return details;
    return Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(', ');
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="top-bar">
          <div>
            <div className="top-bar-title">Audit Logs</div>
            <div className="top-bar-subtitle">System-wide event tracking</div>
          </div>
          <div className="top-bar-right" style={{ gap: '12px' }}>
            <select
              className="form-select"
              style={{ width: '150px' }}
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
            <select
              className="form-select"
              style={{ width: '180px' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Resources</option>
              <option value="Trip">Trip</option>
              <option value="Shipment">Shipment</option>
              <option value="DriverAssignment">Driver Assignment</option>
              <option value="Maintenance">Maintenance</option>
            </select>
            <button className="btn btn-outline btn-sm" onClick={exportToCSV} disabled={logs.length === 0}>
              📥 Export
            </button>
            <button className="btn btn-outline btn-sm" onClick={loadLogs}>
              Refresh
            </button>
          </div>
        </header>
        
        <main className="page-content">
          <div className="card">
            <div className="table-wrapper">
              {loading ? (
                <div style={{ padding: 24 }}>
                  {[...Array(5)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
                </div>
              ) : logs.length === 0 ? (
                <div className="table-empty">
                  <div className="table-empty-icon">🛡️</div>
                  <p>No audit logs found.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>Resource Type</th>
                      <th>Resource ID</th>
                      <th>User ID</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(log.timestamp)}</td>
                        <td>
                          <span className={`badge ${log.action === 'CREATE' ? 'badge-success' : log.action === 'DELETE' ? 'badge-danger' : 'badge-warning'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td>{log.resource_type}</td>
                        <td>{log.resource_id}</td>
                        <td>{log.user_id}</td>
                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {formatDetails(log.details)}
                          </span>
                        </td>
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
