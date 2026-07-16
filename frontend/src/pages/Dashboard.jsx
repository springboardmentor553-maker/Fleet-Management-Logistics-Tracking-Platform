import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import DashboardCard from "../components/DashboardCard";
import LoadingSpinner from "../components/LoadingSpinner";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentShipments, setRecentShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // Fetch stats
      const statsRes = await api.get("/dashboard/");
      setStats(statsRes.data);

      // Fetch shipments to display recent operations list
      try {
        const shipmentsRes = await api.get("/shipments/");
        // Limit to 5 most recent shipments
        const sorted = shipmentsRes.data.sort((a, b) => b.id - a.id).slice(0, 5);
        setRecentShipments(sorted);
      } catch (err) {
        console.error("Failed to fetch shipments for dashboard", err);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
      setErrorMsg("Unable to retrieve dashboard metrics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container dashboard-page">
      <div className="page-header">
        <div>
          <h2>System Dashboard</h2>
          <p className="page-subtitle">Real-time overview of fleet operations and tracking metrics</p>
        </div>
        <button className="btn btn-secondary btn-refresh" onClick={fetchData}>
          🔄 Refresh Data
        </button>
      </div>

      {errorMsg && (
        <div className="error-banner">
          <span>⚠</span> {errorMsg}
        </div>
      )}

      {stats && (
        <>
          {/* Metrics Grid */}
          <div className="metrics-grid">
            <DashboardCard
              title="Total Vehicles"
              value={stats.total_vehicles}
              subtext={`${stats.available_vehicles} Available | ${stats.vehicles_on_trip} On Trip`}
              icon="🚚"
              color="primary"
            />
            <DashboardCard
              title="Total Drivers"
              value={stats.total_drivers}
              subtext={`${stats.available_drivers} Available | ${stats.drivers_on_trip} On Trip`}
              icon="👥"
              color="success"
            />
            <DashboardCard
              title="Active Shipments"
              value={stats.total_shipments}
              subtext={`${stats.in_transit_shipments} In Transit | ${stats.pending_shipments} Pending`}
              icon="📦"
              color="warning"
            />
          </div>

          <div className="dashboard-grid">
            {/* Quick Actions Panel */}
            <div className="dashboard-section quick-actions-section">
              <h3>Quick Administration</h3>
              <div className="quick-actions">
                <Link to="/shipments" className="action-card">
                  <span className="action-icon">➕📦</span>
                  <span>Create Shipment</span>
                </Link>
                <Link to="/vehicles" className="action-card">
                  <span className="action-icon">➕🚚</span>
                  <span>Add New Vehicle</span>
                </Link>
                <Link to="/drivers" className="action-card">
                  <span className="action-icon">➕👥</span>
                  <span>Register Driver</span>
                </Link>
              </div>
            </div>

            {/* Recent Orders/Shipments list */}
            <div className="dashboard-section recent-shipments-section">
              <div className="section-header">
                <h3>Recent Shipments</h3>
                <Link to="/shipments" className="view-all-link">View All</Link>
              </div>
              
              {recentShipments.length === 0 ? (
                <p className="empty-state">No shipments registered in the system yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Source</th>
                        <th>Destination</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentShipments.map((shipment) => (
                        <tr key={shipment.id}>
                          <td>#{shipment.id}</td>
                          <td>{shipment.source}</td>
                          <td>{shipment.destination}</td>
                          <td>
                            <span className={`badge badge-${shipment.status.toLowerCase().replace(" ", "-")}`}>
                              {shipment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;