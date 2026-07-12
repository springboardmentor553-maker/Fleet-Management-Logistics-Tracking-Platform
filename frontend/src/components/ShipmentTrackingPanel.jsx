import { useState, useEffect, useRef } from 'react'
import { X, MapPin, Truck as TruckIcon, Clock, Navigation, Gauge } from 'lucide-react'
import { getCityCoords, geocodeCity } from '../utils/cityCoordinates'
import { getRoute, getPositionAlongRoute } from '../utils/routing'
import ShipmentTrackMap from './ShipmentTrackMap'
import { getStatusBadgeClass } from '../utils/statusBadge'

export default function ShipmentTrackingPanel({ shipment, vehicle, driver, onClose }) {
  const [originCoords, setOriginCoords] = useState(null)
  const [destCoords, setDestCoords] = useState(null)
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0.1)
  const intervalRef = useRef(null)

  const isInTransit = shipment.status === 'in_transit'

  // Step 1: resolve city names to coordinates
  useEffect(() => {
    let cancelled = false
    const resolve = async () => {
      setLoading(true)
      let o = getCityCoords(shipment.origin)
      let d = getCityCoords(shipment.destination)
      if (!o) o = await geocodeCity(shipment.origin)
      if (!d) d = await geocodeCity(shipment.destination)
      if (!cancelled) {
        setOriginCoords(o)
        setDestCoords(d)
      }
    }
    resolve()
    return () => { cancelled = true }
  }, [shipment.origin, shipment.destination])

  // Step 2: fetch the real road route once we have coordinates
  useEffect(() => {
    if (!originCoords || !destCoords) return
    let cancelled = false
    const fetchRoute = async () => {
      const r = await getRoute(originCoords, destCoords)
      if (!cancelled) {
        setRoute(r)
        setLoading(false)
      }
    }
    fetchRoute()
    return () => { cancelled = true }
  }, [originCoords, destCoords])

  // Step 3: simulate the vehicle moving along the real route, only for "In Transit" shipments
  useEffect(() => {
    if (!isInTransit || !route) return
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + 0.01
        return next >= 0.95 ? 0.1 : next
      })
    }, 2000)
    return () => clearInterval(intervalRef.current)
  }, [isInTransit, route])

  const initials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase()
  }

  let simulatedPosition = null
  let remainingKm = null

  if (route && isInTransit) {
    simulatedPosition = getPositionAlongRoute(route.coordinates, progress)
    remainingKm = route.distanceKm * (1 - progress)
  }

  const displayDistance = remainingKm !== null ? remainingKm : route?.distanceKm

  // Simulated speed — for visual/demo purposes only, applies to In Transit shipments
  const simulatedSpeed = isInTransit ? 55 + Math.round(Math.sin(progress * 10) * 15) : null

  return (
    <div className="ff-section" style={{ marginTop: 16 }}>
      <div className="ff-section-header">
        <div className="ff-section-title"><Navigation size={16} /><span>Live Shipment Tracking</span></div>
        <X size={18} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose} />
      </div>

      <div className="ff-tracking-layout">
        <div className="ff-tracking-map">
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 13, color: 'var(--text-muted)' }}>
              Calculating road route from {shipment.origin} to {shipment.destination}...
            </div>
          )}
          {!loading && originCoords && destCoords && (
            <ShipmentTrackMap
              originCoords={originCoords}
              destCoords={destCoords}
              routeCoordinates={route?.coordinates}
              simulatedPosition={simulatedPosition}
              vehicle={vehicle}
            />
          )}
          {!loading && (!originCoords || !destCoords) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
              Could not find location for "{!originCoords ? shipment.origin : shipment.destination}"
            </div>
          )}
        </div>

        <div className="ff-tracking-details">
          <div style={{ fontWeight: 700, fontSize: 15 }}>{shipment.tracking_id}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
            <MapPin size={12} /> {shipment.origin} <span>&rarr;</span> {shipment.destination}
          </div>

          <span className={`ff-badge status-${getStatusBadgeClass(shipment.status)}`} style={{ marginBottom: 14, display: 'inline-block' }}>
            {shipment.status.replace('_', ' ')}
          </span>

          <div className="ff-tracking-detail-row">
            <Clock size={13} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ETA</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {shipment.eta ? new Date(shipment.eta).toLocaleString() : 'Not set'}
              </div>
            </div>
          </div>

          <div className="ff-tracking-detail-row">
            <Navigation size={13} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {remainingKm !== null ? 'Distance Left (road)' : 'Road Route Distance'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {displayDistance !== undefined && displayDistance !== null ? `${Math.round(displayDistance)} km` : '—'}
              </div>
            </div>
          </div>

          {isInTransit && simulatedSpeed && (
            <div className="ff-tracking-detail-row">
              <Gauge size={13} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Current Speed</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{simulatedSpeed} km/h</div>
              </div>
            </div>
          )}

          <div className="ff-tracking-detail-row">
            <TruckIcon size={13} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Vehicle</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{vehicle ? vehicle.registration_number : 'Not assigned'}</div>
            </div>
          </div>

          {driver && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div className="ff-driver-avatar">{initials(driver.name)}</div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{driver.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Driver</div>
              </div>
            </div>
          )}

          {!isInTransit && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, fontStyle: 'italic' }}>
              Live position updates are shown for shipments currently "In Transit".
            </p>
          )}
        </div>
      </div>
    </div>
  )
}