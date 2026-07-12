import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useMemo } from 'react'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

export default function LiveMap({ vehicles = [] }) {
  const trackedVehicles = useMemo(() => {
    return vehicles.filter(v => v.current_lat != null && v.current_lng != null)
  }, [vehicles])

  return (
    <MapContainer
      center={[22.9734, 78.6569]}
      zoom={4.5}
      style={{ height: '100%', width: '100%', borderRadius: '10px' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
        url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_KEY}`}
      />
      {trackedVehicles.map((v) => (
        <Marker key={v.id} position={[v.current_lat, v.current_lng]}>
          <Popup>
            <strong>{v.registration_number}</strong><br />
            {v.vehicle_type}<br />
            Status: {v.status}
          </Popup>
        </Marker>
      ))}
      {trackedVehicles.length === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 1000, background: 'white', padding: '8px 14px', borderRadius: 8, fontSize: 12.5, color: '#666'
        }}>
          No vehicles have location data yet
        </div>
      )}
    </MapContainer>
  )
}