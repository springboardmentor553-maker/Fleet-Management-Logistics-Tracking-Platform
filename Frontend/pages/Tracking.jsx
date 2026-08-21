import { useEffect, useState } from "react";
import TrackingMap from "../components/TrackingMap";

function Tracking() {
  const [location, setLocation] = useState({
    latitude: 17.385,
    longitude: 78.4867,
    status: "Created",
  });

  useEffect(() => {
    const socket = new WebSocket(
      "wss://fleetflow-backend-90o5.onrender.com/ws/tracking/1"
    );

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLocation(data);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => socket.close();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Live Shipment Tracking</h2>

      <TrackingMap
        latitude={location.latitude}
        longitude={location.longitude}
      />

      <h3>Status: {location.status}</h3>

      <p>Latitude: {location.latitude}</p>

      <p>Longitude: {location.longitude}</p>
    </div>
  );
}

export default Tracking;