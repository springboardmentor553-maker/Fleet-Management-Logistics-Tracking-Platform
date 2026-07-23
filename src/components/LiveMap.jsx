import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { geocodeLocation, generateRoute } from "../services/mapService";
import { connectWebSocket } from "../services/websocketService";

import "./Map.css";

// ----------------------------------------------------
// Fix Leaflet Marker Icons
// ----------------------------------------------------

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ----------------------------------------------------
// Automatically Fit Route
// ----------------------------------------------------

function FitBounds({ route }) {

  const map = useMap();

  useEffect(() => {

    if (route.length > 0) {

      map.fitBounds(route, {

        padding: [50, 50],

      });

    }

  }, [route, map]);

  return null;
}

// ----------------------------------------------------
// Live Map
// ----------------------------------------------------

function LiveMap() {

  const [pickup, setPickup] = useState("");

  const [destination, setDestination] = useState("");

  const [pickupCoords, setPickupCoords] = useState(null);

  const [destinationCoords, setDestinationCoords] = useState(null);

  const [vehicleLocation, setVehicleLocation] = useState(null);

  const [route, setRoute] = useState([]);

  const [distance, setDistance] = useState("");

  const [duration, setDuration] = useState("");

  // ==========================================================
  // WebSocket
  // ==========================================================

  useEffect(() => {

    const socket = connectWebSocket(1);

    socket.onmessage = (event) => {

      const data = JSON.parse(event.data);

      console.log("Live Location:", data);

      if (data.type === "location_update") {

        setVehicleLocation([
          data.latitude,
          data.longitude,
        ]);

      }

    };

  }, []);

  // ==========================================================
  // Generate Route
  // ==========================================================

  const generateMapRoute = async () => {

    try {

      if (!pickup.trim() || !destination.trim()) {

        alert("Please enter Pickup and Destination.");

        return;

      }

      const pickupData = await geocodeLocation(pickup);

      const destinationData = await geocodeLocation(destination);

      const pickupPosition = [
        pickupData.latitude,
        pickupData.longitude,
      ];

      const destinationPosition = [
        destinationData.latitude,
        destinationData.longitude,
      ];

      setPickupCoords(pickupPosition);

      setDestinationCoords(destinationPosition);

      const routeData = await generateRoute(
        pickupData.latitude,
        pickupData.longitude,
        destinationData.latitude,
        destinationData.longitude
      );

      setDistance(routeData.distance_km.toFixed(2));

      setDuration(routeData.duration_minutes.toFixed(2));

      const polyline =
        routeData.geometry.coordinates.map(
          ([lng, lat]) => [lat, lng]
        );

      setRoute(polyline);

    }

    catch (error) {

      console.error(error);

      alert("Unable to generate route.");

    }

  };

  return (

    <div className="map-page">

      {/* Controls */}

      <div className="map-controls">

        <input
          type="text"
          placeholder="Pickup Location"
          value={pickup}
          onChange={(e) =>
            setPickup(e.target.value)
          }
        />

        <input
          type="text"
          placeholder="Destination"
          value={destination}
          onChange={(e) =>
            setDestination(e.target.value)
          }
        />

        <button onClick={generateMapRoute}>

          Generate Route

        </button>

      </div>

      {/* Route Info */}

      <div className="route-info">

        <div className="route-card">

          <div className="route-title">

            Total Distance

          </div>

          <div className="route-value">

            {distance} km

          </div>

        </div>

        <div className="route-card">

          <div className="route-title">

            Estimated Duration

          </div>

          <div className="route-value">

            {duration} mins

          </div>

        </div>

      </div>

      {/* Map */}

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        className="leaflet-map"
      >

        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Pickup */}

        {pickupCoords && (

          <Marker position={pickupCoords}>

            <Popup>

              Pickup Location

            </Popup>

          </Marker>

        )}

        {/* Destination */}

        {destinationCoords && (

          <Marker position={destinationCoords}>

            <Popup>

              Destination

            </Popup>

          </Marker>

        )}

        {/* Live Vehicle */}

        {vehicleLocation && (

          <Marker position={vehicleLocation}>

            <Popup>

              🚚 Live Vehicle

            </Popup>

          </Marker>

        )}

        {/* Route */}

        {route.length > 0 && (

          <>

            <Polyline
              positions={route}
              pathOptions={{
                color: "#2563eb",
                weight: 6,
              }}
            />

            <FitBounds
              route={route}
            />

          </>

        )}

      </MapContainer>

    </div>

  );

}

export default LiveMap;