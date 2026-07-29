import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import TripMap from "../components/TripMap";

function TripDetails() {
  const { trip_id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [routeData, setRouteData] = useState(null);
  const [tripData, setTripData] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

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
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <Link to="/shipments" className="btn btn-secondary btn-sm" style={{ padding: "6px 12px" }}>
              ← Return
            </Link>
            <h2 style={{ margin: 0 }}>Route Map: Trip #{tripData.id}</h2>
            <span className={`badge badge-${tripData.status.toLowerCase().replace(" ", "-")}`}>
              {tripData.status}
            </span>
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
            </div>
          </div>

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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TripDetails;
