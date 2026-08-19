import { useEffect, useState } from "react";
import Navbar from "../layouts/Navbar";
import Sidebar from "../layouts/Sidebar";
import api from "../services/api";

function Dashboard() {
  const [dashboard, setDashboard] = useState({
    total_drivers: 0,
    total_vehicles: 0,
    total_shipments: 0,
    delivered_shipments: 0,
    pending_shipments: 0,
    low_fuel_vehicles: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
  try {
    const response = await api.get("/dashboard");
    setDashboard(response.data);
  } catch (error) {
    console.log(error);
  }
}

useEffect(() => {
  loadDashboard();
}, []);

  return (
    <>
      <Navbar />

      <div className="d-flex">
        <Sidebar />

        <div
  className="p-4"
  style={{
    marginLeft: "240px",
    width: "calc(100% - 240px)",
    border: "none",
    boxShadow: "none"
  }}

        >
          <h2 className="text-center mb-4">
            FleetFlow Dashboard
          </h2>

          <div className="row">

            <div className="col-lg-4 col-md-6 mb-4">
              <div className="card bg-primary text-white shadow">
                <div className="card-body text-center">
                  <h5>Total Drivers</h5>
                  <h2>{dashboard.total_drivers}</h2>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 mb-4">
              <div className="card bg-success text-white shadow">
                <div className="card-body text-center">
                  <h5>Total Vehicles</h5>
                  <h2>{dashboard.total_vehicles}</h2>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 mb-4">
              <div className="card bg-warning text-dark shadow">
                <div className="card-body text-center">
                  <h5>Total Shipments</h5>
                  <h2>{dashboard.total_shipments}</h2>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 mb-4">
              <div className="card bg-info text-white shadow">
                <div className="card-body text-center">
                  <h5>Delivered Shipments</h5>
                  <h2>{dashboard.delivered_shipments}</h2>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 mb-4">
              <div className="card bg-danger text-white shadow">
                <div className="card-body text-center">
                  <h5>Pending Shipments</h5>
                  <h2>{dashboard.pending_shipments}</h2>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 mb-4">
              <div className="card bg-secondary text-white shadow">
                <div className="card-body text-center">
                  <h5>Low Fuel Vehicles</h5>
                  <h2>{dashboard.low_fuel_vehicles}</h2>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}

export default Dashboard;