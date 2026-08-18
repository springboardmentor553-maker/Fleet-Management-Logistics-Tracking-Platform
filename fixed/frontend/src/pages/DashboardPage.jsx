import React, { useEffect, useState } from "react";
import { dashboardApi } from "../api/fleetApi.js";
import { SkeletonCards } from "../components/common/Skeleton.jsx";
import { Badge } from "../components/common/Badge.jsx";

export function DashboardPage({ onNavigate, showToast }) {
  const [summary, setSummary] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [sumData, repData] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getReport(),
      ]);
      setSummary(sumData);
      setReport(repData);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <header className="page-header">
          <div>
            <h1>Executive Dashboard</h1>
            <p className="subtitle">Real-time overview of fleet performance & logistics operations</p>
          </div>
        </header>
        <SkeletonCards count={8} />
      </div>
    );
  }

  const kpis = [
    { label: "Active Vehicles", val: summary?.vehicles ?? 0, icon: "🚛", target: "vehicles" },
    { label: "Total Drivers", val: summary?.drivers ?? 0, icon: "👤", target: "drivers" },
    { label: "Shipments", val: summary?.shipments ?? 0, icon: "📦", target: "shipments" },
    { label: "Routes Defined", val: summary?.routes ?? 0, icon: "🗺️", target: "routes" },
    { label: "Maint. Cost ($)", val: `$${(report?.total_maintenance_cost || 0).toLocaleString()}`, icon: "🛠️", target: "maintenance" },
    { label: "Total Cargo (tons)", val: report?.total_cargo_weight ?? 0, icon: "⚖️", target: "shipments" },
    { label: "Total Fleet Cap.", val: `${report?.total_vehicle_capacity ?? 0} tons`, icon: "⚡", target: "vehicles" },
    { label: "Unread Alerts", val: summary?.unread_notifications ?? 0, icon: "🔔", target: "notifications" },
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Executive Dashboard</h1>
          <p className="subtitle">Real-time overview of fleet operations, metrics, and active deliveries</p>
        </div>
        <button className="btn outline" onClick={loadDashboard} type="button">
          🔄 Sync Data
        </button>
      </header>

      {/* KPI Cards */}
      <section className="metrics-grid">
        {kpis.map((kpi) => (
          <div
            className="metric-card"
            key={kpi.label}
            onClick={() => onNavigate(kpi.target)}
          >
            <div className="metric-header">
              <span className="metric-icon">{kpi.icon}</span>
              <span className="metric-label">{kpi.label}</span>
            </div>
            <strong className="metric-value">{kpi.val}</strong>
          </div>
        ))}
      </section>

      {/* Fleet Breakdown Grid */}
      <section className="dashboard-breakdown-grid">
        <div className="panel">
          <div className="panel-header">
            <h3>Shipments by Status</h3>
          </div>
          <div className="status-breakdown-list">
            {report?.shipments_by_status &&
            Object.keys(report.shipments_by_status).length > 0 ? (
              Object.entries(report.shipments_by_status).map(([status, count]) => (
                <div className="breakdown-row" key={status}>
                  <Badge status={status} />
                  <span className="breakdown-count">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-muted">No shipment data logged in PostgreSQL.</p>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Vehicles by Status</h3>
          </div>
          <div className="status-breakdown-list">
            {report?.vehicles_by_status &&
            Object.keys(report.vehicles_by_status).length > 0 ? (
              Object.entries(report.vehicles_by_status).map(([status, count]) => (
                <div className="breakdown-row" key={status}>
                  <Badge status={status} />
                  <span className="breakdown-count">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-muted">No vehicle records in database.</p>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Maintenance Status</h3>
          </div>
          <div className="status-breakdown-list">
            {report?.maintenance_by_status &&
            Object.keys(report.maintenance_by_status).length > 0 ? (
              Object.entries(report.maintenance_by_status).map(([status, count]) => (
                <div className="breakdown-row" key={status}>
                  <Badge status={status} />
                  <span className="breakdown-count">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-muted">No maintenance activity logged.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
