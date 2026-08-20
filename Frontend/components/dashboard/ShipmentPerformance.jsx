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

function ShipmentPerformance() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/dashboard/shipment-performance")
      .then((response) => {
        setShipments(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching shipment analytics:", error);
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

  if (shipments.length === 0) {
    return (
      <div className="container mt-5">
        <h3 className="text-center">No shipment data found.</h3>
      </div>
    );
  }

  const totalShipments = shipments.reduce(
    (sum, item) => sum + item.total_shipments,
    0
  );

  const totalStatuses = shipments.length;

  const COLORS = [
    "#0d6efd",
    "#198754",
    "#ffc107",
    "#dc3545",
    "#6f42c1",
    "#20c997",
    "#fd7e14",
    "#6610f2",
  ];

  return (
    <div className="container mt-5">

      <h1 className="text-center mb-4">
        Shipment Analytics Dashboard
      </h1>

      {/* Dashboard Cards */}

      <div className="row">

        <div className="col-md-6 mb-3">
          <div className="card shadow text-center">
            <div className="card-body">
              <h5>Total Shipments</h5>
              <h2>{totalShipments}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card shadow text-center">
            <div className="card-body">
              <h5>Status Types</h5>
              <h2>{totalStatuses}</h2>
            </div>
          </div>
        </div>

      </div>

      {/* Bar Chart */}

      <div className="card shadow mt-4">
        <div className="card-body">

          <h4 className="text-center mb-4">
            Shipments by Status
          </h4>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={shipments}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
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
            Shipment Status Distribution
          </h4>

          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={shipments}
                dataKey="total_shipments"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {shipments.map((entry, index) => (
                  <Cell
                    key={index}
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
            Shipment Status Details
          </h4>

          <table className="table table-bordered table-striped">

            <thead className="table-dark">
              <tr>
                <th>Status</th>
                <th>Total Shipments</th>
              </tr>
            </thead>

            <tbody>

              {shipments.map((item, index) => (
                <tr key={index}>
                  <td>{item.status}</td>
                  <td>{item.total_shipments}</td>
                </tr>
              ))}

            </tbody>

          </table>

        </div>
      </div>

    </div>
  );
}

export default ShipmentPerformance;