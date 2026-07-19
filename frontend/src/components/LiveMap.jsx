import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const DEFAULT_CENTER = [22.9734, 78.6569]

const statusColor = (status) => {
  if (status === 'available') return '#1a9c5c'
  if (status === 'maintenance') return '#dc4444'
  return '#c9820a'
}

export default function LiveMap({ vehicles = [] }) {
  const trackedVehicles = vehicles.filter(v => v.current_lat != null && v.current_lng != null)

  return (
    <div style={{ width: '100%', height: '100%', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
      <MapContainer center={DEFAULT_CENTER} zoom={4.5} style={{ width: '100%', height: '100%' }} zoomControl={true}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {trackedVehicles.map((v) => (
          <CircleMarker
            key={v.id}
            center={[v.current_lat, v.current_lng]}
            radius={7}
            pathOptions={{ fillColor: statusColor(v.status), fillOpacity: 1, color: '#fff', weight: 2 }}
          >
            <Popup>
              <strong>{v.registration_number}</strong><br />
              {v.vehicle_type}<br />
              <span style={{ textTransform: 'capitalize' }}>{v.status}</span>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {trackedVehicles.length === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 1000, background: 'white', padding: '8px 14px', borderRadius: 8, fontSize: 12.5, color: '#666'
        }}>
          No vehicles have location data yet
        </div>
      )}
    </div>
  )
}
