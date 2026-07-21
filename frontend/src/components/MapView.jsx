import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

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

const defaultCenter = [20.5937, 78.9629]; // Center of India (Static reference to prevent infinite loops)

export default function MapView({ pickupAddress, destinationAddress }) {
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
    if (!pickupAddress || !destinationAddress) {
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

    const fetchRoute = async () => {
      setState(prev => ({ ...prev, loading: true, error: null, route: null }));
      try {
        // Geocode Pickup Address using Nominatim
        const pickupRes = await axios.get(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(pickupAddress)}&format=json&limit=1`
        );
        if (!pickupRes.data || pickupRes.data.length === 0) {
          throw new Error(`Could not find coordinates for pickup origin: "${pickupAddress}"`);
        }
        const pickupLoc = {
          lat: parseFloat(pickupRes.data[0].lat),
          lng: parseFloat(pickupRes.data[0].lon),
          name: pickupRes.data[0].display_name
        };

        // Geocode Destination Address using Nominatim
        const destRes = await axios.get(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destinationAddress)}&format=json&limit=1`
        );
        if (!destRes.data || destRes.data.length === 0) {
          throw new Error(`Could not find coordinates for destination: "${destinationAddress}"`);
        }
        const destLoc = {
          lat: parseFloat(destRes.data[0].lat),
          lng: parseFloat(destRes.data[0].lon),
          name: destRes.data[0].display_name
        };

        // Get API Key for OpenRouteService
        const apiKey = import.meta.env.VITE_ORS_API_KEY;
        if (!apiKey) {
          throw new Error('OpenRouteService API Key (VITE_ORS_API_KEY) is not defined.');
        }

        // Fetch route from OpenRouteService
        const routeRes = await axios.post(
          'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
          {
            coordinates: [
              [pickupLoc.lng, pickupLoc.lat],
              [destLoc.lng, destLoc.lat]
            ],
            units: 'km'
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': apiKey
            }
          }
        );

        if (!routeRes.data || !routeRes.data.features || routeRes.data.features.length === 0) {
          throw new Error('No route found between locations.');
        }

        const feature = routeRes.data.features[0];
        const geometry = feature.geometry;
        const properties = feature.properties || {};

        // Parse coordinates: ORS returns [lng, lat], Leaflet wants [lat, lng]
        const pathCoords = geometry.coordinates.map(([lng, lat]) => [lat, lng]);

        const routeSummary = properties.summary || {};
        const distVal = routeSummary.distance ? routeSummary.distance.toFixed(1) : null;
        const durVal = routeSummary.duration ? Math.round(routeSummary.duration / 60) : null;

        setState({
          pickup: pickupLoc,
          destination: destLoc,
          route: pathCoords,
          loading: false,
          error: null,
          distance: distVal,
          duration: durVal
        });
      } catch (err) {
        console.error('MapView route fetching error:', err);
        setState(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'An error occurred during routing.'
        }));
      }
    };

    fetchRoute();
  }, [pickupAddress, destinationAddress]);

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
      </MapContainer>
    </div>
  );
}
