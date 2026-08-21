import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

export default function ReportPage() {

  const [report, setReport] = useState(null);

  useEffect(() => {
    axios
      .get("https://fleetflow-backend-90o5.onrender.com/reports/summary")
      .then((res) => setReport(res.data))
      .catch((err) => console.error(err));
  }, []);

  const downloadReport = async () => {
    try {
      const response = await axios.get(
        "https://fleetflow-backend-90o5.onrender.com/reports/overall",
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = "FleetFlow_Overall_Report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      alert("Unable to download report.");
    }
  };

  if (!report) {
    return <h3 className="text-center mt-5">Loading...</h3>;
  }

  return (
    <>
<Navbar />

<div
  className="container mt-4"
  style={{
    marginLeft: "280px",
    padding: "20px",
    width: "calc(100% - 300px)"
  }}
>

      <h2 className="text-center mb-4">
        FleetFlow Overall Report
      </h2>

      <div className="row">

        <div className="col-md-6 mb-4">
          <div className="card shadow">
            <div className="card-body">
              <h4>🚚 Vehicles</h4>
              <p>Total: {report.vehicles.total}</p>
              <p>Available: {report.vehicles.available}</p>
              <p>On Trip: {report.vehicles.on_trip}</p>
              <p>Maintenance: {report.vehicles.maintenance}</p>
              <p>Inactive: {report.vehicles.inactive}</p>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card shadow">
            <div className="card-body">
              <h4>👨 Drivers</h4>
              <p>Total: {report.drivers.total}</p>
              <p>Assigned: {report.drivers.assigned}</p>
              <p>On Trip: {report.drivers.on_trip}</p>
              <p>On Leave: {report.drivers.on_leave}</p>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card shadow">
            <div className="card-body">
              <h4>📦 Shipments</h4>
              <p>Total: {report.shipments.total}</p>
              <p>Assigned: {report.shipments.assigned}</p>
              <p>In Transit: {report.shipments.in_transit}</p>
              <p>Delivered: {report.shipments.delivered}</p>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card shadow">
            <div className="card-body">
              <h4>🚛 Deliveries</h4>
              <p>Total: {report.deliveries.total}</p>
              <p>Pending: {report.deliveries.pending}</p>
              <p>Delivered: {report.deliveries.delivered}</p>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card shadow">
            <div className="card-body">
              <h4>🛣 Routes</h4>
              <p>Total Routes: {report.routes.total}</p>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card shadow">
            <div className="card-body">
              <h4>🔧 Maintenance</h4>
              <p>Total Records: {report.maintenance.total}</p>
            </div>
          </div>
        </div>

        <div className="col-md-12 mb-4">
          <div className="card shadow">
            <div className="card-body">
              <h4>⛽ Fuel Analytics</h4>
              <p>Total Fuel: {report.fuel.total_fuel} L</p>
              <p>Total Cost: ₹{report.fuel.total_cost}</p>
            </div>
          </div>
        </div>

      </div>

      <div className="text-center mb-5">
        <button
          className="btn btn-success btn-lg"
          onClick={downloadReport}
        >
          Download Overall Report (PDF)
        </button>
      </div>

    </div>
    </>
  );
}