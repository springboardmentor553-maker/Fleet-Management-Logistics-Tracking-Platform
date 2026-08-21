import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
export default function DriverPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  axios
    .get("https://fleetflow-backend-90o5.onrender.com/drivers/")
    .then((response) => {
      console.log(response.data);   // Add this
      setDrivers(response.data.drivers);
      setLoading(false);
    })
    .catch((error) => {
      console.error(error);
      setLoading(false);
    });
}, []);

  if (loading) {
    return <h3 className="text-center mt-5">Loading...</h3>;
  }

  return (
  <>
    <Navbar />

    <div
      className="container-fluid"
      style={{
        marginLeft: "260px",
        padding: "25px",
        background: "#f4f6f9",
        minHeight: "100vh",
      }}
    >
      <h2 className="mb-4">🚚 Driver Management</h2>

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card shadow text-center">
            <div className="card-body">
              <h5>Total Drivers</h5>
              <h2>{drivers.length}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow text-center">
            <div className="card-body">
              <h5>Assigned</h5>
              <h2>
                {drivers.filter((d) => d.status === "ASSIGNED").length}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow text-center">
            <div className="card-body">
              <h5>On Trip</h5>
              <h2>
                {drivers.filter((d) => d.status === "ON_TRIP").length}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow text-center">
            <div className="card-body">
              <h5>On Leave</h5>
              <h2>
                {drivers.filter((d) => d.status === "ON_LEAVE").length}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Analytics Charts */}

<div className="row mb-4">

  {/* Pie Chart */}
  <div className="col-md-6">
    <div className="card shadow">
      <div className="card-header bg-success text-white">
        Driver Status Distribution
      </div>

      <div className="card-body">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                {
                  name: "Assigned",
                  value: drivers.filter(
                    (d) => d.status === "ASSIGNED"
                  ).length,
                },
                {
                  name: "On Trip",
                  value: drivers.filter(
                    (d) => d.status === "ON_TRIP"
                  ).length,
                },
                {
                  name: "On Leave",
                  value: drivers.filter(
                    (d) => d.status === "ON_LEAVE"
                  ).length,
                },
              ]}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label
            >
              <Cell fill="#f39c12" />
              <Cell fill="#27ae60" />
              <Cell fill="#e74c3c" />
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>

  {/* Bar Chart */}
  <div className="col-md-6">
    <div className="card shadow">
      <div className="card-header bg-primary text-white">
        Driver Status Overview
      </div>

      <div className="card-body">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              {
                status: "Assigned",
                count: drivers.filter(
                  (d) => d.status === "ASSIGNED"
                ).length,
              },
              {
                status: "On Trip",
                count: drivers.filter(
                  (d) => d.status === "ON_TRIP"
                ).length,
              },
              {
                status: "On Leave",
                count: drivers.filter(
                  (d) => d.status === "ON_LEAVE"
                ).length,
              },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="count"
              fill="#1976d2"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>

</div>

      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          Driver List
        </div>

        <div className="card-body">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Driver Name</th>
                <th>Phone</th>
                <th>License Number</th>
                <th>Experience</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.id}>
                  <td>{driver.id}</td>
                  <td>{driver.full_name}</td>
                  <td>{driver.phone}</td>
                  <td>{driver.license_number}</td>
                  <td>{driver.experience} Years</td>
                  <td>
                    <span
                      className={`badge ${
                        driver.status === "ASSIGNED"
                          ? "bg-warning"
                          : driver.status === "ON_TRIP"
                          ? "bg-success"
                          : "bg-secondary"
                      }`}
                    >
                      {driver.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {drivers.length === 0 && (
            <div className="text-center text-muted">
              No drivers available.
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}