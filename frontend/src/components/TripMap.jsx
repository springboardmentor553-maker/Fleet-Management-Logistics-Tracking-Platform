import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Resolve Leaflet marker icon asset paths broken by Vite bundling
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom component to automatically center and zoom the map to fit all markers and path
function MapBoundsAdjuster({ pickupCoords, destCoords, routePoints }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const bounds = [];
    
    // Add pickup coordinates to bounds if valid
    if (pickupCoords && typeof pickupCoords.latitude === "number" && typeof pickupCoords.longitude === "number") {
      bounds.push([pickupCoords.latitude, pickupCoords.longitude]);
    }
    
    // Add destination coordinates to bounds if valid
    if (destCoords && typeof destCoords.latitude === "number" && typeof destCoords.longitude === "number") {
      bounds.push([destCoords.latitude, destCoords.longitude]);
    }

    // Add route coordinates to bounds
    if (routePoints && routePoints.length > 0) {
      routePoints.forEach((pt) => {
        if (typeof pt[0] === "number" && typeof pt[1] === "number") {
          bounds.push(pt);
        }
      });
    }

    // Fit map bounds if any valid points present
    if (bounds.length > 0) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
        duration: 1.5
      });
    }
  }, [map, pickupCoords, destCoords, routePoints]);

  return null;
}

function TripMap({ pickupLocation, destination, pickupCoords, destCoords, routeGeometry, currentLocation }) {
  // Memoize route points converting OSRM [longitude, latitude] to Leaflet [latitude, longitude]
  const routePoints = useMemo(() => {
    if (!routeGeometry || !Array.isArray(routeGeometry.coordinates)) {
      return [];
    }
    return routeGeometry.coordinates.map((coord) => {
      // coordinates are standard GeoJSON [lng, lat]
      return [coord[1], coord[0]];
    });
  }, [routeGeometry]);

  const vehicleIcon = useMemo(() => {
    return L.divIcon({
      html: '<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚛</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      className: "vehicle-live-marker"
    });
  }, []);

  const defaultCenter = [20.5937, 78.9629]; // Center of India as fallback
  const defaultZoom = 5;

  const validPickup = pickupCoords && typeof pickupCoords.latitude === "number" && typeof pickupCoords.longitude === "number";
  const validDestination = destCoords && typeof destCoords.latitude === "number" && typeof destCoords.longitude === "number";
  const validVehicle = currentLocation && typeof currentLocation.latitude === "number" && typeof currentLocation.longitude === "number";

  return (
    <div className="trip-map-wrapper" style={{ height: "450px", width: "100%", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
      <MapContainer
        center={validPickup ? [pickupCoords.latitude, pickupCoords.longitude] : defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validPickup && (
          <Marker position={[pickupCoords.latitude, pickupCoords.longitude]}>
            <Popup>
              <strong>Pickup Point</strong>
              <br />
              {pickupLocation}
            </Popup>
          </Marker>
        )}

        {validDestination && (
          <Marker position={[destCoords.latitude, destCoords.longitude]}>
            <Popup>
              <strong>Destination Point</strong>
              <br />
              {destination}
            </Popup>
          </Marker>
        )}

        {validVehicle && (
          <Marker position={[currentLocation.latitude, currentLocation.longitude]} icon={vehicleIcon}>
            <Popup>
              <strong>Current Vehicle Location</strong>
              <br />
              Lat: {currentLocation.latitude}, Lon: {currentLocation.longitude}
            </Popup>
          </Marker>
        )}

        {routePoints.length > 0 && (
          <Polyline
            positions={routePoints}
            color="#3b82f6"
            weight={5}
            opacity={0.8}
          />
        )}

        <MapBoundsAdjuster
          pickupCoords={pickupCoords}
          destCoords={destCoords}
          routePoints={routePoints}
        />
      </MapContainer>
    </div>
  );
}

export default TripMap;
