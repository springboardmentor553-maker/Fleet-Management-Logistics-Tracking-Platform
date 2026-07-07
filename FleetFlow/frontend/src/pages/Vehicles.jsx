import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import StatusBadge from '../components/StatusBadge'
import VehicleModal from '../components/VehicleModal'
import { vehicleApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Vehicles() {
  const { canManage } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | vehicle-object
  const [deleting, setDeleting] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await vehicleApi.list()
      setVehicles(data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!window.confirm('Remove this vehicle from the fleet?')) return
    setDeleting(id)
    try {
      await vehicleApi.delete(id)
      setVehicles((v) => v.filter((x) => x.id !== id))
    } catch {}
    setDeleting(null)
  }

  function handleSaved() { setModal(null); load() }

  const statuses = ['ALL', 'AVAILABLE', 'IN_USE', 'MAINTENANCE']
  const filtered = vehicles.filter((v) => {
    const matchStatus = filter === 'ALL' || v.current_status === filter
    const matchSearch = v.registration_number.toLowerCase().includes(search.toLowerCase()) ||
                        v.vehicle_type.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="top-bar">
          <div>
            <div className="top-bar-title">Vehicles</div>
            <div className="top-bar-subtitle">Manage your fleet registration</div>
          </div>
        </header>

        <main className="page-content">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Fleet Vehicles</h1>
              <p>{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered</p>
            </div>
            {canManage && (
              <button id="add-vehicle-btn" className="btn btn-primary" onClick={() => setModal('create')}>
                <PlusIcon /> Register Vehicle
              </button>
            )}
          </div>

          <div className="card">
            {/* Filters */}
            <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div className="action-row">
                {statuses.map((s) => (
                  <button key={s}
                    className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setFilter(s)}
                  >
                    {s === 'ALL' ? 'All' : s.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <input
                className="form-input"
                style={{ maxWidth: 220 }}
                placeholder="Search reg. or type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="table-wrapper">
              {loading ? (
                <div style={{ padding: 24 }}>
                  {[...Array(5)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="table-empty">
                  <div className="table-empty-icon">🚛</div>
                  <p>{search || filter !== 'ALL' ? 'No vehicles match your filters.' : 'No vehicles registered yet.'}</p>
                  {canManage && !search && filter === 'ALL' && (
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setModal('create')}>
                      Register first vehicle
                    </button>
                  )}
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Registration</th>
                      <th>Type</th>
                      <th>Fuel</th>
                      <th>Capacity</th>
                      <th>Status</th>
                      {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((v) => (
                      <tr key={v.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{v.id}</td>
                        <td><strong>{v.registration_number}</strong></td>
                        <td>{v.vehicle_type}</td>
                        <td>{v.fuel_type}</td>
                        <td>{v.capacity}t</td>
                        <td><StatusBadge status={v.current_status} /></td>
                        {canManage && (
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-row" style={{ justifyContent: 'flex-end' }}>
                              <button className="btn btn-outline btn-sm" onClick={() => setModal(v)}>
                                <EditIcon /> Edit
                              </button>
                              <button className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(v.id)}
                                disabled={deleting === v.id}
                              >
                                {deleting === v.id ? <span className="spinner spinner-dark" /> : <TrashIcon />}
                                Delete
                              </button>
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
        <VehicleModal
          vehicle={modal === 'create' ? null : modal}
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
