import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

function MapView({ route }) {
  const defaultPosition = [17.3850, 78.4867];

  const center =
    route && route.length > 0
      ? route[0]
      : defaultPosition;

  return (
    <MapContainer
      center={center}
      zoom={8}
      style={{
        height: "500px",
        width: "100%",
      }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Start Marker */}
      {route.length > 0 && (
        <Marker position={route[0]} />
      )}

      {/* Destination Marker */}
      {route.length > 1 && (
        <Marker position={route[route.length - 1]} />
      )}

      {/* Route */}
      {route.length > 1 && (
        <Polyline positions={route} />
      )}
    </MapContainer>
  );
}

export default MapView;