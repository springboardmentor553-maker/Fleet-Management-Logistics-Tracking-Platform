import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../api/axios'
import { getTrip } from '../api/trips'
import { getVehicleLocations } from '../api/gps'
import { getShipments } from '../api/shipments'

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
  const wsRef = useRef(null)

  function loadData() {
    Promise.all([getVehicleLocations(), getShipments()])
      .then(([v, s]) => { setVehicles(v); setShipments(s) })
      .catch(e => setError(e.message))
  }

  // WebSocket for live updates
  useEffect(() => {
    let pollingTimer = null
    loadData()

    if (tripId) {
      getTrip(tripId)
        .then(setTrip)
        .catch(() => setTrip(null))
    } else {
      setTrip(null)
    }

    const baseUrl = new URL(api.defaults.baseURL)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${baseUrl.host}${baseUrl.pathname.replace(/\/$/, '')}/gps/ws/locations`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => setError('')
    ws.onmessage = (e) => {
      const update = JSON.parse(e.data)
      setVehicles(prev => prev.map(v =>
        v.id === update.vehicle_id
          ? { ...v, latitude: update.latitude, longitude: update.longitude, current_status: update.current_status }
          : v
      ))
    }

    const startPolling = () => {
      if (!pollingTimer) {
        pollingTimer = window.setInterval(loadData, 10000)
      }
    }

    ws.onerror = () => {
      setError('WebSocket connection failed — live updates unavailable. Showing latest known positions.')
      startPolling()
    }

    ws.onclose = () => {
      startPolling()
    }

    return () => {
      ws.close()
      if (pollingTimer) {
        window.clearInterval(pollingTimer)
      }
    }
  }, [tripId])

  const activeVehicles = vehicles.filter(v => v.latitude && v.longitude)
  const shownVehicles = tripId ? activeVehicles.filter(v => v.id === trip?.vehicle_id) : activeVehicles
  const bounds = shownVehicles.map(v => [v.latitude, v.longitude])

  // Match in-transit shipments to vehicles for route lines
  const inTransitShipments = shipments.filter(s => s.status === 'in_transit' && s.vehicle_id)
  const title = tripId && trip ? `Trip #${trip.id} Live Map` : 'Live Map'

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          <p>Real-time vehicle locations · WebSocket updates</p>
        </div>
        <div className="ws-indicator">
          <span className="ws-dot"></span> Live
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
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

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
                      <td><span className="eta-badge">Live tracking</span></td>
                      <td><span className="unassigned">—</span></td>
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
