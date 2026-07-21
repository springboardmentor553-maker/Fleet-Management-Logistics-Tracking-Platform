import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../api/axios'
import { getTrip } from '../api/trips'
import { getVehicleLocations } from '../api/gps'
import { getShipments } from '../api/shipments'
import { getRouteEstimate } from '../api/route'

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

// Haversine distance in km
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const distanceKm = (lat1, lng1, lat2, lng2) => {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null
  const deg2rad = (deg) => deg * Math.PI / 180
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(6371 * c * 10) / 10
}

// Average speed assumption for ETA
const AVG_SPEED_KMH = 60

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [40, 40] })
    }
  }, [positions])
  return null
}

export default function LiveMap({ tripId }) {
  const [vehicles,    setVehicles]    = useState([])
  const [shipments,   setShipments]   = useState([])
  const [trip,        setTrip]        = useState(null)
  const [error,       setError]       = useState('')
  const [routes,      setRoutes]      = useState({})
  const [optimizedRoute, setOptimizedRoute] = useState(null)
  const wsRef = useRef(null)

  const normalizeVehicle = (vehicle) => ({
    id: Number(vehicle.id),
    plate_number: vehicle.plate_number,
    latitude: vehicle.latitude != null ? Number(vehicle.latitude) : null,
    longitude: vehicle.longitude != null ? Number(vehicle.longitude) : null,
    current_status: vehicle.current_status || 'available',
  })

  function loadData() {
    Promise.all([getVehicleLocations(), getShipments()])
      .then(([v, s]) => {
        setVehicles(v.map(normalizeVehicle))
        setShipments(s)
        setError('')
      })
      .catch((e) => setError(e.message))
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
      const update = JSON.parse(e.data)

      if (update.type === 'status_update') {
        const targetShipmentId = update.shipment_id ?? update.trip_id
        setShipments(prev => prev.map((shipment) => shipment.id === targetShipmentId ? { ...shipment, status: update.status } : shipment))
        setError('')
        return
      }

      if (update.type === 'location_update') {
        const vehicleId = Number(update.vehicle_id)
        const normalized = normalizeVehicle({
          id: vehicleId ?? update.trip_id,
          plate_number: update.plate_number || `Trip ${update.trip_id}`,
          latitude: update.latitude,
          longitude: update.longitude,
          current_status: update.current_status || 'in_transit',
        })
        setVehicles(prev => {
          const next = prev.filter(v => Number(v.id) !== Number(normalized.id))
          return [...next, normalized]
        })
        setError('')
        return
      }

      if (update.vehicle_id != null) {
        const vehicleId = Number(update.vehicle_id)
        const normalized = normalizeVehicle({
          id: vehicleId,
          plate_number: update.plate_number,
          latitude: update.latitude,
          longitude: update.longitude,
          current_status: update.current_status,
        })
        setVehicles(prev => {
          const next = prev.filter(v => Number(v.id) !== vehicleId)
          return [...next, normalized]
        })
      }
    }

    const startPolling = () => {
      if (!pollingTimer) {
        pollingTimer = window.setInterval(loadData, 10000)
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
      setError('WebSocket connection failed — live updates unavailable. Showing latest known positions.')
      startPolling()
      scheduleReconnect()
    }

    ws.onclose = () => {
      startPolling()
      scheduleReconnect()
    }

    return () => {
      ws.close()
      if (pollingTimer) {
        window.clearInterval(pollingTimer)
      }
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer)
      }
    }
  }, [tripId])

  const activeVehicles = vehicles.filter(v => v.latitude != null && v.longitude != null)
  const shownVehicles = tripId ? activeVehicles.filter(v => v.id === Number(trip?.vehicle_id)) : activeVehicles
  const tripDestination = trip?.destination_latitude != null && trip?.destination_longitude != null
    ? [trip.destination_latitude, trip.destination_longitude]
    : null
  const tripPickup = trip?.pickup_latitude != null && trip?.pickup_longitude != null
    ? [trip.pickup_latitude, trip.pickup_longitude]
    : null
  const bounds = shownVehicles.map(v => [v.latitude, v.longitude]).concat(tripDestination || [])

  // Match in-transit shipments to vehicles for route lines
  const inTransitShipments = shipments.filter(s => s.status === 'in_transit' && s.vehicle_id)
  const currentVehicle = shownVehicles[0]
  const destinationCoords = (shipment) => {
    const route = routes[shipment.id]
    if (route?.destination_lat != null && route?.destination_lng != null) {
      return [route.destination_lat, route.destination_lng]
    }
    return null
  }

  const optimizationStops = inTransitShipments
    .map((s) => destinationCoords(s))
    .filter((coords) => coords != null)
  const canOptimizeRoute = Boolean(currentVehicle && optimizationStops.length > 1)
  const title = tripId && trip ? `Trip #${trip.id} Live Map` : 'Live Map'

  const distanceKm = (lat1, lng1, lat2, lng2) => {
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null
    const deg2rad = (d) => d * Math.PI / 180
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lng2 - lng1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(6371 * c * 10) / 10
  }

  const optimizeRoute = () => {
    if (!canOptimizeRoute) return
    api.post('/route/optimize', {
      origin_lat: currentVehicle.latitude,
      origin_lng: currentVehicle.longitude,
      stops: optimizationStops,
    })
      .then((res) => {
        setOptimizedRoute(res.data.route)
      })
      .catch((e) => {
        setError(e.message || 'Route optimization failed')
      })
  }

  useEffect(() => {
    if (inTransitShipments.length === 0) return
    const idsToFetch = inTransitShipments.map(s => s.id).filter(id => !routes[id])
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
  }, [inTransitShipments, routes])

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          <p>Real-time vehicle locations · WebSocket updates</p>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={optimizeRoute} disabled={!canOptimizeRoute}>
            Optimize Route
          </button>
          <div className="ws-indicator">
            <span className="ws-dot"></span> Live
          </div>
        </div>
      </div>

      {error && <div className="status-msg error">{error}</div>}

      <div className="map-wrap">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: '500px', width: '100%', borderRadius: '12px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {bounds.length > 0 && <FitBounds positions={bounds} />}

          {shownVehicles.map(v => {
            // Find matching in-transit shipment for ETA
            const shipment = inTransitShipments.find(s => s.vehicle_id === v.id)
            return (
              <Marker key={v.id} position={[v.latitude, v.longitude]} icon={vehicleIcon}>
                <Popup>
                  <div className="map-popup">
                    <strong>🚛 {v.plate_number}</strong>
                    <span className={`status-badge ${v.current_status === 'in_transit' ? 'in-transit' : 'available'}`}>
                      {v.current_status}
                    </span>
                    <div>📍 {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}</div>
                    {shipment && (
                      <div className="eta-box">
                        <div>📦 {shipment.origin} → {shipment.destination}</div>
                        {routes[shipment.id] && (
                          <div style={{ marginTop: 6 }}>
                            ⏱ {routes[shipment.id].duration_min} min · 📏 {routes[shipment.id].distance_km} km
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
            <Marker position={tripPickup} icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
            })}>
              <Popup>📍 Pickup</Popup>
            </Marker>
          )}

          {tripDestination && (
            <Marker position={tripDestination} icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
            })}>
              <Popup>📍 Destination</Popup>
            </Marker>
          )}

          {/* Draw route polylines for active shipments */}
          {Object.keys(routes).map((sid) => {
            const r = routes[sid]
            if (!r || !r.geometry) return null
            return <Polyline key={`route-${sid}`} positions={r.geometry} pathOptions={{ color: '#1e40af', weight: 4, opacity: 0.8 }} />
          })}
          {optimizedRoute?.geometry && (
            <Polyline positions={optimizedRoute.geometry} pathOptions={{ color: '#10b981', dashArray: '8, 6', weight: 4, opacity: 0.9 }} />
          )}
        </MapContainer>
      </div>

      {optimizedRoute && (
        <div className="status-msg" style={{ marginTop: 16, background: '#0f766e', color: '#f8fafc', borderColor: '#14b8a6' }}>
          <strong>Optimized route:</strong> {optimizedRoute.distance_km} km · {optimizedRoute.duration_min} min
        </div>
      )}

      {/* ETA Table */}
      {inTransitShipments.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ color: '#f1f5f9', fontSize: 16, marginBottom: 14 }}>Active Trip ETA</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shipment</th>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Current Location</th>
                  <th>ETA</th>
                  <th>Distance Left</th>
                </tr>
              </thead>
              <tbody>
                {inTransitShipments.map(s => {
                  const v = vehicles.find(v => v.id === s.vehicle_id)
                  const hasGPS = v?.latitude && v?.longitude

                  // Approximate destination coords from shipment — real app would geocode
                  // For now show N/A if no GPS
                  return (
                    <tr key={s.id}>
                      <td className="id-cell">#{s.id}</td>
                      <td>{s.origin} → {s.destination}</td>
                      <td>{v ? <span className="plate-badge">{v.plate_number}</span> : '—'}</td>
                      <td>
                        {hasGPS
                          ? `${v.latitude.toFixed(4)}, ${v.longitude.toFixed(4)}`
                          : <span className="unassigned">No GPS</span>}
                      </td>
                      <td>
                        {routes[s.id]
                          ? <span className="eta-badge">{routes[s.id].duration_min} min</span>
                          : <span className="eta-badge">Live tracking</span>}
                      </td>
                      <td>
                        {routes[s.id]
                          ? (() => {
                              const vehicleForShipment = vehicles.find(v => v.id === s.vehicle_id)
                              const destination = destinationCoords(s)
                              const remaining = vehicleForShipment && destination
                                ? distanceKm(vehicleForShipment.latitude, vehicleForShipment.longitude, destination[0], destination[1])
                                : null
                              return remaining != null
                                ? <span>{remaining} km</span>
                                : <span className="unassigned">{routes[s.id].distance_km} km</span>
                            })()
                          : <span className="unassigned">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeVehicles.length === 0 && !error && (
        <div className="status-msg" style={{ marginTop: 16 }}>
          No vehicles with GPS data yet. Update a vehicle location via PATCH /gps/vehicles/&#123;id&#125;/location
        </div>
      )}
    </div>
  )
}
