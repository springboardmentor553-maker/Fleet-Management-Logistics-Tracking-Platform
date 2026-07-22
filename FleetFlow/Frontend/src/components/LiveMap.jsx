import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../api/axios'
import { getTrip } from '../api/trips'
import { getVehicles } from '../api/vehicles'
import { getVehicleLocations } from '../api/gps'
import { getShipments, getMyShipments } from '../api/shipments'
import { getRouteEstimate, getRouteVariants } from '../api/route'

// Fix leaflet default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const vehicleIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

const distanceKm = (lat1, lng1, lat2, lng2) => {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null
  const deg2rad = (deg) => deg * Math.PI / 180
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(6371 * c * 10) / 10
}

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions && positions.length > 0) {
      map.fitBounds(positions, { padding: [50, 50] })
    }
  }, [positions, map])
  return null
}

const ROUTE_MODES = [
  { id: 'fastest', label: '🏎️ Fastest Route', color: '#6366f1' },
  { id: 'shortest', label: '⚡ Shortest Route', color: '#22c55e' },
  { id: 'traffic_avoidance', label: '🚦 Traffic Avoidance', color: '#f59e0b' },
  { id: 'fuel_efficient', label: '🍃 Fuel Efficient Route', color: '#06b6d4' },
]

export default function LiveMap({ tripId, user }) {
  const [vehicles,           setVehicles]           = useState([])
  const [shipments,          setShipments]          = useState([])
  const [driverShipment,     setDriverShipment]     = useState(null)
  const [selectedShipmentId, setSelectedShipmentId] = useState(null)
  const [trip,               setTrip]               = useState(null)
  const [error,              setError]              = useState('')
  const [routes,             setRoutes]             = useState({})

  // Route Optimization Module state
  const [routeMode,          setRouteMode]          = useState('fastest')
  const [routeVariantsData,  setRouteVariantsData]  = useState(null)
  const [recalculatedActive, setRecalculatedActive] = useState(false)
  const [optimizing,         setOptimizing]         = useState(false)
  const wsRef = useRef(null)

  const isDriver = user?.role === 'driver'

  const normalizeVehicle = (v) => ({
    id: Number(v.id),
    plate_number: v.plate_number || `Vehicle #${v.id}`,
    latitude: v.latitude != null ? Number(v.latitude) : null,
    longitude: v.longitude != null ? Number(v.longitude) : null,
    current_status: v.current_status || 'available',
  })

  function loadData() {
    if (isDriver) {
      Promise.all([
        getVehicles().catch(() => []),
        getVehicleLocations().catch(() => []),
        getMyShipments().catch(() => []),
      ])
        .then(([vAll, vGps, sList]) => {
          // Merge vehicle locations with full vehicle database
          const vMap = new Map()
          ;(vAll || []).forEach(v => vMap.set(Number(v.id), normalizeVehicle(v)))
          ;(vGps || []).forEach(v => {
            const id = Number(v.id)
            const existing = vMap.get(id) || normalizeVehicle(v)
            vMap.set(id, {
              ...existing,
              latitude: v.latitude != null ? Number(v.latitude) : existing.latitude,
              longitude: v.longitude != null ? Number(v.longitude) : existing.longitude,
            })
          })
          setVehicles(Array.from(vMap.values()))
          const activeShipment = (sList || []).find(s => s.status === 'in_transit') || (sList || [])[0]
          setDriverShipment(activeShipment || null)
          setShipments(activeShipment ? [activeShipment] : [])
          if (activeShipment) setSelectedShipmentId(activeShipment.id)
          setError('')
        })
        .catch((e) => setError(e.message))
    } else {
      Promise.all([
        getVehicles().catch(() => []),
        getVehicleLocations().catch(() => []),
        getShipments().catch(() => []),
      ])
        .then(([vAll, vGps, sList]) => {
          const vMap = new Map()
          ;(vAll || []).forEach(v => vMap.set(Number(v.id), normalizeVehicle(v)))
          ;(vGps || []).forEach(v => {
            const id = Number(v.id)
            const existing = vMap.get(id) || normalizeVehicle(v)
            vMap.set(id, {
              ...existing,
              latitude: v.latitude != null ? Number(v.latitude) : existing.latitude,
              longitude: v.longitude != null ? Number(v.longitude) : existing.longitude,
            })
          })
          setVehicles(Array.from(vMap.values()))
          setShipments(sList || [])
          if (sList && sList.length > 0 && !selectedShipmentId) {
            const firstActive = sList.find(s => s.status === 'in_transit') || sList[0]
            if (firstActive) setSelectedShipmentId(firstActive.id)
          }
          setError('')
        })
        .catch((e) => setError(e.message))
    }
  }

  // WebSocket for live updates
  useEffect(() => {
    let pollingTimer = null
    let reconnectTimer = null
    loadData()

    if (tripId) {
      getTrip(tripId)
        .then(setTrip)
        .catch(() => setTrip(null))
    } else {
      setTrip(null)
    }

    const backendWsBase = api.defaults.baseURL.replace(/^http/, 'ws').replace(/\/$/, '')
    const wsUrl = tripId ? `${backendWsBase}/ws/tracking/${tripId}` : `${backendWsBase}/gps/ws/locations`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setError('')
      if (pollingTimer) {
        window.clearInterval(pollingTimer)
        pollingTimer = null
      }
    }

    ws.onmessage = (e) => {
      try {
        const update = JSON.parse(e.data)

        if (update.type === 'status_update') {
          const targetShipmentId = update.shipment_id ?? update.trip_id
          setShipments(prev => prev.map((shipment) => shipment.id === targetShipmentId ? { ...shipment, status: update.status } : shipment))
          return
        }

        if (update.type === 'location_update' || update.vehicle_id != null) {
          const vehicleId = Number(update.vehicle_id || update.trip_id)
          if (!vehicleId) return

          setVehicles(prev => {
            const existingIndex = prev.findIndex(v => v.id === vehicleId)
            if (existingIndex >= 0) {
              const updated = [...prev]
              updated[existingIndex] = {
                ...updated[existingIndex],
                latitude: Number(update.latitude),
                longitude: Number(update.longitude),
                plate_number: update.plate_number || updated[existingIndex].plate_number,
                current_status: update.current_status || updated[existingIndex].current_status,
              }
              return updated
            } else {
              return [...prev, {
                id: vehicleId,
                plate_number: update.plate_number || `Vehicle #${vehicleId}`,
                latitude: Number(update.latitude),
                longitude: Number(update.longitude),
                current_status: update.current_status || 'in_transit',
              }]
            }
          })
          setError('')
        }
      } catch (err) {
        console.error('Error handling WebSocket message', err)
      }
    }

    const startPolling = () => {
      if (!pollingTimer) {
        pollingTimer = window.setInterval(loadData, 8000)
      }
    }

    const scheduleReconnect = () => {
      if (!reconnectTimer) {
        reconnectTimer = window.setTimeout(() => {
          reconnectTimer = null
          loadData()
        }, 5000)
      }
    }

    ws.onerror = () => {
      setError('WebSocket live stream reconnecting... Showing latest known GPS positions.')
      startPolling()
      scheduleReconnect()
    }

    ws.onclose = () => {
      startPolling()
      scheduleReconnect()
    }

    return () => {
      ws.close()
      if (pollingTimer) window.clearInterval(pollingTimer)
      if (reconnectTimer) window.clearTimeout(reconnectTimer)
    }
  }, [tripId, isDriver])

  // Filter vehicles and shipments
  const activeVehicles = vehicles.filter(v => v.latitude != null && v.longitude != null)

  let shownVehicles = activeVehicles
  if (isDriver && driverShipment) {
    shownVehicles = activeVehicles.filter(v => Number(v.id) === Number(driverShipment.vehicle_id))
  } else if (tripId && trip?.vehicle_id) {
    shownVehicles = activeVehicles.filter(v => v.id === Number(trip.vehicle_id))
  }

  const inTransitShipments = isDriver && driverShipment
    ? [driverShipment]
    : shipments.filter(s => s.status === 'in_transit')

  // Selected shipment for Route Optimization Panel
  const featuredShipment = shipments.find(s => s.id === selectedShipmentId) || inTransitShipments[0] || shipments[0]
  const featuredVehicle = featuredShipment
    ? vehicles.find(v => Number(v.id) === Number(featuredShipment.vehicle_id))
    : shownVehicles[0]

  const tripPickup = trip?.pickup_latitude != null && trip?.pickup_longitude != null
    ? [trip.pickup_latitude, trip.pickup_longitude]
    : null

  const tripDestination = trip?.destination_latitude != null && trip?.destination_longitude != null
    ? [trip.destination_latitude, trip.destination_longitude]
    : null

  const positionsToFit = []
  shownVehicles.forEach(v => positionsToFit.push([v.latitude, v.longitude]))
  if (tripPickup) positionsToFit.push(tripPickup)
  if (tripDestination) positionsToFit.push(tripDestination)

  const title = isDriver
    ? `My Navigation Map — Driver Portal`
    : tripId && trip ? `Trip #${trip.id} Live GPS Tracking` : 'Live Fleet GPS Map'

  // Fetch Route Optimization Variants for the featured shipment
  const handleFetchVariants = (forceRecalculate = false) => {
    if (!featuredShipment) return
    const routeEstimate = routes[featuredShipment.id]
    if (!routeEstimate) return

    setOptimizing(true)
    const payload = {
      origin_lat: routeEstimate.origin_lat,
      origin_lng: routeEstimate.origin_lng,
      destination_lat: routeEstimate.destination_lat,
      destination_lng: routeEstimate.destination_lng,
    }

    if (featuredVehicle && featuredVehicle.latitude != null && featuredVehicle.longitude != null) {
      payload.live_lat = featuredVehicle.latitude
      payload.live_lng = featuredVehicle.longitude
    }

    getRouteVariants(payload)
      .then((data) => {
        setRouteVariantsData(data)
        if (forceRecalculate) {
          setRecalculatedActive(true)
        }
      })
      .catch((e) => setError(e.message || 'Failed to fetch route variants'))
      .finally(() => setOptimizing(false))
  }

  // Fetch individual route estimates for ALL shipments
  useEffect(() => {
    if (shipments.length === 0) return
    const idsToFetch = shipments.map(s => s.id).filter(id => !routes[id])
    if (idsToFetch.length === 0) return

    idsToFetch.forEach((id) => {
      getRouteEstimate(id)
        .then((data) => {
          if (data) {
            setRoutes((prev) => ({
              ...prev,
              [id]: {
                geometry: data.route_geometry || null,
                distance_km: data.route_distance_km,
                duration_min: data.route_duration_min,
                origin_lat: data.origin_lat,
                origin_lng: data.origin_lng,
                destination_lat: data.destination_lat,
                destination_lng: data.destination_lng,
              },
            }))
          }
        })
        .catch(() => {})
    })
  }, [shipments, routes])

  // Automatically fetch variants when featuredShipment or its route estimate changes
  useEffect(() => {
    if (featuredShipment && routes[featuredShipment.id]) {
      setRouteVariantsData(null)
      handleFetchVariants(false)
    }
  }, [selectedShipmentId, featuredShipment?.id, routes[featuredShipment?.id]])

  // Active Variant object for featured shipment
  const activeVariant = routeVariantsData?.variants?.[routeMode]
  const activeRecalculated = recalculatedActive ? routeVariantsData?.recalculated : null

  return (
    <div className="page-content">
      {/* DRIVER SPECIFIC TOP HERO BANNER */}
      {isDriver && (
        <div className="setting-card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderColor: '#3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span className="role-pill" style={{ '--pill-color': '#10b981', marginBottom: '8px' }}>
                ● Active Assigned Trip Navigation
              </span>
              <h3 style={{ margin: '4px 0 2px', color: '#f8fafc', fontSize: '20px' }}>
                {driverShipment ? `Shipment #${driverShipment.id}: ${driverShipment.origin} → ${driverShipment.destination}` : 'No active shipment assigned'}
              </h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
                Assigned Vehicle: <strong>{featuredVehicle ? featuredVehicle.plate_number : '—'}</strong> | Live GPS: <strong>{featuredVehicle?.latitude ? `${featuredVehicle.latitude.toFixed(4)}, ${featuredVehicle.longitude.toFixed(4)}` : 'Pending'}</strong>
              </p>
            </div>
            {featuredVehicle?.latitude && (
              <div className="status-badge available" style={{ fontSize: '13px', padding: '6px 14px' }}>
                ● GPS Live & Streaming
              </div>
            )}
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h2>{title}</h2>
          <p>Real-time vehicle coordinates · Telemetry & Route Optimization</p>
        </div>
        <div className="page-actions">
          <button
            className="btn-primary"
            onClick={() => handleFetchVariants(true)}
            disabled={optimizing || !featuredShipment}
          >
            {optimizing ? 'Calculating...' : '🔄 Recalculate from Live GPS'}
          </button>
          <div className="ws-indicator">
            <span className="ws-dot"></span> Live Telemetry
          </div>
        </div>
      </div>

      {error && <div className="status-msg error">{error}</div>}

      {/* ROUTE OPTIMIZATION MODULE CONTROL PANEL */}
      {featuredShipment && (
        <div className="route-opt-panel">
          <div className="route-opt-header">
            <div>
              <h4>Route Optimization Module</h4>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                Optimizing for Shipment #{featuredShipment.id} ({featuredShipment.origin} → {featuredShipment.destination})
              </span>
            </div>
            {!isDriver && shipments.length > 1 && (
              <div className="field" style={{ minWidth: '220px' }}>
                <select
                  value={selectedShipmentId || ''}
                  onChange={(e) => setSelectedShipmentId(Number(e.target.value))}
                  style={{ background: '#0f172a', padding: '6px 12px', fontSize: '13px', borderRadius: '8px', color: '#f1f5f9' }}
                >
                  {shipments.map(s => (
                    <option key={s.id} value={s.id}>
                      Shipment #{s.id} ({s.origin} → {s.destination})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="route-mode-tabs">
            {ROUTE_MODES.map((mode) => (
              <button
                key={mode.id}
                className={`route-mode-tab ${routeMode === mode.id && !recalculatedActive ? 'active' : ''}`}
                style={{ '--mode-color': mode.color }}
                onClick={() => {
                  setRouteMode(mode.id)
                  setRecalculatedActive(false)
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {activeVariant && (
            <div className="route-metrics-bar">
              <div className="metric-chip">
                <span className="m-label">Selected Strategy</span>
                <span className="m-val highlight">{activeVariant.name}</span>
              </div>
              <div className="metric-chip">
                <span className="m-label">Distance Optimization</span>
                <span className="m-val">{activeVariant.distance_km} km</span>
              </div>
              <div className="metric-chip">
                <span className="m-label">Est. Travel Time</span>
                <span className="m-val">{activeVariant.duration_min} mins</span>
              </div>
              <div className="metric-chip">
                <span className="m-label">Traffic Congestion</span>
                <span className="m-val green">{activeVariant.traffic_factor}x Index</span>
              </div>
              <div className="metric-chip">
                <span className="m-label">Est. Fuel Burn</span>
                <span className="m-val cyan">{activeVariant.fuel_liters} Liters</span>
              </div>
            </div>
          )}

          {activeRecalculated && (
            <div className="status-msg" style={{ marginTop: 12, background: '#0f766e', color: '#f8fafc', borderColor: '#14b8a6', borderRadius: '10px' }}>
              <strong>✓ Recalculated from Live Vehicle Location:</strong> {activeRecalculated.distance_km} km · {activeRecalculated.duration_min} min ETA directly to destination
            </div>
          )}
        </div>
      )}

      {/* MAP CONTAINER */}
      <div className="map-wrap" style={{ marginTop: '16px' }}>
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: '520px', width: '100%', borderRadius: '16px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {positionsToFit.length > 0 && <FitBounds positions={positionsToFit} />}

          {shownVehicles.map(v => {
            const shipment = shipments.find(s => Number(s.vehicle_id) === Number(v.id))
            const routeEstimate = shipment ? routes[shipment.id] : null

            return (
              <Marker
                key={`veh-${v.id}`}
                position={[v.latitude, v.longitude]}
                icon={vehicleIcon}
              >
                <Popup>
                  <div className="map-popup">
                    <div className="popup-title">🚛 {v.plate_number}</div>
                    <div className="popup-status">
                      <span className={`status-badge ${v.current_status === 'in_transit' ? 'in-transit' : 'available'}`}>
                        {v.current_status === 'in_transit' ? 'In Transit' : v.current_status}
                      </span>
                    </div>
                    <div className="popup-coords">📍 {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}</div>
                    {shipment && (
                      <div className="eta-box">
                        <div>📦 <strong>Cargo:</strong> {shipment.origin} → {shipment.destination}</div>
                        {routeEstimate && (
                          <div style={{ marginTop: 6, color: '#38bdf8', fontWeight: 600 }}>
                            ⏱ ETA: {routeEstimate.duration_min} min ({routeEstimate.distance_km} km)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {tripPickup && (
            <Marker position={tripPickup} icon={pickupIcon}>
              <Popup>
                <div className="map-popup">
                  <strong>📍 Pickup Point</strong>
                  <div>{trip?.shipment_origin || featuredShipment?.origin || 'Origin'}</div>
                </div>
              </Popup>
            </Marker>
          )}

          {tripDestination && (
            <Marker position={tripDestination} icon={destIcon}>
              <Popup>
                <div className="map-popup">
                  <strong>🏁 Destination Point</strong>
                  <div>{trip?.shipment_destination || featuredShipment?.destination || 'Destination'}</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Draw route polylines */}
          {activeRecalculated?.geometry ? (
            <Polyline
              positions={activeRecalculated.geometry}
              pathOptions={{ color: '#10b981', weight: 6, opacity: 0.9, dashArray: '6, 6' }}
            />
          ) : activeVariant?.geometry ? (
            <Polyline
              positions={activeVariant.geometry}
              pathOptions={{
                color: ROUTE_MODES.find(m => m.id === routeMode)?.color || '#3b82f6',
                weight: 5,
                opacity: 0.85
              }}
            />
          ) : (
            Object.keys(routes).map((sid) => {
              const r = routes[sid]
              if (!r || !r.geometry) return null
              return (
                <Polyline
                  key={`route-${sid}`}
                  positions={r.geometry}
                  pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.8 }}
                />
              )
            })
          )}
        </MapContainer>
      </div>

      {/* Telemetry Table */}
      {shipments.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ color: '#f1f5f9', fontSize: 18, marginBottom: 14 }}>
            {isDriver ? 'My Assigned Trip Telemetry' : 'Active Fleet Telemetry & Live Coordinates'}
          </h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shipment</th>
                  <th>Route</th>
                  <th>Assigned Vehicle</th>
                  <th>Live GPS Coordinates</th>
                  <th>Estimated ETA</th>
                  <th>Total & Remaining Distance</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map(s => {
                  const v = vehicles.find(veh => Number(veh.id) === Number(s.vehicle_id))
                  const hasGPS = v?.latitude != null && v?.longitude != null
                  const routeInfo = routes[s.id]

                  const remainingKm = hasGPS && routeInfo?.destination_lat != null
                    ? distanceKm(v.latitude, v.longitude, routeInfo.destination_lat, routeInfo.destination_lng)
                    : null

                  return (
                    <tr key={s.id}>
                      <td className="id-cell">#{s.id}</td>
                      <td>{s.origin} → {s.destination}</td>
                      <td>
                        {v ? (
                          <span className="plate-badge">🚛 {v.plate_number}</span>
                        ) : s.vehicle_id ? (
                          <span className="plate-badge">Vehicle #{s.vehicle_id}</span>
                        ) : (
                          <span className="unassigned">Unassigned</span>
                        )}
                      </td>
                      <td>
                        {hasGPS ? (
                          <span className="gps-live-text">📍 {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}</span>
                        ) : (
                          <span className="unassigned">Pending GPS</span>
                        )}
                      </td>
                      <td>
                        {routeInfo ? (
                          <span className="eta-badge">{routeInfo.duration_min} mins</span>
                        ) : (
                          <span className="eta-badge">Calculating...</span>
                        )}
                      </td>
                      <td>
                        {routeInfo ? (
                          <div>
                            <strong>{routeInfo.distance_km} km Total</strong>
                            {remainingKm != null && (
                              <span style={{ color: '#38bdf8', fontSize: '12px', display: 'block' }}>
                                {remainingKm} km Remaining
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="unassigned">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
