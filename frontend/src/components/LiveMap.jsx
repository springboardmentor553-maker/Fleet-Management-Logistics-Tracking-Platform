import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api'
import { useState } from 'react'

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '10px',
}

const DEFAULT_CENTER = { lat: 22.9734, lng: 78.6569 }

export default function LiveMap({ vehicles = [] }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  })

  const [selected, setSelected] = useState(null)

  const trackedVehicles = vehicles.filter(v => v.current_lat != null && v.current_lng != null)

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>
        Loading map...
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={DEFAULT_CENTER}
      zoom={4.5}
      options={{ disableDefaultUI: true, zoomControl: true }}
    >
      {trackedVehicles.map((v) => (
        <MarkerF
          key={v.id}
          position={{ lat: v.current_lat, lng: v.current_lng }}
          onClick={() => setSelected(v)}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: v.status === 'available' ? '#1a9c5c' : v.status === 'maintenance' ? '#dc4444' : '#c9820a',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          }}
        />
      ))}

      {selected && (
        <InfoWindowF
          position={{ lat: selected.current_lat, lng: selected.current_lng }}
          onCloseClick={() => setSelected(null)}
        >
          <div style={{ fontSize: 13, color: '#111' }}>
            <strong>{selected.registration_number}</strong>
            <div>{selected.vehicle_type}</div>
            <div style={{ textTransform: 'capitalize' }}>{selected.status}</div>
          </div>
        </InfoWindowF>
      )}

      {trackedVehicles.length === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 10, background: 'white', padding: '8px 14px', borderRadius: 8, fontSize: 12.5, color: '#666'
        }}>
          No vehicles have location data yet
        </div>
      )}
    </GoogleMap>
  )
}