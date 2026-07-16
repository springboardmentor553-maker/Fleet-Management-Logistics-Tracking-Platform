import { useState, useEffect } from 'react'
import { X, MapPin, Truck as TruckIcon, Clock, Navigation } from 'lucide-react'
import { getCityCoords, geocodeCity, haversineDistance } from '../utils/cityCoordinates'
import { getRoute } from '../utils/routing'
import ShipmentTrackMap from './ShipmentTrackMap'

export default function ShipmentTrackingPanel({ shipment, vehicle, driver, onClose }) {
  const [originCoords, setOriginCoords] = useState(null)
  const [destCoords, setDestCoords] = useState(null)
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(true)

  const isInTransit = shipment.status === 'in_transit'
  const hasVehicleLocation = vehicle && vehicle.current_lat != null && vehicle.current_lng != null

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

  const initials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase()
  }

  // Only show "distance left" if the vehicle's real, manually-set location is available
  let remainingKm = null
  if (hasVehicleLocation && destCoords) {
    remainingKm = haversineDistance({ lat: vehicle.current_lat, lng: vehicle.current_lng }, destCoords)
  }

  return (
    <div className="ff-section" style={{ marginTop: 16 }}>
      <div className="ff-section-header">
        <div className="ff-section-title"><Navigation size={16} /><span>Shipment Tracking</span></div>
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

          <span className={`ff-badge status-${shipment.status}`} style={{ marginBottom: 14, display: 'inline-block' }}>
            {shipment.status.replace('_', ' ')}
          </span>

          <div className="ff-tracking-detail-row">
            <Clock size={13} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ETA (set by dispatcher)</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {shipment.eta ? new Date(shipment.eta).toLocaleString() : 'Not set'}
              </div>
            </div>
          </div>

          <div className="ff-tracking-detail-row">
            <Navigation size={13} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {hasVehicleLocation ? 'Distance from vehicle to destination' : 'Road Route Distance'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {hasVehicleLocation
                  ? `${Math.round(remainingKm)} km`
                  : route ? `${Math.round(route.distanceKm)} km` : '—'}
              </div>
            </div>
          </div>

          <div className="ff-tracking-detail-row">
            <TruckIcon size={13} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Vehicle</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {vehicle ? vehicle.registration_number : 'Not assigned'}
                {vehicle && !hasVehicleLocation && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}> (location not set)</span>
                )}
              </div>
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
        </div>
      </div>
    </div>
  )
}