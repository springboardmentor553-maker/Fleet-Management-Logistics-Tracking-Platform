import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const API_URL = "https://fleetflow-backend-90o5.onrender.com/reports";

export default function ReportPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_URL}/summary`);

      setReport(response.data);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.detail ||
          "Unable to load FleetFlow overall report."
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      setDownloading(true);

      const response = await axios.get(`${API_URL}/overall`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "FleetFlow_Overall_Report.pdf";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);

      alert("Unable to download report.");
    } finally {
      setDownloading(false);
    }
  };

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <>
        <Navbar />

        <div className="report-page">
          <div className="report-loading">
            <div className="spinner-border text-primary"></div>

            <h4 className="mt-3">
              Loading FleetFlow Report...
            </h4>
          </div>
        </div>
      </>
    );
  }

  /* =========================================
     ERROR
  ========================================= */

  if (error) {
    return (
      <>
        <Navbar />

        <div className="report-page">
          <div className="alert alert-danger mt-4">

            <h5>
              Unable to Load Report
            </h5>

            <p>
              {error}
            </p>

            <button
              className="btn btn-primary"
              onClick={fetchReport}
            >
              🔄 Try Again
            </button>

          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="report-page">

        {/* =========================================
            PAGE HEADER
        ========================================= */}

        <div className="report-header">

          <div className="report-title">

            <h2>
              📊 FleetFlow Overall Report
            </h2>

            <p>
              Overview of fleet operations and analytics.
            </p>

          </div>

          <div className="report-actions">

            <button
              className="btn btn-primary"
              onClick={fetchReport}
            >
              🔄 Refresh
            </button>

            <button
              className="btn btn-success"
              onClick={downloadReport}
              disabled={downloading}
            >
              {downloading
                ? "Generating..."
                : "📄 Download PDF"}
            </button>

          </div>

        </div>


        {/* =========================================
            REPORT CARDS
        ========================================= */}

        <div className="row report-row">

          {/* =====================================
              VEHICLES
          ===================================== */}

          <div className="col-12 col-md-6 mb-4">

            <div className="card shadow h-100">

              <div className="card-header bg-primary text-white">

                <h5 className="mb-0">
                  🚚 Vehicles
                </h5>

              </div>

              <div className="card-body">

                <div className="row">

                  <div className="col-6 mb-3">

                    <small className="text-muted">
                      Total
                    </small>

                    <h3>
                      {report?.vehicles?.total ?? 0}
                    </h3>

                  </div>


                  <div className="col-6 mb-3">

                    <small className="text-muted">
                      Available
                    </small>

                    <h3 className="text-success">
                      {report?.vehicles?.available ?? 0}
                    </h3>

                  </div>


                  <div className="col-6">

                    <small className="text-muted">
                      On Trip
                    </small>

                    <h3 className="text-primary">
                      {report?.vehicles?.on_trip ?? 0}
                    </h3>

                  </div>


                  <div className="col-6">

                    <small className="text-muted">
                      Maintenance
                    </small>

                    <h3 className="text-warning">
                      {report?.vehicles?.maintenance ?? 0}
                    </h3>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* =====================================
              DRIVERS
          ===================================== */}

          <div className="col-12 col-md-6 mb-4">

            <div className="card shadow h-100">

              <div className="card-header bg-success text-white">

                <h5 className="mb-0">
                  👨‍✈️ Drivers
                </h5>

              </div>

              <div className="card-body">

                <div className="row">

                  <div className="col-6 mb-3">

                    <small className="text-muted">
                      Total
                    </small>

                    <h3>
                      {report?.drivers?.total ?? 0}
                    </h3>

                  </div>


                  <div className="col-6 mb-3">

                    <small className="text-muted">
                      Assigned
                    </small>

                    <h3 className="text-warning">
                      {report?.drivers?.assigned ?? 0}
                    </h3>

                  </div>


                  <div className="col-6">

                    <small className="text-muted">
                      On Trip
                    </small>

                    <h3 className="text-success">
                      {report?.drivers?.on_trip ?? 0}
                    </h3>

                  </div>


                  <div className="col-6">

                    <small className="text-muted">
                      On Leave
                    </small>

                    <h3 className="text-danger">
                      {report?.drivers?.on_leave ?? 0}
                    </h3>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* =====================================
              SHIPMENTS
          ===================================== */}

          <div className="col-12 col-md-6 mb-4">

            <div className="card shadow h-100">

              <div className="card-header bg-info text-white">

                <h5 className="mb-0">
                  📦 Shipments
                </h5>

              </div>

              <div className="card-body">

                <div className="row">

                  <div className="col-6 mb-3">

                    <small className="text-muted">
                      Total
                    </small>

                    <h3>
                      {report?.shipments?.total ?? 0}
                    </h3>

                  </div>


                  <div className="col-6 mb-3">

                    <small className="text-muted">
                      Assigned
                    </small>

                    <h3>
                      {report?.shipments?.assigned ?? 0}
                    </h3>

                  </div>


                  <div className="col-6">

                    <small className="text-muted">
                      In Transit
                    </small>

                    <h3 className="text-primary">
                      {report?.shipments?.in_transit ?? 0}
                    </h3>

                  </div>


                  <div className="col-6">

                    <small className="text-muted">
                      Delivered
                    </small>

                    <h3 className="text-success">
                      {report?.shipments?.delivered ?? 0}
                    </h3>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* =====================================
              DELIVERIES
          ===================================== */}

          <div className="col-12 col-md-6 mb-4">

            <div className="card shadow h-100">

              <div className="card-header bg-success text-white">

                <h5 className="mb-0">
                  🚛 Deliveries
                </h5>

              </div>

              <div className="card-body">

                <div className="row text-center">

                  <div className="col-4">

                    <small>
                      Total
                    </small>

                    <h3>
                      {report?.deliveries?.total ?? 0}
                    </h3>

                  </div>


                  <div className="col-4">

                    <small>
                      Pending
                    </small>

                    <h3 className="text-warning">
                      {report?.deliveries?.pending ?? 0}
                    </h3>

                  </div>


                  <div className="col-4">

                    <small>
                      Delivered
                    </small>

                    <h3 className="text-success">
                      {report?.deliveries?.delivered ?? 0}
                    </h3>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* =====================================
              ROUTES
          ===================================== */}

          <div className="col-12 col-md-6 mb-4">

            <div className="card shadow h-100">

              <div className="card-header bg-secondary text-white">

                <h5 className="mb-0">
                  🛣️ Routes
                </h5>

              </div>

              <div className="card-body text-center">

                <small className="text-muted">
                  Total Routes
                </small>

                <h1 className="text-secondary">
                  {report?.routes?.total ?? 0}
                </h1>

              </div>

            </div>

          </div>


          {/* =====================================
              MAINTENANCE
          ===================================== */}

          <div className="col-12 col-md-6 mb-4">

            <div className="card shadow h-100">

              <div className="card-header bg-warning">

                <h5 className="mb-0">
                  🔧 Maintenance
                </h5>

              </div>

              <div className="card-body text-center">

                <small className="text-muted">
                  Total Maintenance Records
                </small>

                <h1 className="text-warning">
                  {report?.maintenance?.total ?? 0}
                </h1>

              </div>

            </div>

          </div>


          {/* =====================================
              FUEL
          ===================================== */}

          <div className="col-12 mb-4">

            <div className="card shadow">

              <div className="card-header bg-dark text-white">

                <h5 className="mb-0">
                  ⛽ Fuel Analytics
                </h5>

              </div>

              <div className="card-body">

                <div className="row text-center">

                  <div className="col-12 col-md-6 mb-3 mb-md-0">

                    <small className="text-muted">
                      Total Fuel Consumed
                    </small>

                    <h2 className="text-primary">
                      {report?.fuel?.total_fuel ?? 0} L
                    </h2>

                  </div>


                  <div className="col-12 col-md-6">

                    <small className="text-muted">
                      Total Fuel Cost
                    </small>

                    <h2 className="text-success">
                      ₹{report?.fuel?.total_cost ?? 0}
                    </h2>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* =========================================
            DOWNLOAD SECTION
        ========================================= */}

        <div className="card shadow mb-5">

          <div className="card-body text-center">

            <h5>
              Generate FleetFlow Report
            </h5>

            <p className="text-muted">
              Download the complete fleet management report
              as a PDF.
            </p>

            <button
              className="btn btn-success btn-lg"
              onClick={downloadReport}
              disabled={downloading}
            >
              {downloading
                ? "Generating Report..."
                : "📄 Download Overall Report (PDF)"}
            </button>

          </div>

        </div>

      </main>
    </>
  );
}