import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./MaintenanceReportPage.css";

const API_URL = "https://fleetflow-backend-90o5.onrender.com/reports/maintenance";

function MaintenanceReportPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const response = await axios.get(API_URL);
      setReport(response.data);
    } catch (error) {
      console.error("Maintenance report error:", error);
      setError("Unable to load maintenance report.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />

        <div className="maintenance-report-page">
          <div className="report-loading">
            <h3>Loading Maintenance Report...</h3>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />

        <div className="maintenance-report-page">
          <div className="alert alert-danger">
            {error}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="maintenance-report-page">

        {/* Page Header */}
        <div className="report-header">
          <div>
            <h2>Maintenance Analytics Report</h2>
            <p>
              Overview of vehicle maintenance activities and performance.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={fetchReport}
          >
            Refresh Report
          </button>
        </div>

        {/* Summary Cards */}
        <div className="maintenance-report-grid">

          {/* Total Records */}
          <div className="maintenance-report-card border-primary">
            <div className="report-card-body">
              <h5>Total Maintenance Records</h5>

              <h2 className="text-primary">
                {report?.total_maintenance_records ?? 0}
              </h2>

              <p>Maintenance activities recorded</p>
            </div>
          </div>

          {/* Vehicles Under Maintenance */}
          <div className="maintenance-report-card border-warning">
            <div className="report-card-body">
              <h5>Vehicles Under Maintenance</h5>

              <h2 className="text-warning">
                {report?.vehicles_under_maintenance ?? 0}
              </h2>

              <p>Currently under service</p>
            </div>
          </div>

          {/* Completed Services */}
          <div className="maintenance-report-card border-success">
            <div className="report-card-body">
              <h5>Completed Services</h5>

              <h2 className="text-success">
                {report?.completed_services ?? 0}
              </h2>

              <p>Successfully completed</p>
            </div>
          </div>

          {/* Overdue Services */}
          <div className="maintenance-report-card border-danger">
            <div className="report-card-body">
              <h5>Overdue Services</h5>

              <h2 className="text-danger">
                {report?.overdue_services ?? 0}
              </h2>

              <p>Services requiring attention</p>
            </div>
          </div>

          {/* Total Cost */}
          <div className="maintenance-report-card border-info">
            <div className="report-card-body">
              <h5>Total Maintenance Cost</h5>

              <h2 className="text-info">
                ₹{report?.total_maintenance_cost ?? 0}
              </h2>

              <p>Total maintenance expenditure</p>
            </div>
          </div>

          {/* Most Frequent Category */}
          <div className="maintenance-report-card border-secondary">
            <div className="report-card-body">
              <h5>Most Frequent Category</h5>

              <h3 className="text-secondary">
                {report?.most_frequent_maintenance_category || "N/A"}
              </h3>

              <p>Most common maintenance type</p>
            </div>
          </div>

        </div>

        {/* Report Details */}
        <div className="report-details-card">

          <div className="report-details-header">
            Maintenance Report Summary
          </div>

          <div className="report-details-body">

            <div className="report-detail-row">
              <span>Total Maintenance Records</span>
              <strong>
                {report?.total_maintenance_records ?? 0}
              </strong>
            </div>

            <div className="report-detail-row">
              <span>Vehicles Under Maintenance</span>
              <strong>
                {report?.vehicles_under_maintenance ?? 0}
              </strong>
            </div>

            <div className="report-detail-row">
              <span>Completed Services</span>
              <strong>
                {report?.completed_services ?? 0}
              </strong>
            </div>

            <div className="report-detail-row">
              <span>Overdue Services</span>
              <strong>
                {report?.overdue_services ?? 0}
              </strong>
            </div>

            <div className="report-detail-row">
              <span>Total Maintenance Cost</span>
              <strong>
                ₹{report?.total_maintenance_cost ?? 0}
              </strong>
            </div>

            <div className="report-detail-row">
              <span>Most Frequent Category</span>
              <strong>
                {report?.most_frequent_maintenance_category || "N/A"}
              </strong>
            </div>

          </div>
        </div>

      </main>
    </>
  );
}

export default MaintenanceReportPage;