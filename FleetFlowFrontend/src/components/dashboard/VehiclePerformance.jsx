import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

function VehiclePerformance() {
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/dashboard/vehicle-performance`)
      .then((response) => {
        setVehicleData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching vehicle data:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <h2 className="text-center mt-5">Loading...</h2>;
  }

  if (!vehicleData) {
    return <h2 className="text-center mt-5">No vehicle data found.</h2>;
  }

  const chartData = [
    {
      name: "Available",
      value: vehicleData.available,
    },
    {
      name: "Active",
      value: vehicleData.active,
    },
    {
      name: "Maintenance",
      value: vehicleData.maintenance,
    },
    {
      name: "Inactive",
      value: vehicleData.inactive,
    },
  ];

  const COLORS = [
    "#198754", // Green
    "#0d6efd", // Blue
    "#ffc107", // Yellow
    "#dc3545", // Red
  ];

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Vehicle Performance Dashboard</h1>

      <div className="row">

        <div className="col-md-3 mb-3">
          <div className="card shadow text-center">
            <div className="card-body">
              <h5>Total Vehicles</h5>
              <h2>{vehicleData.total_vehicles}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card shadow text-center">
            <div className="card-body">
              <h5>Available</h5>
              <h2>{vehicleData.available}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card shadow text-center">
            <div className="card-body">
              <h5>Active</h5>
              <h2>{vehicleData.active}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card shadow text-center">
            <div className="card-body">
              <h5>Maintenance</h5>
              <h2>{vehicleData.maintenance}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card shadow text-center">
            <div className="card-body">
              <h5>Inactive</h5>
              <h2>{vehicleData.inactive}</h2>
            </div>
          </div>
        </div>

      </div>

      <div className="card shadow mt-4">
        <div className="card-body">
          <h4 className="text-center mb-4">Vehicle Status Overview</h4>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0d6efd" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card shadow mt-4">
        <div className="card-body">
          <h4 className="text-center mb-4">Vehicle Distribution</h4>

          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {chartData.map((entry, index) => (
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
    </div>
  );
}

export default VehiclePerformance;