import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import TripMap from "../components/TripMap";
import { useAuth } from "../context/AuthContext";

function TripDetails() {
  const { trip_id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [routeData, setRouteData] = useState(null);
  const [tripData, setTripData] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [wsStatus, setWsStatus] = useState("Disconnected");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [etaData, setEtaData] = useState(null);
  const [etaUpdated, setEtaUpdated] = useState(false);
  const { user } = useAuth();
  const canUpdateTraffic = user && ["Admin", "Fleet Manager", "Dispatcher"].includes(user.role);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        // Fetch route particulars, general trip information, and drivers/vehicles pool
        const [routeRes, tripRes, driversRes, vehiclesRes] = await Promise.all([
          api.get(`/trips/${trip_id}/route`),
          api.get(`/trips/${trip_id}`),
          api.get("/drivers/"),
          api.get("/vehicles/")
        ]);
        
        setRouteData(routeRes.data);
        setTripData(tripRes.data);
        setDrivers(driversRes.data);
        setVehicles(vehiclesRes.data);
      } catch (err) {
        console.error("Error fetching trip route details:", err);
        const detail = err.response?.data?.detail || "Could not retrieve route planning data.";
        setErrorMsg(detail);
      } finally {
        setLoading(false);
      }
    };

    if (trip_id) {
      fetchAllData();
    }
  }, [trip_id]);

  const getValidTripTransitions = (currentStatus) => {
    if (currentStatus === "Scheduled") return ["Active", "Cancelled"];
    if (currentStatus === "Active") return ["Completed", "Cancelled"];
    return [];
  };

  const handleTripStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await api.put(`/trips/${trip_id}`, {
        status: newStatus
      });
      // Fetch updated trip data
      const tripRes = await api.get(`/trips/${trip_id}`);
      setTripData(tripRes.data);
      alert("Trip status updated successfully!");
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Could not update trip status.";
      alert(`Error: ${detail}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;
    let isMounted = true;

    const connectWebSocket = () => {
      // Connect if trip is Active or In Transit (shipment status equivalent)
      if (!tripData || (tripData.status !== "Active" && tripData.status !== "In Transit")) {
        setWsStatus("Disconnected");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setWsStatus("Disconnected");
        return;
      }

      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      let wsHost = window.location.host;
      if (wsHost.includes("5173") || wsHost.includes("localhost") || wsHost.includes("3000")) {
        wsHost = "127.0.0.1:8000";
      }
      const wsUrl = `${wsProtocol}//${wsHost}/ws/trips/${trip_id}?token=${token}`;

      console.log(`Connecting WebSocket to ${wsUrl}...`);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (isMounted) {
          setWsStatus("Connected");
          console.log("WebSocket connected.");
        }
      };

      ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          console.log("WebSocket location update:", update);
          if (isMounted && update.latitude && update.longitude) {
            setCurrentLocation({
              latitude: update.latitude,
              longitude: update.longitude
            });
            if (update.status) {
              setTripData((prev) => prev ? { ...prev, status: update.status } : null);
            }
            if (update.eta) {
              setEtaData(update.eta);
              setEtaUpdated(true);
              setTimeout(() => setEtaUpdated(false), 2000);
            }
          }
        } catch (err) {
          console.error("WebSocket message parse error:", err);
        }
      };

      ws.onclose = () => {
        if (isMounted) {
          setWsStatus("Disconnected");
          console.log("WebSocket closed. Attempting reconnect in 3s...");
          reconnectTimeout = setTimeout(() => {
            if (isMounted) connectWebSocket();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [trip_id, tripData?.status]);

  // Helper utility functions to translate driver/vehicle IDs to names
  const getDriverName = (id) => {
    const d = drivers.find((drv) => drv.id === id);
    return d ? d.name : `Driver #${id}`;
  };

  const getVehicleInfo = (id) => {
    const v = vehicles.find((vh) => vh.id === id);
    return v ? `${v.vehicle_number} (${v.vehicle_type})` : `Vehicle #${id}`;
  };

  // Convert distance from meters to kilometers
  const formatDistance = (meters) => {
    if (typeof meters !== "number") return "0 km";
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Convert duration from seconds to hours and minutes
  const formatDuration = (seconds) => {
    if (typeof seconds !== "number") return "0 min";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  };

  const formatDurationMinutes = (minutes) => {
    if (typeof minutes !== "number") return "0 min";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs} hr ${mins} min`;
    }
    return `${mins} min`;
  };

  useEffect(() => {
    const fetchETA = async () => {
      if (tripData && tripData.status !== "Completed" && tripData.status !== "Cancelled") {
        try {
          const res = await api.get(`/trips/${trip_id}/eta`);
          setEtaData(res.data);
        } catch (err) {
          console.error("Failed to fetch initial ETA:", err);
        }
      }
    };
    fetchETA();
  }, [trip_id, tripData?.status]);

  const handleTrafficChange = async (newLevel) => {
    try {
      await api.put(`/trips/${trip_id}/traffic`, {
        traffic_level: newLevel
      });
      const etaRes = await api.get(`/trips/${trip_id}/eta`);
      setEtaData(etaRes.data);
    } catch (err) {
      console.error(err);
      alert(`Error updating traffic level: ${err.response?.data?.detail || err.message}`);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (errorMsg) {
    return (
      <div className="page-container trip-details-page">
        <div className="page-header">
          <Link to="/shipments" className="btn btn-secondary btn-sm">
            ← Back to Shipments
          </Link>
        </div>
        <div className="error-banner" style={{ margin: "20px 0" }}>
          <span>⚠</span> {errorMsg}
        </div>
      </div>
    );
  }

  if (!tripData || !routeData) {
    return (
      <div className="page-container trip-details-page">
        <div className="page-header">
          <Link to="/shipments" className="btn btn-secondary btn-sm">
            ← Back to Shipments
          </Link>
        </div>
        <p className="empty-state">No trip route data could be located.</p>
      </div>
    );
  }

  return (
    <div className="page-container trip-details-page">
      <div className="page-header" style={{ marginBottom: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", width: "100%" }}>
            <Link to="/shipments" className="btn btn-secondary btn-sm" style={{ padding: "6px 12px" }}>
              ← Return
            </Link>
            <h2 style={{ margin: 0 }}>Route Map: Trip #{tripData.id}</h2>
            <span className={`badge badge-${tripData.status.toLowerCase().replace(" ", "-")}`}>
              {tripData.status}
            </span>
            {(tripData.status === "Active" || tripData.status === "In Transit") && (
              wsStatus === "Connected" ? (
                <span className="badge badge-success" style={{ backgroundColor: "#10B981", color: "#fff", padding: "4px 8px", borderRadius: "4px" }}>
                  🟢 Live Tracking
                </span>
              ) : (
                <span className="badge badge-danger" style={{ backgroundColor: "#EF4444", color: "#fff", padding: "4px 8px", borderRadius: "4px" }}>
                  🔴 Disconnected
                </span>
              )
            )}
            {getValidTripTransitions(tripData.status).length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
                <span style={{ fontSize: "14px", color: "var(--text)", fontWeight: 500 }}>Status:</span>
                <select
                  value={tripData.status}
                  disabled={updatingStatus}
                  onChange={(e) => handleTripStatusChange(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1.5px solid var(--border)",
                    backgroundColor: "var(--bg)",
                    color: "var(--text-h)",
                    fontSize: "13px"
                  }}
                >
                  <option value={tripData.status} disabled>{tripData.status}</option>
                  {getValidTripTransitions(tripData.status).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <p className="page-subtitle">Interactive transit trajectory and operational details</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }} className="dashboard-grid">
        {/* Left Side: Metadata and Stats Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Dispatch Info Card */}
          <div className="table-card" style={{ padding: "20px" }}>
            <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: "8px", margin: "0 0 16px" }}>
              📋 Dispatch Details
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text)" }}>
                  Pickup Location
                </label>
                <div style={{ color: "var(--text-h)", fontWeight: 500, fontSize: "15px", marginTop: "2px" }}>
                  📍 {tripData.pickup_location}
                </div>
              </div>
              
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text)" }}>
                  Destination Location
                </label>
                <div style={{ color: "var(--text-h)", fontWeight: 500, fontSize: "15px", marginTop: "2px" }}>
                  🏁 {tripData.destination}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text)" }}>
                    Assigned Driver
                  </label>
                  <div style={{ color: "var(--text-h)", fontWeight: 500, fontSize: "14px", marginTop: "2px" }}>
                    👤 {getDriverName(tripData.driver_id)}
                  </div>
                </div>
                
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text)" }}>
                    Vehicle Details
                  </label>
                  <div style={{ color: "var(--text-h)", fontWeight: 500, fontSize: "14px", marginTop: "2px" }}>
                    🚛 {getVehicleInfo(tripData.vehicle_id)}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text)" }}>
                  Shipment ID Reference
                </label>
                <div style={{ color: "var(--text-h)", fontWeight: 500, fontSize: "14px", marginTop: "2px" }}>
                  📦 Shipment #{tripData.shipment_id}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text)" }}>
                    Scheduled Start
                  </label>
                  <div style={{ color: "var(--text-h)", fontWeight: 500, fontSize: "14px", marginTop: "2px" }}>
                    📅 {tripData.scheduled_start ? new Date(tripData.scheduled_start).toLocaleString() : "Not scheduled"}
                  </div>
                </div>
                
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text)" }}>
                    Scheduled End
                  </label>
                  <div style={{ color: "var(--text-h)", fontWeight: 500, fontSize: "14px", marginTop: "2px" }}>
                    📅 {tripData.scheduled_end ? new Date(tripData.scheduled_end).toLocaleString() : "Not scheduled"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ETA Details Card */}
          {etaData && (
            <div className="table-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", border: etaUpdated ? "1.5px solid #3b82f6" : "1px solid var(--border)", transition: "all 0.3s ease" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "8px", margin: "0 0 4px" }}>
                <h3 style={{ margin: 0 }}>⏱️ ETA Details</h3>
                {etaUpdated && (
                  <span className="badge badge-success" style={{ backgroundColor: "#3b82f6", color: "#fff", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", padding: "2px 6px" }}>
                    ✨ ETA Updated
                  </span>
                )}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text)" }}>
                      Traffic Condition
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px", fontWeight: 600 }}>
                      {etaData.traffic_level === "Normal" && <span style={{ color: "#10B981" }}>🟢 Normal (1.0x)</span>}
                      {etaData.traffic_level === "Moderate" && <span style={{ color: "#F59E0B" }}>🟡 Moderate (1.15x)</span>}
                      {etaData.traffic_level === "Heavy" && <span style={{ color: "#EF4444" }}>🟠 Heavy (1.35x)</span>}
                      {etaData.traffic_level === "Severe" && <span style={{ color: "#DC2626" }}>🔴 Severe (1.60x)</span>}
                    </div>
                  </div>
                  
                  {canUpdateTraffic && (
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text)" }}>
                        Update Traffic
                      </label>
                      <select
                        value={etaData.traffic_level || "Normal"}
                        onChange={(e) => handleTrafficChange(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--bg)",
                          color: "var(--text-h)",
                          fontSize: "12px",
                          marginTop: "2px"
                        }}
                      >
                        <option value="Normal">Normal</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Heavy">Heavy</option>
                        <option value="Severe">Severe</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text)" }}>
                    📍 Current Coordinates
                  </label>
                  <div style={{ color: "var(--text-h)", fontWeight: 500, fontSize: "14px", marginTop: "2px" }}>
                    Lat: {etaData.current_latitude?.toFixed(4)}, Lon: {etaData.current_longitude?.toFixed(4)}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text)" }}>
                      📏 Remaining Distance
                    </label>
                    <div style={{ color: "var(--text-h)", fontWeight: 500, fontSize: "15px", marginTop: "2px" }}>
                      {etaData.remaining_distance_km} km
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text)" }}>
                      ⏱️ Normal OSRM Duration
                    </label>
                    <div style={{ color: "var(--text-h)", fontWeight: 500, fontSize: "15px", marginTop: "2px" }}>
                      {formatDurationMinutes(etaData.osrm_duration_minutes)}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text)" }}>
                      🔥 Traffic-Adjusted Duration
                    </label>
                    <div style={{ color: "var(--text-h)", fontWeight: 600, fontSize: "16px", marginTop: "2px" }}>
                      {formatDurationMinutes(etaData.traffic_adjusted_duration_minutes)}
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text)" }}>
                      🕐 Estimated Arrival Time
                    </label>
                    <div style={{ color: "var(--text-h)", fontWeight: 600, fontSize: "15px", marginTop: "2px" }}>
                      📅 {new Date(etaData.estimated_arrival_time).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Route Calculations Card */}
          <div className="table-card" style={{ padding: "20px" }}>
            <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: "8px", margin: "0 0 16px" }}>
              ⚡ Route Calculations
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ background: "var(--bg)", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "28px" }}>📏</div>
                <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text)", marginTop: "4px" }}>
                  Total Distance
                </div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-h)", marginTop: "2px" }}>
                  {formatDistance(routeData.distance)}
                </div>
              </div>

              <div style={{ background: "var(--bg)", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "28px" }}>⏱️</div>
                <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text)", marginTop: "4px" }}>
                  Est. Travel Time
                </div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-h)", marginTop: "2px" }}>
                  {formatDuration(routeData.estimated_duration)}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "16px", fontSize: "13px", color: "var(--text)" }}>
              <strong>Trajectory Summary:</strong> {routeData.summary || "No summary provided by OSRM"}
            </div>
          </div>
        </div>

        {/* Right Side: Map Container */}
        <div>
          <div className="table-card" style={{ padding: "20px", height: "100%", display: "flex", flexDirection: "column" }}>
            <h3 style={{ margin: "0 0 16px" }}>🗺️ Interactive Map Route</h3>
            <div style={{ flex: 1, minHeight: "450px" }}>
              <TripMap
                pickupLocation={routeData.pickup_location}
                destination={routeData.destination}
                pickupCoords={routeData.pickup_coordinates}
                destCoords={routeData.destination_coordinates}
                routeGeometry={routeData.route_geometry}
                currentLocation={currentLocation}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TripDetails;
