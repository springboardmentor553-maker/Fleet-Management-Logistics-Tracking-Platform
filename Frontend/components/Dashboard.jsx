import React, { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const [data, setData] = useState({
    totalVehicles: 0,
    active: 0,
    available: 0,
    maintenance: 0,
  });

  useEffect(() => {
    API.get("/dashboard/")
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  return (
    <>
      <Navbar />

      <div className="container mt-4">
        <h2 className="mb-4 fw-bold text-primary">
          🚚 FleetFlow Dashboard
        </h2>

        <div className="row g-4">

          <div className="col-md-3">
            <div
              className="card shadow border-0 text-white"
              style={{ background: "#0d6efd", borderRadius: "15px" }}
            >
              <div className="card-body text-center">
                <h5>Total Vehicles</h5>
                <h1>{data.totalVehicles}</h1>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div
              className="card shadow border-0 text-white"
              style={{ background: "#198754", borderRadius: "15px" }}
            >
              <div className="card-body text-center">
                <h5>Active Vehicles</h5>
                <h1>{data.active}</h1>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div
              className="card shadow border-0 text-dark"
              style={{ background: "#ffc107", borderRadius: "15px" }}
            >
              <div className="card-body text-center">
                <h5>Available</h5>
                <h1>{data.available}</h1>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div
              className="card shadow border-0 text-white"
              style={{ background: "#dc3545", borderRadius: "15px" }}
            >
              <div className="card-body text-center">
                <h5>Maintenance</h5>
                <h1>{data.maintenance}</h1>
              </div>
            </div>
          </div>

        </div>

        <div className="card shadow mt-5 border-0">
          <div className="card-header bg-dark text-white">
            Fleet Overview
          </div>

          <div className="card-body">
            <p>
              Welcome to the FleetFlow Management Dashboard.
            </p>

            <p>
              Monitor vehicles, shipments, routes, drivers,
              maintenance schedules, and operational analytics
              from one place.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}