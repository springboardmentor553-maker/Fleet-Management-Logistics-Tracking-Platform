import React, { useEffect, useState } from "react";
import { getMaintenance } from "../api/endpoints";
import { StatusBadge } from "./Dashboard";

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getMaintenance()
      .then((res) => setRecords(res.data))
      .catch((err) => setError(err.message));
  }, []);

  const scheduled = records.filter((r) => r.maintenance_status === "Scheduled").length;
  const inProgress = records.filter((r) => r.maintenance_status === "In Progress").length;
  const completed = records.filter((r) => r.maintenance_status === "Completed").length;
  const totalCost = records.reduce((sum, r) => sum + (r.service_cost || 0), 0);

  return (
    <div>
      <h1 className="page-title">Maintenance & Service</h1>
      <p className="page-subtitle">Workshop schedule and service history.</p>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      <div className="stat-grid">
        <div className="stat-card"><span className="stat-label">Scheduled</span><p className="stat-value">{scheduled}</p></div>
        <div className="stat-card"><span className="stat-label">In Progress</span><p className="stat-value">{inProgress}</p></div>
        <div className="stat-card"><span className="stat-label">Completed</span><p className="stat-value">{completed}</p></div>
        <div className="stat-card"><span className="stat-label">Total Spend</span><p className="stat-value">₹{totalCost}</p></div>
      </div>

      <div className="card">
        <h3 className="card-title">Service Jobs</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Vehicle</th><th>Category</th><th>Next Service</th><th>Cost</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>MT-{r.id}</td>
                <td>VH-{r.vehicle_id}</td>
                <td>{r.maintenance_category}</td>
                <td>{r.next_service_date?.slice(0, 10) || "—"}</td>
                <td>₹{r.service_cost}</td>
                <td><StatusBadge status={r.maintenance_status} /></td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)" }}>No maintenance records yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}