import React, { useEffect, useState } from "react";
import { getVehicles } from "../api/endpoints";
import { StatusBadge } from "./Dashboard";

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getVehicles()
      .then((res) => setVehicles(res.data))
      .catch((err) => setError(err.message));
  }, []);

  const total = vehicles.length;
  const active = vehicles.filter((v) => v.status === "Available").length;
  const maintenance = vehicles.filter((v) => v.status === "Under Maintenance").length;

  return (
    <div>
      <h1 className="page-title">Fleet Vehicles</h1>
      <p className="page-subtitle">Registry of every vehicle in the FleetFlow fleet.</p>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      <div className="stat-grid">
        <div className="stat-card"><span className="stat-label">Total</span><p className="stat-value">{total}</p></div>
        <div className="stat-card"><span className="stat-label">Active</span><p className="stat-value">{active}</p></div>
        <div className="stat-card"><span className="stat-label">In Maintenance</span><p className="stat-value">{maintenance}</p></div>
      </div>

      <div className="card">
        <h3 className="card-title">All Vehicles</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Number</th><th>Type</th><th>Capacity</th><th>Fuel</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td>VH-{v.id}</td>
                <td>{v.vehicle_number}</td>
                <td>{v.vehicle_type}</td>
                <td>{v.capacity}</td>
                <td>{v.fuel_type}</td>
                <td><StatusBadge status={v.status} /></td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)" }}>No vehicles yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}