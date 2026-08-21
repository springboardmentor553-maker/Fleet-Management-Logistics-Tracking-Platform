import { useEffect, useState } from "react";
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

const vehicleIcon = L.divIcon({
  className: "fleetflow-vehicle-marker",
  html: "🚚",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function isValidCoordinate(latitude, longitude) {
  return (
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude))
  );
}

function MapUpdater({ position }) {
  const map = useMap();

  useEffect(() => {
    if (
      Array.isArray(position) &&
      position.length === 2 &&
      isValidCoordinate(position[0], position[1])
    ) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  return null;
}

function LiveTracking({ tripId, onClose }) {
  const [location, setLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tripId) return;

    const wsUrl = import.meta.env.VITE_API_URL.replace(
      /^http/,
      "ws"
    );

    const socket = new WebSocket(
      `${wsUrl}/ws/tracking/${tripId}`
    );

    socket.onopen = () => {
      setConnected(true);
      setError("");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.error) {
          setError(data.error);
          return;
        }

        if (data.type === "route") {
          const validRoute = Array.isArray(data.route)
            ? data.route.filter(
                (point) =>
                  Array.isArray(point) &&
                  point.length === 2 &&
                  isValidCoordinate(point[0], point[1])
              )
            : [];

          setRoute(validRoute);

          setRouteInfo({
            distance_km: data.distance_km,
            duration_minutes: data.duration_minutes,
            eta: data.eta,
          });

          if (validRoute.length > 0) {
            setLocation({
              latitude: Number(validRoute[0][0]),
              longitude: Number(validRoute[0][1]),
              shipment_status: null,
            });
          }
        }

        if (data.type === "location") {
          if (
            !isValidCoordinate(
              data.latitude,
              data.longitude
            )
          ) {
            console.warn(
              "Ignoring invalid tracking coordinates:",
              data
            );
            return;
          }

          setLocation({
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            shipment_status: data.shipment_status,
          });
        }
      } catch {
        setError("Received invalid tracking data.");
      }
    };

    socket.onerror = () => {
      setConnected(false);
      setError("Unable to connect to live tracking.");
    };

    socket.onclose = () => {
      setConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [tripId]);

  const position =
    location &&
    isValidCoordinate(
      location.latitude,
      location.longitude
    )
      ? [
          Number(location.latitude),
          Number(location.longitude),
        ]
      : route.length > 0 &&
          isValidCoordinate(route[0][0], route[0][1])
        ? [
            Number(route[0][0]),
            Number(route[0][1]),
          ]
        : [12.9352, 77.6245];

  return (
    <div className="live-tracking-panel">

      <div className="modal-header">
        <div>
          <h2>Live Vehicle Tracking</h2>
          <p>Trip #{tripId}</p>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close live tracking"
        >
          ×
        </button>
      </div>

      <div
        style={{
          height: "450px",
          width: "100%",
          borderRadius: "12px",
          overflow: "hidden",
          marginBottom: "20px",
        }}
      >
        <MapContainer
          center={position}
          zoom={14}
          style={{
            height: "100%",
            width: "100%",
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapUpdater position={position} />

          {route.length > 0 && (
            <Polyline
              positions={route}
              pathOptions={{
                color: "#2563eb",
                weight: 5,
              }}
            />
          )}

          <Marker
            position={position}
            icon={vehicleIcon}
          >
            <Popup>
              <strong>FleetFlow Vehicle</strong>
              <br />
              Trip #{tripId}
              <br />
              Status:{" "}
              {location?.shipment_status ||
                "Tracking"}
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="live-tracking-status">
        <strong>
          {connected
            ? "● Live"
            : "● Disconnected"}
        </strong>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {routeInfo && (
        <div className="tracking-grid">

          <div className="tracking-item">
            <span>Distance</span>
            <strong>
              {routeInfo.distance_km} km
            </strong>
          </div>

          <div className="tracking-item">
            <span>Duration</span>
            <strong>
              {routeInfo.duration_minutes} min
            </strong>
          </div>

          <div className="tracking-item">
            <span>ETA</span>
            <strong>
              {new Date(
                routeInfo.eta
              ).toLocaleTimeString()}
            </strong>
          </div>

          <div className="tracking-item">
            <span>Shipment Status</span>
            <strong>
              {location?.shipment_status ||
                "Waiting..."}
            </strong>
          </div>

        </div>
      )}

      <div className="tracking-grid">

        <div className="tracking-item">
          <span>Latitude</span>
          <strong>
            {location
              ? location.latitude
              : "Waiting..."}
          </strong>
        </div>

        <div className="tracking-item">
          <span>Longitude</span>
          <strong>
            {location
              ? location.longitude
              : "Waiting..."}
          </strong>
          </div>

      </div>

      <div className="modal-actions">
        <button
          type="button"
          className="action-button"
          onClick={onClose}
        >
          Close
        </button>
      </div>

    </div>
  );
}

export default LiveTracking;