import { GoogleMap, useJsApiLoader, MarkerF, PolylineF } from '@react-google-maps/api'

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '10px',
}

export default function ShipmentTrackMap({ originCoords, destCoords, routeCoordinates, simulatedPosition, vehicle }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  })

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 13, color: '#666' }}>
        Loading map...
      </div>
    )
  }

  const center = {
    lat: (originCoords.lat + destCoords.lat) / 2,
    lng: (originCoords.lng + destCoords.lng) / 2,
  }

  const hasRealRoute = routeCoordinates && routeCoordinates.length > 1
  const pathPositions = hasRealRoute
    ? routeCoordinates.map(([lat, lng]) => ({ lat, lng }))
    : [originCoords, destCoords]

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={6}
      options={{ disableDefaultUI: true, zoomControl: true }}
    >
      <MarkerF position={originCoords} label="A" />
      <MarkerF position={destCoords} label="B" />

      <PolylineF
        path={pathPositions}
        options={{
          strokeColor: '#aa3bff',
          strokeWeight: 4,
          strokeOpacity: hasRealRoute ? 1 : 0.6,
          ...(hasRealRoute ? {} : { icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 }, offset: '0', repeat: '10px' }] }),
        }}
      />

      {simulatedPosition && (
        <MarkerF
          position={simulatedPosition}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#aa3bff',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          }}
        />
      )}

      {!simulatedPosition && vehicle && vehicle.current_lat != null && vehicle.current_lng != null && (
        <MarkerF
          position={{ lat: vehicle.current_lat, lng: vehicle.current_lng }}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#aa3bff',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          }}
        />
      )}
    </GoogleMap>
  )
}