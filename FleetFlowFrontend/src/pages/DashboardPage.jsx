import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getDashboard } from "../services/dashboardService";
import { jwtDecode } from "jwt-decode";
import "../styles/dashboard-responsive.css";
export default function DashboardPage() {
  const token = localStorage.getItem("token");

  let userRole = "";

  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.role;
      console.log("Logged User Role:", userRole);
    } catch (error) {
      console.log("Invalid token:", error);
    }
  }

  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState({
    vehicles: {
      total: 0,
      available: 0,
      active: 0,
      maintenance: 0,
      inactive: 0,
    },

    drivers: {
      total: 0,
      active: 0,
    },

    routes: {
      total: 0,
    },

    shipments: {
      total: 0,
      active_deliveries: 0,
      delivered: 0,
      delayed: 0,
    },

    maintenance: {
      total: 0,
      pending: 0,
      completed: 0,
      overdue: 0,
    },

    analytics: {
      delivery_success: 0,
      fuel_consumption: 0,
    },
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await getDashboard();

      setSummary((prev) => ({
        ...prev,
        ...data,

        maintenance: {
          ...prev.maintenance,
          ...(data.maintenance || {}),
        },

        analytics: {
          ...prev.analytics,
          ...(data.operational_analytics || {}),
        },
      }));
    } catch (error) {
      console.log("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="dashboard-page">
          <h2 className="dashboard-loading">
            Loading Dashboard...
          </h2>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="dashboard-page">

        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Fleet Monitoring Dashboard</h1>
            <p className="dashboard-subtitle">
              Monitor fleet, drivers, shipments and operations
            </p>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="dashboard-cards">

          {(userRole === "Admin" ||
            userRole === "Fleet Manager") && (
            <>
              <Card
                title="Total Vehicles"
                value={summary.vehicles.total}
                color="#1976d2"
              />

              <Card
                title="Available Vehicles"
                value={summary.vehicles.available}
                color="green"
              />

              <Card
                title="Active Vehicles"
                value={summary.vehicles.active}
                color="orange"
              />

              <Card
                title="Maintenance Vehicles"
                value={summary.vehicles.maintenance}
                color="red"
              />
            </>
          )}

          {userRole === "Admin" && (
            <>
              <Card
                title="Total Drivers"
                value={summary.drivers.total}
                color="#8e44ad"
              />

              <Card
                title="Active Drivers"
                value={summary.drivers.active}
                color="#16a085"
              />
            </>
          )}

          {(userRole === "Admin" ||
            userRole === "Fleet Manager" ||
            userRole === "Dispatcher") && (
            <Card
              title="Routes"
              value={summary.routes.total}
              color="#34495e"
            />
          )}

          {userRole !== "Driver" && (
            <Card
              title="Total Shipments"
              value={summary.shipments.total}
              color="#e67e22"
            />
          )}

          <Card
            title="Active Deliveries"
            value={summary.shipments.active_deliveries}
            color="#3498db"
          />

          <Card
            title="Delivered"
            value={summary.shipments.delivered}
            color="#27ae60"
          />

          <Card
            title="Delayed"
            value={summary.shipments.delayed}
            color="#e74c3c"
          />

        </div>

        {/* Analytics */}
        <div className="dashboard-analytics">

          {(userRole === "Admin" ||
            userRole === "Fleet Manager") && (
            <div className="analytics-card">

              <h3>Maintenance Summary</h3>

              <div className="analytics-item">
                <span>Pending</span>
                <strong>
                  {summary.maintenance.pending || 0}
                </strong>
              </div>

              <div className="analytics-item">
                <span>Completed</span>
                <strong>
                  {summary.maintenance.completed || 0}
                </strong>
              </div>

            </div>
          )}

          {(userRole === "Admin" ||
            userRole === "Fleet Manager") && (
            <div className="analytics-card">

              <h3>Operational Analytics</h3>

              <div className="analytics-item">
                <span>Delivery Success</span>

                <strong>
                  {summary.analytics?.delivery_success || 0}%
                </strong>
              </div>

              <div className="analytics-item">
                <span>Fuel Consumption</span>

                <strong>
                  {summary.analytics?.fuel_consumption || 0}
                </strong>
              </div>

            </div>
          )}

        </div>

      </main>
    </>
  );
}


/* Card Component */

function Card({ title, value, color }) {
  return (
    <div
      className="dashboard-card"
      style={{ backgroundColor: color }}
    >
      <h3>{title}</h3>

      <h1>{value}</h1>
    </div>
  );
}