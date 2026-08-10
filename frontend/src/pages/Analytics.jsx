import { useState, useEffect } from "react";
import api from "../services/api";
import DashboardCard from "../components/DashboardCard";
import LoadingSpinner from "../components/LoadingSpinner";

function Analytics() {
  const [fuelData, setFuelData] = useState(null);
  const [opsData, setOpsData] = useState(null);
  const [maintReport, setMaintReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchAnalytics = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [fuelRes, opsRes, maintRes] = await Promise.all([
        api.get("/analytics/fuel"),
        api.get("/analytics/operations"),
        api.get("/reports/maintenance"),
      ]);
      setFuelData(fuelRes.data);
      setOpsData(opsRes.data);
      setMaintReport(maintRes.data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load operational analytics metrics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container analytics-page">
      <div className="page-header">
        <div>
          <h2>Operational Analytics & Reports</h2>
          <p className="page-subtitle">
            Comprehensive operational metrics, fuel efficiency, delivery performance, and maintenance reports
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAnalytics}>
          🔄 Refresh Analytics
        </button>
      </div>

      {errorMsg && (
        <div className="error-banner">
          <span>⚠</span> {errorMsg}
        </div>
      )}

      {/* ── Operational Delivery Metrics ─────────────────────────────────── */}
      <div className="analytics-section">
        <h3>📦 Logistics & Delivery Performance</h3>
        {opsData && (
          <div className="metrics-grid">
            <DashboardCard
              title="Total Deliveries"
              value={opsData.total_deliveries}
              subtext={`${opsData.successful_deliveries} Delivered | ${opsData.delayed_deliveries} Delayed`}
              icon="🚚"
              color="primary"
            />
            <DashboardCard
              title="Delivery Success Rate"
              value={
                opsData.total_deliveries > 0
                  ? `${Math.round((opsData.successful_deliveries / opsData.total_deliveries) * 100)}%`
                  : "N/A"
              }
              subtext={`${opsData.cancelled_deliveries} Cancelled`}
              icon="🎯"
              color="success"
            />
            <DashboardCard
              title="Avg Delivery Time"
              value={`${opsData.average_delivery_time || 0} hrs`}
              subtext="Scheduled duration"
              icon="⏱️"
              color="info"
            />
            <DashboardCard
              title="Avg Trip Distance"
              value={`${opsData.average_trip_distance || 0} km`}
              subtext="Haversine distance"
              icon="🗺️"
              color="warning"
            />
          </div>
        )}
      </div>

      {/* ── Fuel Consumption & Costs Analytics ───────────────────────────── */}
      <div className="analytics-section" style={{ marginTop: "24px" }}>
        <h3>⛽ Fuel Monitoring & Efficiency</h3>
        {fuelData && (
          <div className="metrics-grid">
            <DashboardCard
              title="Total Fuel Consumed"
              value={`${fuelData.total_fuel_consumed ? fuelData.total_fuel_consumed.toFixed(1) : 0} L`}
              subtext={`Avg: ${fuelData.average_fuel_consumption ? fuelData.average_fuel_consumption.toFixed(1) : 0} L / log`}
              icon="⛽"
              color="primary"
            />
            <DashboardCard
              title="Total Fuel Cost"
              value={`$${fuelData.total_fuel_cost ? fuelData.total_fuel_cost.toFixed(2) : "0.00"}`}
              subtext="Aggregated expense"
              icon="💰"
              color="danger"
            />
            <DashboardCard
              title="Highest Fuel Consumer"
              value={
                fuelData.vehicle_with_highest_fuel_usage
                  ? fuelData.vehicle_with_highest_fuel_usage.vehicle_number
                  : "N/A"
              }
              subtext={
                fuelData.vehicle_with_highest_fuel_usage
                  ? `${fuelData.vehicle_with_highest_fuel_usage.fuel_consumed} L consumed`
                  : "No data"
              }
              icon="🔥"
              color="warning"
            />
            <DashboardCard
              title="Most Efficient Vehicle"
              value={
                fuelData.vehicle_with_lowest_fuel_usage
                  ? fuelData.vehicle_with_lowest_fuel_usage.vehicle_number
                  : "N/A"
              }
              subtext={
                fuelData.vehicle_with_lowest_fuel_usage
                  ? `${fuelData.vehicle_with_lowest_fuel_usage.fuel_consumed} L consumed`
                  : "No data"
              }
              icon="🌱"
              color="success"
            />
          </div>
        )}
      </div>

      {/* ── Maintenance Reports Summary ─────────────────────────────────── */}
      <div className="analytics-section" style={{ marginTop: "24px" }}>
        <h3>🔧 Maintenance & Fleet Health Report</h3>
        {maintReport && (
          <div className="metrics-grid">
            <DashboardCard
              title="Total Maintenance Records"
              value={maintReport.total_maintenance_records}
              subtext={`${maintReport.completed_services} Completed`}
              icon="🔧"
              color="primary"
            />
            <DashboardCard
              title="Vehicles in Maintenance"
              value={maintReport.vehicles_under_maintenance}
              subtext={`${maintReport.overdue_services} Overdue services`}
              icon="🛠️"
              color="danger"
            />
            <DashboardCard
              title="Total Maintenance Cost"
              value={`$${maintReport.total_maintenance_cost ? maintReport.total_maintenance_cost.toFixed(2) : "0.00"}`}
              subtext="Fleet repair expenses"
              icon="💵"
              color="warning"
            />
            <DashboardCard
              title="Top Maintenance Category"
              value={maintReport.most_frequent_maintenance_category || "None"}
              subtext="Most frequent service"
              icon="📊"
              color="info"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
