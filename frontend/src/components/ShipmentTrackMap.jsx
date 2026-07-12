import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'

const truckIcon = new L.DivIcon({
  html: `<div style="background:#aa3bff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
  </div>`,
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

export default function ShipmentTrackMap({ originCoords, destCoords, routeCoordinates, simulatedPosition, vehicle }) {
  const center = [
    (originCoords.lat + destCoords.lat) / 2,
    (originCoords.lng + destCoords.lng) / 2,
  ]

  const hasRealRoute = routeCoordinates && routeCoordinates.length > 1

  return (
    <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%', borderRadius: '10px' }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; MapTiler &copy; OpenStreetMap contributors'
        url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_KEY}`}
      />
      <Marker position={[originCoords.lat, originCoords.lng]}>
        <Popup><strong>Origin</strong></Popup>
      </Marker>
      <Marker position={[destCoords.lat, destCoords.lng]}>
        <Popup><strong>Destination</strong></Popup>
      </Marker>

      {hasRealRoute ? (
        <Polyline positions={routeCoordinates} pathOptions={{ color: '#aa3bff', weight: 4 }} />
      ) : (
        <Polyline
          positions={[[originCoords.lat, originCoords.lng], [destCoords.lat, destCoords.lng]]}
          pathOptions={{ color: '#aa3bff', weight: 3, dashArray: '6 6' }}
        />
      )}

      {simulatedPosition && (
        <Marker position={[simulatedPosition.lat, simulatedPosition.lng]} icon={truckIcon}>
          <Popup><strong>Vehicle</strong><br />En route</Popup>
        </Marker>
      )}

      {!simulatedPosition && vehicle && vehicle.current_lat != null && vehicle.current_lng != null && (
        <Marker position={[vehicle.current_lat, vehicle.current_lng]} icon={truckIcon}>
          <Popup><strong>{vehicle.registration_number}</strong><br />Current location</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}