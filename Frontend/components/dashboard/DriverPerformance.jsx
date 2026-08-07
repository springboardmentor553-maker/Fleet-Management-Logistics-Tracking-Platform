import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

function DriverPerformance() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/dashboard/driver-performance")
      .then((response) => {
        setDrivers(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching driver performance:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container mt-5">
        <h3 className="text-center">Loading...</h3>
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <div className="container mt-5">
        <h3 className="text-center">No driver data found.</h3>
      </div>
    );
  }

  const totalDrivers = drivers.length;

  const totalShipments = drivers.reduce(
    (sum, driver) => sum + driver.total_shipments,
    0
  );

  const COLORS = [
    "#0d6efd",
    "#198754",
    "#ffc107",
    "#dc3545",
    "#6f42c1",
    "#fd7e14",
    "#20c997",
    "#6610f2",
  ];

  return (
    <div className="container mt-5">

      <h1 className="text-center mb-4">
        Driver Shipment Analytics
      </h1>

      {/* Dashboard Cards */}

      <div className="row">

        <div className="col-md-6 mb-3">
          <div className="card shadow text-center">
            <div className="card-body">
              <h5>Total Drivers</h5>
              <h2>{totalDrivers}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card shadow text-center">
            <div className="card-body">
              <h5>Total Shipments</h5>
              <h2>{totalShipments}</h2>
            </div>
          </div>
        </div>

      </div>

      {/* Bar Chart */}

      <div className="card shadow mt-4">
        <div className="card-body">

          <h4 className="text-center mb-4">
            Shipments by Driver
          </h4>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={drivers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="driver_name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="total_shipments"
                fill="#0d6efd"
              />
            </BarChart>
          </ResponsiveContainer>

        </div>
      </div>

      {/* Pie Chart */}

      <div className="card shadow mt-4">
        <div className="card-body">

          <h4 className="text-center mb-4">
            Shipment Distribution
          </h4>

          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={drivers}
                dataKey="total_shipments"
                nameKey="driver_name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {drivers.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip />
              <Legend />

            </PieChart>
          </ResponsiveContainer>

        </div>
      </div>

      {/* Table */}

      <div className="card shadow mt-4 mb-5">
        <div className="card-body">

          <h4 className="mb-3">
            Driver Shipment Details
          </h4>

          <table className="table table-bordered table-striped">

            <thead className="table-dark">
              <tr>
                <th>Driver ID</th>
                <th>Driver Name</th>
                <th>Total Shipments</th>
              </tr>
            </thead>

            <tbody>

              {drivers.map((driver) => (
                <tr key={driver.driver_id}>
                  <td>{driver.driver_id}</td>
                  <td>{driver.driver_name}</td>
                  <td>{driver.total_shipments}</td>
                </tr>
              ))}

            </tbody>

          </table>

        </div>
      </div>

    </div>
  );
}

export default DriverPerformance;