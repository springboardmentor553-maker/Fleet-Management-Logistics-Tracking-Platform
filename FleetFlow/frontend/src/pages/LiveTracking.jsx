import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { tripApi, trackingWsUrl } from '../api/client'

export default function LiveTracking() {
  const { tripId: paramTripId } = useParams()
  const navigate = useNavigate()

  const [tripId,    setTripId]    = useState(paramTripId || '')
  const [inputId,   setInputId]   = useState(paramTripId || '')
  const [connected, setConnected] = useState(false)
  const [snapshot,  setSnapshot]  = useState(null)
  const [location,  setLocation]  = useState(null)  // { lat, lng }
  const [statusLog, setStatusLog] = useState([])
  const [clients,   setClients]   = useState(0)
  const [locHistory, setLocHistory] = useState([])

  const wsRef       = useRef(null)
  const mapRef      = useRef(null)         // Leaflet map instance
  const markerRef   = useRef(null)         // Moving vehicle marker
  const trailRef    = useRef(null)         // Polyline trail
  const destRef     = useRef(null)         // Destination marker
  const mapDivRef   = useRef(null)         // DOM node
  const leafletRef  = useRef(null)         // L namespace

  // ── Init Leaflet map ──────────────────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then(L => {
      leafletRef.current = L.default || L

      // Fix broken default icon paths in Vite
      delete leafletRef.current.Icon.Default.prototype._getIconUrl
      leafletRef.current.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = leafletRef.current.map(mapDivRef.current, {
        center: [20.5937, 78.9629],  // centre of India
        zoom: 5,
        zoomControl: true,
      })

      leafletRef.current.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '© OpenStreetMap contributors' }
      ).addTo(map)

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // ── Update map when location changes ─────────────────────────
  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current
    if (!L || !map || !location) return

    const { lat, lng } = location

    // Vehicle marker
    const vehicleIcon = L.divIcon({
      html: `<div style="
        background: #4f8ef7; border: 3px solid white; border-radius: 50% 50% 50% 0;
        width: 28px; height: 28px; transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,.4);
        display: flex; align-items: center; justify-content: center;
      "><span style="transform:rotate(45deg); font-size:14px;">🚛</span></div>`,
      iconSize: [28, 28], iconAnchor: [14, 28], className: '',
    })

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { icon: vehicleIcon })
        .addTo(map)
        .bindPopup('Vehicle')
    } else {
      markerRef.current.setLatLng([lat, lng])
    }

    // Pan map to follow the vehicle (smooth pan only if zoomed in)
    if (map.getZoom() >= 8) {
      map.panTo([lat, lng], { animate: true, duration: 1.5 })
    }

    // Trail polyline
    const newHistory = [...locHistory, [lat, lng]]
    setLocHistory(newHistory)
    if (trailRef.current) {
      trailRef.current.setLatLngs(newHistory)
    } else {
      trailRef.current = L.polyline(newHistory, {
        color: '#4f8ef7', weight: 3, opacity: 0.7, dashArray: '6 4',
      }).addTo(map)
    }
  }, [location])  // eslint-disable-line

  // ── Place destination marker from snapshot ─────────────────
  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current
    if (!L || !map || !snapshot?.destination_lat) return

    const destIcon = L.divIcon({
      html: `<div style="
        background: #22c55e; border: 3px solid white; border-radius: 50%;
        width: 22px; height: 22px; box-shadow: 0 2px 6px rgba(0,0,0,.4);
        display: flex; align-items: center; justify-content: center; font-size:11px;
      ">🏁</div>`,
      iconSize: [22, 22], iconAnchor: [11, 11], className: '',
    })

    if (!destRef.current) {
      destRef.current = L.marker(
        [snapshot.destination_lat, snapshot.destination_lng],
        { icon: destIcon }
      ).addTo(map).bindPopup(`Destination: ${snapshot.destination}`)
    }

    // Fit map to show both pickup and destination
    if (snapshot.lat && snapshot.lng) {
      const bounds = L.latLngBounds(
        [snapshot.lat, snapshot.lng],
        [snapshot.destination_lat, snapshot.destination_lng]
      )
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 })
    }
  }, [snapshot])

  // ── WebSocket connection ──────────────────────────────────────
  const connect = useCallback((id) => {
    if (wsRef.current) wsRef.current.close()

    const ws = new WebSocket(trackingWsUrl(id))
    wsRef.current = ws

    ws.onopen = () => setConnected(true)

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data)
      switch (msg.event) {
        case 'snapshot':
          setSnapshot(msg)
          setClients(msg.clients_watching)
          if (msg.lat && msg.lng) setLocation({ lat: msg.lat, lng: msg.lng })
          break
        case 'location_update':
          setLocation({ lat: msg.lat, lng: msg.lng })
          break
        case 'status_update':
          setStatusLog(p => [{
            status: msg.status, tracking: msg.tracking_number, ts: msg.timestamp,
          }, ...p].slice(0, 20))
          break
        case 'client_joined':
        case 'client_left':
          setClients(msg.clients_watching)
          break
        default: break
      }
    }

    ws.onerror  = () => setConnected(false)
    ws.onclose  = () => setConnected(false)
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) wsRef.current.close()
    setConnected(false)
  }, [])

  // Connect on mount if tripId is provided in URL
  useEffect(() => {
    if (paramTripId) { setTripId(paramTripId); connect(paramTripId) }
    return () => { if (wsRef.current) wsRef.current.close() }
  }, [paramTripId]) // eslint-disable-line

  function handleConnect() {
    if (!inputId) return
    const id = inputId.trim()
    setTripId(id)
    navigate(`/tracking/${id}`, { replace: true })
    connect(id)
    setStatusLog([])
    setLocHistory([])
    // Reset markers
    if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
    if (trailRef.current)  { trailRef.current.remove();  trailRef.current  = null }
    if (destRef.current)   { destRef.current.remove();   destRef.current   = null }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="top-bar">
          <div>
            <div className="top-bar-title">Live Tracking</div>
            <div className="top-bar-subtitle">Real-time vehicle GPS via WebSocket</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: connected ? '#22c55e' : '#64748b',
              boxShadow: connected ? '0 0 0 3px rgba(34,197,94,.3)' : 'none',
            }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {connected ? `Connected · ${clients} viewer${clients !== 1 ? 's' : ''}` : 'Disconnected'}
            </span>
          </div>
        </header>

        <main className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 16, height: 'calc(100vh - 72px)', overflow: 'hidden' }}>
          {/* ── Controls ── */}
          <div className="card" style={{ flexShrink: 0 }}>
            <div style={{ padding: '14px 20px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Trip ID</label>
                <input className="form-input" style={{ width: 120 }} type="number" min="1"
                  value={inputId} onChange={e => setInputId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConnect()}
                  placeholder="e.g. 2" />
              </div>
              <button className="btn btn-primary" onClick={handleConnect} disabled={connected}>
                ⚡ Connect
              </button>
              {connected && (
                <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  onClick={disconnect}>
                  ✕ Disconnect
                </button>
              )}
              {snapshot && (
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {snapshot.pickup_location} → {snapshot.destination}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Shipment: {snapshot.tracking_number} · Status: {snapshot.shipment_status}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Map + Sidebar panel ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, flex: 1, minHeight: 0 }}>

            {/* Map */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
              <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
              <div ref={mapDivRef} style={{ width: '100%', height: '100%', minHeight: 400 }} />
              {!connected && !snapshot && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(15,17,23,.75)', flexDirection: 'column', gap: 10, zIndex: 999,
                }}>
                  <span style={{ fontSize: 40 }}>📡</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Enter a Trip ID and click Connect
                  </span>
                </div>
              )}
            </div>

            {/* Info sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
              {/* Current position */}
              <div className="card" style={{ flexShrink: 0 }}>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, color: 'var(--accent)' }}>
                    📍 Current Position
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <StatMini label="Lat" value={location?.lat?.toFixed(6) ?? '—'} />
                    <StatMini label="Lng" value={location?.lng?.toFixed(6) ?? '—'} />
                    <StatMini label="Trip" value={tripId ? `#${tripId}` : '—'} />
                    <StatMini label="Viewers" value={clients} />
                  </div>
                </div>
              </div>

              {/* Trip info */}
              {snapshot && (
                <div className="card" style={{ flexShrink: 0 }}>
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, color: 'var(--accent)' }}>
                      🚛 Trip Info
                    </div>
                    <div style={{ fontSize: '0.8rem', lineHeight: 1.8 }}>
                      <Row label="Status" value={snapshot.status} />
                      <Row label="Tracking #" value={snapshot.tracking_number} />
                      <Row label="Shipment" value={snapshot.shipment_status} />
                    </div>
                  </div>
                </div>
              )}

              {/* Status event log */}
              <div className="card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 16px 4px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent)', flexShrink: 0 }}>
                  📦 Status Updates
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 12px' }}>
                  {statusLog.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: 8 }}>
                      Waiting for status changes…
                    </p>
                  ) : statusLog.map((entry, i) => (
                    <div key={i} style={{
                      padding: '6px 0', borderBottom: '1px solid var(--border)',
                      fontSize: '0.75rem',
                    }}>
                      <div style={{ fontWeight: 700, color: '#eab308' }}>{entry.status}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {entry.tracking} · {new Date(entry.ts).toLocaleTimeString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function StatMini({ label, value }) {
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 6, padding: '6px 10px' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{value}</div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value || '—'}</span>
    </div>
  )
}
