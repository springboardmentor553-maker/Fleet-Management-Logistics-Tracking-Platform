import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

function Trips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await api.get("/trips/");
        setTrips(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch trips:", err);
        const detail =
          err.response?.data?.detail || "Failed to load trips. Please try again.";
        setErrorMsg(detail);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const formatDateTime = (dt) => {
    if (!dt) return "—";
    try {
      return new Date(dt).toLocaleString();
    } catch {
      return "—";
    }
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || "unknown").toLowerCase().replace(/\s+/g, "-");
    return `badge badge-${s}`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container trips-page">
      <div className="page-header">
        <div>
          <h2>Trips</h2>
          <p className="page-subtitle">View and manage all scheduled and active fleet trips</p>
        </div>
      </div>

      {errorMsg && (
        <div className="error-banner">
          <span>⚠</span> {errorMsg}
        </div>
      )}

      <div className="table-card">
        <h3>All Trips ({trips.length})</h3>
        {trips.length === 0 ? (
          <p className="empty-state">No trips found in the system.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Shipment</th>
                  <th>Driver ID</th>
                  <th>Vehicle ID</th>
                  <th>Pickup</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Traffic</th>
                  <th>Scheduled Start</th>
                  <th>Scheduled End</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <tr key={trip.id}>
                    <td>
                      <strong>#{trip.id}</strong>
                    </td>
                    <td>
                      {trip.shipment_id != null ? `TRK-${trip.shipment_id}` : "—"}
                    </td>
                    <td>{trip.driver_id != null ? `#${trip.driver_id}` : "—"}</td>
                    <td>{trip.vehicle_id != null ? `#${trip.vehicle_id}` : "—"}</td>
                    <td
                      title={trip.pickup_location}
                      style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {trip.pickup_location || "—"}
                    </td>
                    <td
                      title={trip.destination}
                      style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {trip.destination || "—"}
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(trip.status)}>
                        {trip.status || "Unknown"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", color: "var(--text)" }}>
                        {trip.traffic_level || "Normal"}
                      </span>
                    </td>
                    <td style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
                      {formatDateTime(trip.scheduled_start)}
                    </td>
                    <td style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
                      {formatDateTime(trip.scheduled_end)}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => navigate(`/trips/${trip.id}`)}
                        >
                          🗺️ View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Trips;
