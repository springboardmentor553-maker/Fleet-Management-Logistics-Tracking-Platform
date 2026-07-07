import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import { RoleBadge } from '../components/StatusBadge'
import DriverModal from '../components/DriverModal'
import { driverApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Drivers() {
  const { canManage, isAdmin } = useAuth()
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await driverApi.list()
      setDrivers(data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!window.confirm('Remove this driver profile?')) return
    setDeleting(id)
    try {
      await driverApi.delete(id)
      setDrivers((d) => d.filter((x) => x.id !== id))
    } catch {}
    setDeleting(null)
  }

  function handleSaved() { setModal(null); load() }

  const filtered = drivers.filter((d) =>
    d.license_details.toLowerCase().includes(search.toLowerCase()) ||
    String(d.user_id).includes(search)
  )

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="top-bar">
          <div>
            <div className="top-bar-title">Drivers</div>
            <div className="top-bar-subtitle">Manage driver profiles and licenses</div>
          </div>
        </header>

        <main className="page-content">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Driver Profiles</h1>
              <p>{drivers.length} driver{drivers.length !== 1 ? 's' : ''} registered</p>
            </div>
            {canManage && (
              <button id="add-driver-btn" className="btn btn-primary" onClick={() => setModal('create')}>
                <PlusIcon /> Add Driver
              </button>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">All Drivers</div>
              <input
                className="form-input"
                style={{ maxWidth: 240 }}
                placeholder="Search by license or user ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="table-wrapper">
              {loading ? (
                <div style={{ padding: 24 }}>
                  {[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="table-empty">
                  <div className="table-empty-icon">👤</div>
                  <p>{search ? 'No drivers match your search.' : 'No driver profiles yet.'}</p>
                  {canManage && !search && (
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}
                      onClick={() => setModal('create')}>
                      Add first driver
                    </button>
                  )}
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Profile ID</th>
                      <th>User ID</th>
                      <th>License Details</th>
                      {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d) => (
                      <tr key={d.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{d.id}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', background: 'var(--bg-table-head)', padding: '2px 8px', borderRadius: 4, fontSize: '0.82rem' }}>
                            UID {d.user_id}
                          </span>
                        </td>
                        <td><strong>{d.license_details}</strong></td>
                        {canManage && (
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-row" style={{ justifyContent: 'flex-end' }}>
                              <button className="btn btn-outline btn-sm" onClick={() => setModal(d)}>
                                <EditIcon /> Edit
                              </button>
                              {isAdmin && (
                                <button className="btn btn-danger btn-sm"
                                  onClick={() => handleDelete(d.id)}
                                  disabled={deleting === d.id}
                                >
                                  {deleting === d.id ? <span className="spinner spinner-dark" /> : <TrashIcon />}
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {modal && (
        <DriverModal
          driver={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

function PlusIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
function EditIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
}
function TrashIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
}
