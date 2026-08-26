import React, { useEffect, useState } from "react";
import { getFuelRecords, getFuelAnalytics } from "../api/endpoints";

export default function Fuel() {
  const [records, setRecords] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getFuelRecords(), getFuelAnalytics()])
      .then(([recRes, anaRes]) => {
        setRecords(recRes.data);
        setAnalytics(anaRes.data);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1 className="page-title">Fuel Monitoring & Analytics</h1>
      <p className="page-subtitle">Comprehensive view of fuel records and fleet efficiency.</p>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      {analytics && (
        <div className="stat-grid">
          <div className="stat-card"><span className="stat-label">Total Consumed</span><p className="stat-value">{analytics.total_liters} L</p></div>
          <div className="stat-card"><span className="stat-label">Total Cost</span><p className="stat-value">₹{analytics.total_cost}</p></div>
          <div className="stat-card"><span className="stat-label">Avg Cost/Liter</span><p className="stat-value">₹{analytics.average_cost_per_liter}</p></div>
          <div className="stat-card"><span className="stat-label">Records Logged</span><p className="stat-value">{analytics.total_records}</p></div>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">Fuel Records</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Date</th><th>Vehicle</th><th>Station</th><th>Liters</th><th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>FR-{r.id}</td>
                <td>{r.fuel_date?.slice(0, 10)}</td>
                <td>VH-{r.vehicle_id}</td>
                <td>{r.fuel_station || "—"}</td>
                <td>{r.liters}</td>
                <td>₹{r.cost}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)" }}>No fuel records yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}