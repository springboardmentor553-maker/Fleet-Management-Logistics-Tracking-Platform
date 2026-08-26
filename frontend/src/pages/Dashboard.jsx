import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { getDashboard, getTrips, getVehicles } from "../api/endpoints";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [dashRes, tripsRes, vehiclesRes] = await Promise.all([
        getDashboard(),
        getTrips(),
        getVehicles(),
      ]);
      setStats(dashRes.data);
      setTrips(tripsRes.data);
      setVehicles(vehiclesRes.data);
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) {
    return <div><p style={{ color: "var(--danger)" }}>{error}</p></div>;
  }

  if (!stats) {
    return <div><p>Loading dashboard…</p></div>;
  }

  const fuelTrendData = buildFuelTrend(stats);

  return (
    <div>
      <h1 className="page-title">Fleet Command Dashboard</h1>
      <p className="page-subtitle">Comprehensive view of vehicles, drivers, deliveries and fleet performance.</p>

      <div className="stat-grid">
        <StatCard label="Total Vehicles" value={stats.total_vehicles}
          sub={`${stats.active_vehicles} active · ${stats.vehicles_under_maintenance} in maintenance`} />
        <StatCard label="Drivers" value={stats.total_drivers}
          sub={`${stats.assigned_drivers} assigned · ${stats.total_drivers - stats.assigned_drivers} available`} />
        <StatCard label="Fuel Consumption" value={`${stats.total_fuel_consumption_liters} L`}
          sub="Total liters consumed" />
        <StatCard label="Maintenance Records" value={stats.total_maintenance_records}
          sub="Total service records" />
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Fleet Overview</h3>
          <StatRow label="Total Vehicles" value={stats.total_vehicles} />
          <StatRow label="Active / Maintenance" value={`${stats.active_vehicles} / ${stats.vehicles_under_maintenance}`} />
          <StatRow label="Total Drivers" value={stats.total_drivers} />
          <StatRow label="Available / Assigned" value={`${stats.total_drivers - stats.assigned_drivers} / ${stats.assigned_drivers}`} />
        </div>

        <div className="card">
          <h3 className="card-title">Operational Snapshot</h3>
          <StatRow label="Total Trips" value={stats.total_trips} />
          <StatRow label="Completed Trips" value={stats.completed_trips} />
          <StatRow label="Fuel Consumption" value={`${stats.total_fuel_consumption_liters} L`} />
          <StatRow label="Maintenance Records" value={stats.total_maintenance_records} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="card-title">Trips Overview</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={fuelTrendData}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
            <YAxis stroke="var(--text-muted)" fontSize={12} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
            <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="card-title">Active Trips</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Route</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {trips.slice(0, 6).map((t) => (
              <tr key={t.id}>
                <td>TR-{t.id}</td>
                <td>{t.pickup_location} → {t.destination}</td>
                <td><StatusBadge status={t.status} /></td>
              </tr>
            ))}
            {trips.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--text-muted)" }}>No trips yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildFuelTrend(stats) {
  return [
    { name: "Trips", value: stats.total_trips },
    { name: "Completed", value: stats.completed_trips },
    { name: "Maintenance", value: stats.total_maintenance_records },
  ];
}

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-card-head">
        <span className="stat-label">{label}</span>
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-sub">{sub}</p>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>{label}</span>
      <strong style={{ fontSize: 14 }}>{value}</strong>
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    Scheduled: "blue",
    "In Progress": "yellow",
    Completed: "green",
    Cancelled: "red",
    Available: "green",
    Assigned: "blue",
    "Under Maintenance": "yellow",
    "On Leave": "gray",
  };
  return <span className={`badge ${map[status] || "gray"}`}>{status}</span>;
}