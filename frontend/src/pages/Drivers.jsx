import React, { useEffect, useState } from "react";
import { getDrivers } from "../api/endpoints";
import { StatusBadge } from "./Dashboard";

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getDrivers()
      .then((res) => setDrivers(res.data))
      .catch((err) => setError(err.message));
  }, []);

  const total = drivers.length;
  const assigned = drivers.filter((d) => d.status === "Assigned").length;
  const available = drivers.filter((d) => d.status === "Available").length;

  return (
    <div>
      <h1 className="page-title">Driver Management</h1>
      <p className="page-subtitle">Roster, assignments and driver status.</p>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      <div className="stat-grid">
        <div className="stat-card"><span className="stat-label">Total Drivers</span><p className="stat-value">{total}</p></div>
        <div className="stat-card"><span className="stat-label">Assigned</span><p className="stat-value">{assigned}</p></div>
        <div className="stat-card"><span className="stat-label">Available</span><p className="stat-value">{available}</p></div>
      </div>

      <div className="card">
        <h3 className="card-title">Driver Roster</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>License</th><th>Phone</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id}>
                <td>DR-{d.id}</td>
                <td>{d.name}</td>
                <td>{d.license_number}</td>
                <td>{d.phone}</td>
                <td><StatusBadge status={d.status} /></td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)" }}>No drivers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}