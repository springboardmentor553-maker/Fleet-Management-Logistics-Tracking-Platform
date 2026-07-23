import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { tripService } from '../services/api';

// Fix for default Leaflet icon paths in Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom Premium HTML Icons for Pickup and Destination
const pickupIcon = L.divIcon({
  html: `<div style="
    background-color: #10B981; 
    width: 28px; 
    height: 28px; 
    border-radius: 50%; 
    border: 3px solid #FFFFFF; 
    box-shadow: 0 3px 6px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 12px;
  ">P</div>`,
  className: 'custom-pin-pickup',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const destinationIcon = L.divIcon({
  html: `<div style="
    background-color: #EF4444; 
    width: 28px; 
    height: 28px; 
    border-radius: 50%; 
    border: 3px solid #FFFFFF; 
    box-shadow: 0 3px 6px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 12px;
  ">D</div>`,
  className: 'custom-pin-destination',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

// Animated live vehicle icon — pulsing blue truck dot
const vehicleIcon = L.divIcon({
  html: `
    <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
      <div style="
        position:absolute;
        width:40px;height:40px;
        border-radius:50%;
        background:rgba(37,99,235,0.18);
        animation:ws-pulse 1.8s ease-out infinite;
      "></div>
      <div style="
        position:absolute;
        width:26px;height:26px;
        border-radius:50%;
        background:rgba(37,99,235,0.28);
        animation:ws-pulse 1.8s ease-out infinite 0.4s;
      "></div>
      <div style="
        position:relative;
        width:18px;height:18px;
        border-radius:50%;
        background:#2563EB;
        border:3px solid #fff;
        box-shadow:0 2px 8px rgba(37,99,235,0.5);
        display:flex;align-items:center;justify-content:center;
        font-size:9px;
      ">🚛</div>
    </div>`,
  className: 'vehicle-live-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Inject the pulse keyframes once into the document head
if (typeof document !== 'undefined' && !document.getElementById('ws-pulse-style')) {
  const style = document.createElement('style');
  style.id = 'ws-pulse-style';
  style.textContent = `
    @keyframes ws-pulse {
      0%   { transform: scale(0.6); opacity: 0.8; }
      100% { transform: scale(2.2); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// Map controller to fit bounds or fly to center
function MapController({ bounds, center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: true });
    } else if (center) {
      map.setView(center, zoom || 5, { animate: true });
    }
  }, [bounds, center, zoom, map]);
  return null;
}

// Smoothly pans the map to follow the live vehicle position
function LiveVehicleTracker({ position }) {
  const map = useMap();
  const prevPos = useRef(null);

  useEffect(() => {
    if (!position) return;
    // Only pan if position changed meaningfully (avoid pointless redraws)
    if (
      prevPos.current &&
      Math.abs(prevPos.current[0] - position[0]) < 0.00001 &&
      Math.abs(prevPos.current[1] - position[1]) < 0.00001
    ) return;
    prevPos.current = position;
    map.panTo(position, { animate: true, duration: 1.2 });
  }, [position, map]);

  return null;
}

function decodePolyline(encodedStr) {
  if (!encodedStr) return [];
  if (encodedStr.startsWith('[')) {
    try {
      const parsed = JSON.parse(encodedStr);
      return parsed.map(([lng, lat]) => [lat, lng]);
    } catch (e) {
      return [];
    }
  }
  let index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null;
  while (index < encodedStr.length) {
    byte = null; shift = 0; result = 0;
    do {
      byte = encodedStr.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += deltaLat;

    shift = 0; result = 0;
    do {
      byte = encodedStr.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += deltaLng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }
  return coordinates;
}

const defaultCenter = [20.5937, 78.9629]; // Center of India (Static reference to prevent infinite loops)

/**
 * MapView component.
 *
 * Props
 * -----
 * tripId             : number  — primary key of the Trip row
 * pickupAddress      : string  — human-readable pickup location
 * destinationAddress : string  — human-readable destination
 * livePosition       : { lat: number, lng: number } | null
 */
export default function MapView({ tripId, pickupAddress, destinationAddress, livePosition = null }) {
  const [state, setState] = useState({
    pickup: null,      // { lat, lng, name }
    destination: null, // { lat, lng, name }
    route: null,       // array of [lat, lng]
    loading: false,
    error: null,
    distance: null,    // km
    duration: null     // mins
  });

  useEffect(() => {
    if (!tripId && (!pickupAddress || !destinationAddress)) {
      setState({
        pickup: null,
        destination: null,
        route: null,
        loading: false,
        error: null,
        distance: null,
        duration: null
      });
      return;
    }

    const fetchBackendRoute = async () => {
      setState(prev => ({ ...prev, loading: true, error: null, route: null }));
      try {
        if (tripId) {
          // Consume backend GET /trips/{trip_id}/route API
          const routeRes = await tripService.getRoute(tripId);
          const data = routeRes.data;

          const pickupLoc = {
            lat: data.pickup_coordinates.latitude,
            lng: data.pickup_coordinates.longitude,
            name: data.pickup_location
          };
          const destLoc = {
            lat: data.destination_coordinates.latitude,
            lng: data.destination_coordinates.longitude,
            name: data.destination
          };

          const decodedPath = decodePolyline(data.polyline);
          const pathCoords = decodedPath.length > 0
            ? decodedPath
            : [[pickupLoc.lat, pickupLoc.lng], [destLoc.lat, destLoc.lng]];

          setState({
            pickup: pickupLoc,
            destination: destLoc,
            route: pathCoords,
            loading: false,
            error: null,
            distance: data.distance_km,
            duration: Math.round(data.estimated_duration_minutes)
          });
        } else {
          setState({
            pickup: null,
            destination: null,
            route: null,
            loading: false,
            error: 'Select a trip to load backend route telemetry.',
            distance: null,
            duration: null
          });
        }
      } catch (err) {
        console.error('MapView backend route fetching error:', err);
        const detail = err?.response?.data?.detail || err.message || 'Failed to calculate route telemetry.';
        setState(prev => ({
          ...prev,
          loading: false,
          error: detail
        }));
      }
    };

    fetchBackendRoute();
  }, [tripId, pickupAddress, destinationAddress]);

  // Memoize bounds with stable reference to prevent infinite rendering loop with react-leaflet
  const mapBounds = React.useMemo(() => {
    if (state.pickup && state.destination) {
      return [
        [state.pickup.lat, state.pickup.lng],
        [state.destination.lat, state.destination.lng]
      ];
    }
    return null;
  }, [state.pickup?.lat, state.pickup?.lng, state.destination?.lat, state.destination?.lng]);

  // Live vehicle position as a Leaflet LatLng array
  const vehiclePosition = livePosition
    ? [livePosition.lat, livePosition.lng]
    : null;

  return (
    <div className="map-view-container" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '380px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Route Info Overlay */}
      {(state.distance || state.duration || state.loading || state.error) && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          zIndex: 1000,
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-main)',
          padding: '10px 16px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          fontSize: '13px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          pointerEvents: 'none'
        }}>
          {state.loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', borderColor: 'var(--primary) transparent var(--primary) transparent' }}></div>
              <span style={{ fontWeight: 500 }}>Calculating route telemetry...</span>
            </div>
          )}
          
          {state.error && (
            <div style={{ color: 'var(--danger)', fontWeight: 500 }}>
              ⚠️ {state.error}
            </div>
          )}

          {!state.loading && !state.error && state.distance && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 500 }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Distance: </span>
                <span style={{ color: 'var(--text-main)' }}>{state.distance} km</span>
              </div>
              <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-color)' }}></div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Duration: </span>
                <span style={{ color: 'var(--text-main)' }}>{state.duration} mins</span>
              </div>
              {/* Live tracking badge — shown only when WebSocket is streaming */}
              {vehiclePosition && (
                <>
                  <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-color)' }}></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: '#22c55e',
                      display: 'inline-block',
                      boxShadow: '0 0 0 2px rgba(34,197,94,0.3)',
                      animation: 'ws-pulse 1.8s ease-out infinite'
                    }}></span>
                    <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '12px' }}>LIVE</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* React-Leaflet Map */}
      <MapContainer
        center={defaultCenter}
        zoom={5}
        style={{ width: '100%', flex: 1 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          bounds={mapBounds}
          center={defaultCenter}
          zoom={5}
        />

        {/* Smoothly pan the map as the vehicle moves */}
        {vehiclePosition && <LiveVehicleTracker position={vehiclePosition} />}

        {state.pickup && (
          <Marker position={[state.pickup.lat, state.pickup.lng]} icon={pickupIcon}>
            <Popup>
              <strong>Pickup Origin</strong>
              <br />
              {pickupAddress}
              <br />
              <small style={{ color: 'gray' }}>{state.pickup.lat.toFixed(5)}, {state.pickup.lng.toFixed(5)}</small>
            </Popup>
          </Marker>
        )}

        {state.destination && (
          <Marker position={[state.destination.lat, state.destination.lng]} icon={destinationIcon}>
            <Popup>
              <strong>Destination Hub</strong>
              <br />
              {destinationAddress}
              <br />
              <small style={{ color: 'gray' }}>{state.destination.lat.toFixed(5)}, {state.destination.lng.toFixed(5)}</small>
            </Popup>
          </Marker>
        )}

        {state.route && (
          <Polyline
            positions={state.route}
            color="var(--primary, #2563EB)"
            weight={4.5}
            opacity={0.85}
          />
        )}

        {/* Live vehicle marker — appears only when WebSocket is streaming coordinates */}
        {vehiclePosition && (
          <Marker position={vehiclePosition} icon={vehicleIcon}>
            <Popup>
              <strong>🚛 Vehicle — Live Position</strong>
              <br />
              <small style={{ color: 'gray' }}>
                {vehiclePosition[0].toFixed(5)}, {vehiclePosition[1].toFixed(5)}
              </small>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
