import React, { useEffect, useState } from "react";
import { getTrips } from "../api/endpoints";
import { StatusBadge } from "./Dashboard";

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getTrips()
      .then((res) => setTrips(res.data))
      .catch((err) => setError(err.message));
  }, []);

  const total = trips.length;
  const active = trips.filter((t) => ["Scheduled", "In Progress"].includes(t.status)).length;
  const completed = trips.filter((t) => t.status === "Completed").length;

  return (
    <div>
      <h1 className="page-title">Trips & Routes</h1>
      <p className="page-subtitle">Every scheduled, running and completed trip.</p>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      <div className="stat-grid">
        <div className="stat-card"><span className="stat-label">Total Trips</span><p className="stat-value">{total}</p></div>
        <div className="stat-card"><span className="stat-label">Active</span><p className="stat-value">{active}</p></div>
        <div className="stat-card"><span className="stat-label">Completed</span><p className="stat-value">{completed}</p></div>
      </div>

      <div className="card">
        <h3 className="card-title">Trip Log</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Pickup</th><th>Destination</th><th>Driver</th><th>Vehicle</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t.id}>
                <td>TR-{t.id}</td>
                <td>{t.pickup_location}</td>
                <td>{t.destination}</td>
                <td>DR-{t.driver_id}</td>
                <td>VH-{t.vehicle_id}</td>
                <td><StatusBadge status={t.status} /></td>
              </tr>
            ))}
            {trips.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)" }}>No trips yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}