import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leaflet's default marker icons reference image paths that don't resolve
// correctly through Vite's bundler — point them at a CDN instead.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Auto-zooms/pans the map so the whole route is visible
function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions && positions.length > 0) {
      map.fitBounds(positions, { padding: [30, 30] })
    }
  }, [positions, map])
  return null
}

export default function ShipmentTrackMap({ originCoords, destCoords, routeCoordinates, simulatedPosition, vehicle }) {
  const hasRealRoute = routeCoordinates && routeCoordinates.length > 1
  const pathPositions = hasRealRoute
    ? routeCoordinates.map(([lat, lng]) => [lat, lng])
    : [[originCoords.lat, originCoords.lng], [destCoords.lat, destCoords.lng]]

  const activePosition = simulatedPosition
    || (vehicle && vehicle.current_lat != null && vehicle.current_lng != null
      ? { lat: vehicle.current_lat, lng: vehicle.current_lng }
      : null)

  return (
    <MapContainer
      center={[originCoords.lat, originCoords.lng]}
      zoom={6}
      style={{ width: '100%', height: '100%', borderRadius: '10px' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <FitBounds positions={pathPositions} />

      <Marker position={[originCoords.lat, originCoords.lng]} />
      <Marker position={[destCoords.lat, destCoords.lng]} />

      <Polyline
        positions={pathPositions}
        pathOptions={{
          color: '#aa3bff',
          weight: 4,
          opacity: hasRealRoute ? 1 : 0.6,
          dashArray: hasRealRoute ? null : '8 8',
        }}
      />

      {activePosition && (
        <CircleMarker
          center={[activePosition.lat, activePosition.lng]}
          radius={8}
          pathOptions={{ fillColor: '#aa3bff', fillOpacity: 1, color: '#fff', weight: 2 }}
        />
      )}
    </MapContainer>
  )
}
