import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { trackingWsUrl } from '../api/client'

/* ─────────────────────────────────────────────────────────────────────────────
   LiveTracking.jsx
   ─────────────────────────────────────────────────────────────────────────────
   • Connects to /ws/tracking/{tripId} WebSocket
   • Uses Leaflet + Leaflet Routing Machine (OSRM) to draw the actual road route
   • Vehicle marker moves along the road in real-time (every 3s from WS)
   • Side panel shows GPS coords, turn-by-turn directions, status event log
   ───────────────────────────────────────────────────────────────────────────── */

export default function LiveTracking() {
  const { tripId: paramTripId } = useParams()
  const navigate = useNavigate()

  // ── State ──────────────────────────────────────────────────────────────────
  const [inputId,    setInputId]    = useState(paramTripId || '')
  const [tripId,     setTripId]     = useState(paramTripId || '')
  const [connected,  setConnected]  = useState(false)
  const [snapshot,   setSnapshot]   = useState(null)
  const [location,   setLocation]   = useState(null)
  const [statusLog,  setStatusLog]  = useState([])
  const [clients,    setClients]    = useState(0)
  const [routeInfo,  setRouteInfo]  = useState(null)   // from LRM
  const [directions, setDirections] = useState([])     // turn-by-turn steps

  // ── Refs ───────────────────────────────────────────────────────────────────
  const mapDivRef    = useRef(null)
  const mapRef       = useRef(null)
  const LRef         = useRef(null)   // Leaflet namespace
  const markerRef    = useRef(null)
  const routingRef   = useRef(null)   // LRM control
  const wsRef        = useRef(null)

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Init Leaflet map (once)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return

    Promise.all([
      import('leaflet'),
      import('leaflet-routing-machine'),
      import('leaflet/dist/leaflet.css'),
      import('leaflet-routing-machine/dist/leaflet-routing-machine.css'),
    ]).then(([leafletMod]) => {
      const L = leafletMod.default || leafletMod
      LRef.current = L

      // Fix Vite icon path
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapDivRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Draw route with LRM when snapshot (with coords) arrives
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const L   = LRef.current
    const map = mapRef.current
    if (!L || !map || !snapshot?.lat || !snapshot?.destination_lat) return

    // Remove previous routing control
    if (routingRef.current) {
      routingRef.current.remove()
      routingRef.current = null
    }

    const pickup = L.latLng(snapshot.lat,             snapshot.lng)
    const dest   = L.latLng(snapshot.destination_lat, snapshot.destination_lng)

    // Custom waypoint icons
    const makeIcon = (emoji, color) => L.divIcon({
      html: `<div style="
        background:${color}; border:2.5px solid #fff; border-radius:50%;
        width:26px; height:26px; display:flex; align-items:center;
        justify-content:center; font-size:13px;
        box-shadow:0 2px 6px rgba(0,0,0,.35);">
        ${emoji}
      </div>`,
      iconSize: [26, 26], iconAnchor: [13, 13], className: '',
    })

    const routing = L.Routing.control({
      waypoints: [pickup, dest],
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving',
      }),
      lineOptions: {
        styles: [
          { color: '#1e40af', opacity: 0.2, weight: 8 },   // shadow
          { color: '#3b82f6', opacity: 0.85, weight: 4 },  // main line
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      createMarker: (i, wp) => {
        return L.marker(wp.latLng, {
          icon: i === 0 ? makeIcon('🟢', '#22c55e') : makeIcon('🏁', '#ef4444'),
          title: i === 0 ? 'Pickup' : 'Destination',
        })
      },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      // Hide the default turn-by-turn panel (we render our own)
      show: false,
      collapsible: false,
      containerClassName: 'lrm-hidden',
    })

    routing.on('routesfound', (e) => {
      const route = e.routes[0]
      setRouteInfo({
        distance: (route.summary.totalDistance / 1000).toFixed(1) + ' km',
        duration: formatDuration(route.summary.totalTime),
        name:     route.name,
      })
      // Extract turn-by-turn steps
      const steps = route.instructions?.map(ins => ({
        text: ins.text,
        distance: ins.distance > 0
          ? ins.distance >= 1000
            ? `${(ins.distance / 1000).toFixed(1)} km`
            : `${Math.round(ins.distance)} m`
          : '',
      })) || []
      setDirections(steps)
    })

    routing.addTo(map)
    routingRef.current = routing
  }, [snapshot])  // eslint-disable-line

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Move vehicle marker when location updates arrive
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const L   = LRef.current
    const map = mapRef.current
    if (!L || !map || !location) return

    const { lat, lng } = location

    const vehicleIcon = L.divIcon({
      html: `<div style="
        background:#1d4ed8; border:3px solid #fff; border-radius:50% 50% 50% 0;
        width:30px; height:30px; transform:rotate(-45deg);
        box-shadow:0 3px 10px rgba(0,0,0,.4);
        display:flex; align-items:center; justify-content:center;">
        <span style="transform:rotate(45deg); font-size:14px;">🚛</span>
      </div>`,
      iconSize: [30, 30], iconAnchor: [15, 30], className: '',
    })

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { icon: vehicleIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindTooltip('Vehicle Location', { permanent: false })
    } else {
      markerRef.current.setLatLng([lat, lng])
    }

    // Gentle pan only when zoomed in enough
    if (map.getZoom() >= 9) {
      map.panTo([lat, lng], { animate: true, duration: 1.2 })
    }
  }, [location])

  // ─────────────────────────────────────────────────────────────────────────
  // 4. WebSocket connection
  // ─────────────────────────────────────────────────────────────────────────
  const connect = useCallback((id) => {
    if (wsRef.current) wsRef.current.close()

    const ws = new WebSocket(trackingWsUrl(id))
    wsRef.current = ws

    ws.onopen    = () => setConnected(true)
    ws.onerror   = () => setConnected(false)
    ws.onclose   = () => setConnected(false)

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
          setStatusLog(p => [
            { status: msg.status, tracking: msg.tracking_number, ts: msg.timestamp },
            ...p,
          ].slice(0, 25))
          break
        case 'client_joined':
        case 'client_left':
          setClients(msg.clients_watching)
          break
        default: break
      }
    }
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    setConnected(false)
    // Remove routing control
    if (routingRef.current) { routingRef.current.remove(); routingRef.current = null }
    if (markerRef.current)  { markerRef.current.remove();  markerRef.current  = null }
    setSnapshot(null); setRouteInfo(null); setDirections([]); setStatusLog([])
  }, [])

  // Auto-connect on URL param
  useEffect(() => {
    if (paramTripId) { setTripId(paramTripId); connect(paramTripId) }
    return () => { if (wsRef.current) wsRef.current.close() }
  }, [paramTripId])  // eslint-disable-line

  function handleConnect() {
    const id = inputId.trim()
    if (!id) return
    setTripId(id)
    navigate(`/tracking/${id}`, { replace: true })
    connect(id)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content" style={{ overflow: 'hidden' }}>

        {/* ── Top bar ── */}
        <header className="top-bar">
          <div>
            <div className="top-bar-title">Live Tracking</div>
            <div className="top-bar-subtitle">OSRM road routing · WebSocket GPS stream</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: connected ? '#22c55e' : '#94a3b8',
              boxShadow: connected ? '0 0 0 3px rgba(34,197,94,.25)' : 'none',
            }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {connected
                ? `Connected · ${clients} viewer${clients !== 1 ? 's' : ''}`
                : 'Disconnected'}
            </span>
          </div>
        </header>

        <main style={{
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          gap: 14,
          padding: '16px 20px',
          height: 'calc(100vh - 72px)',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}>

          {/* ── Connect controls ── */}
          <div className="card" style={{ flexShrink: 0 }}>
            <div style={{ padding: '12px 18px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Trip ID</label>
                <input className="form-input" style={{ width: 110 }} type="number" min="1"
                  value={inputId} onChange={e => setInputId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !connected && handleConnect()}
                  placeholder="e.g. 2" />
              </div>
              <button className="btn btn-primary" onClick={handleConnect} disabled={connected}>
                ⚡ Connect
              </button>
              {connected && (
                <button className="btn btn-outline"
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  onClick={disconnect}>
                  ✕ Disconnect
                </button>
              )}
              {snapshot && (
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    {snapshot.pickup_location} → {snapshot.destination}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    {snapshot.tracking_number} · {snapshot.shipment_status}
                    {routeInfo && ` · ${routeInfo.distance} · ${routeInfo.duration}`}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Map + side panels ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 290px',
            gap: 14,
            minHeight: 0,
          }}>

            {/* Map */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
              <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

              {!connected && !snapshot && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 999,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(15,17,23,.75)', gap: 10,
                }}>
                  <span style={{ fontSize: 48 }}>📡</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    Enter a Trip ID and click Connect
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                    The route will be drawn on the map using OSRM road data
                  </span>
                </div>
              )}
            </div>

            {/* Side panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>

              {/* GPS position */}
              <div className="card" style={{ flexShrink: 0 }}>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-primary)', marginBottom: 10 }}>
                    📍 Live Position
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Mini label="Latitude"  value={location?.lat?.toFixed(5) ?? '—'} />
                    <Mini label="Longitude" value={location?.lng?.toFixed(5) ?? '—'} />
                    <Mini label="Trip"      value={tripId ? `#${tripId}` : '—'} />
                    <Mini label="Viewers"   value={clients} />
                  </div>
                </div>
              </div>

              {/* Route summary */}
              {routeInfo && (
                <div className="card" style={{ flexShrink: 0 }}>
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-primary)', marginBottom: 10 }}>
                      🗺️ Route (via OSRM)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Row label="Distance" value={routeInfo.distance} />
                      <Row label="Duration" value={routeInfo.duration} />
                      {snapshot && <Row label="Status" value={snapshot.status} />}
                    </div>
                  </div>
                </div>
              )}

              {/* Turn-by-turn directions */}
              {directions.length > 0 && (
                <div className="card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px 16px 4px', fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-primary)', flexShrink: 0 }}>
                    🧭 Directions ({directions.length} steps)
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 12px' }}>
                    {directions.map((step, i) => (
                      <div key={i} style={{
                        padding: '5px 0',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '0.74rem',
                        display: 'flex',
                        gap: 6,
                        alignItems: 'baseline',
                      }}>
                        <span style={{
                          minWidth: 20, fontSize: '0.68rem', fontWeight: 700,
                          color: 'var(--color-primary)', flexShrink: 0,
                        }}>{i + 1}.</span>
                        <div>
                          <span>{step.text}</span>
                          {step.distance && (
                            <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                              — {step.distance}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status event log */}
              <div className="card" style={{
                flex: directions.length === 0 ? 1 : '0 0 auto',
                minHeight: 0,
                maxHeight: directions.length === 0 ? '100%' : 160,
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ padding: '12px 16px 4px', fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-primary)', flexShrink: 0 }}>
                  📦 Status Updates
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 12px' }}>
                  {statusLog.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: 8 }}>
                      Waiting for status changes…
                    </p>
                  ) : statusLog.map((e, i) => (
                    <div key={i} style={{
                      padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '0.74rem',
                    }}>
                      <div style={{ fontWeight: 700, color: '#ca8a04' }}>{e.status}</div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        {e.tracking} · {new Date(e.ts).toLocaleTimeString('en-IN')}
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

// ─── Helper components ────────────────────────────────────────────────────────

function Mini({ label, value }) {
  return (
    <div style={{ background: 'var(--bg-table-head)', borderRadius: 6, padding: '6px 10px' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: '0.82rem', wordBreak: 'break-all' }}>{value}</div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value || '—'}</span>
    </div>
  )
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h} hr ${m} min` : `${m} min`
}
