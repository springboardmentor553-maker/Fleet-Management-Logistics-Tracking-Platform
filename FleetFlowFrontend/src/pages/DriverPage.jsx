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

import "./DriverPage.css";

const API_URL = "http://127.0.0.1:8000/drivers";

export default function DriverPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_URL}/`);

      console.log("Drivers API Response:", response.data);

      const driverData = Array.isArray(response.data)
        ? response.data
        : response.data?.drivers || [];

      setDrivers(driverData);
    } catch (error) {
      console.error("Error fetching drivers:", error);

      setError(
        error.response?.data?.detail ||
          "Unable to load driver data."
      );

      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // DRIVER STATUS COUNTS
  // ==============================

  const totalDrivers = drivers.length;

  const assignedDrivers = drivers.filter(
    (driver) => driver.status === "ASSIGNED"
  ).length;

  const onTripDrivers = drivers.filter(
    (driver) => driver.status === "ON_TRIP"
  ).length;

  const onLeaveDrivers = drivers.filter(
    (driver) => driver.status === "ON_LEAVE"
  ).length;

  const availableDrivers = drivers.filter(
    (driver) =>
      driver.status === "AVAILABLE" ||
      driver.status === "ACTIVE"
  ).length;

  // ==============================
  // PIE CHART DATA
  // ==============================

  const driverStatusData = [
    {
      name: "Assigned",
      value: assignedDrivers,
    },
    {
      name: "On Trip",
      value: onTripDrivers,
    },
    {
      name: "On Leave",
      value: onLeaveDrivers,
    },
    {
      name: "Available",
      value: availableDrivers,
    },
  ];

  // ==============================
  // BAR CHART DATA
  // ==============================

  const driverBarData = [
    {
      status: "Assigned",
      count: assignedDrivers,
    },
    {
      status: "On Trip",
      count: onTripDrivers,
    },
    {
      status: "On Leave",
      count: onLeaveDrivers,
    },
    {
      status: "Available",
      count: availableDrivers,
    },
  ];

  const COLORS = [
    "#f39c12",
    "#27ae60",
    "#e74c3c",
    "#3498db",
  ];

  // ==============================
  // STATUS BADGE
  // ==============================

  const getStatusBadge = (status) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-warning text-dark";

      case "ON_TRIP":
        return "bg-success";

      case "ON_LEAVE":
        return "bg-danger";

      case "AVAILABLE":
      case "ACTIVE":
        return "bg-primary";

      default:
        return "bg-secondary";
    }
  };

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <>
        <Navbar />

        <div className="page-container">

          <div className="text-center mt-5">

            <div
              className="spinner-border text-primary"
              role="status"
            ></div>

            <h4 className="mt-3">
              Loading Drivers...
            </h4>

          </div>

        </div>
      </>
    );
  }

  // ==============================
  // MAIN UI
  // ==============================

  return (
    <>
      <Navbar />

      <div className="page-container">

        {/* =========================
            PAGE HEADER
        ========================= */}

        <div className="page-header">

          <div>

            <h2 className="mb-1">
              🚚 Driver Management
            </h2>

            <p className="text-muted mb-0">
              Monitor driver availability, assignments and workload.
            </p>

          </div>

          <button
            className="btn btn-primary refresh-button"
            onClick={fetchDrivers}
          >
            🔄 Refresh
          </button>

        </div>

        {/* =========================
            ERROR
        ========================= */}

        {error && (
          <div className="alert alert-danger">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* =========================
            SUMMARY CARDS
        ========================= */}

        <div className="row mb-4">

          <div className="col-md-3 col-6 mb-3">

            <div className="card shadow h-100 border-primary">

              <div className="card-body text-center">

                <h5 className="text-muted">
                  Total Drivers
                </h5>

                <h2 className="text-primary">
                  {totalDrivers}
                </h2>

              </div>

            </div>

          </div>

          <div className="col-md-3 col-6 mb-3">

            <div className="card shadow h-100 border-warning">

              <div className="card-body text-center">

                <h5 className="text-muted">
                  Assigned
                </h5>

                <h2 className="text-warning">
                  {assignedDrivers}
                </h2>

              </div>

            </div>

          </div>

          <div className="col-md-3 col-6 mb-3">

            <div className="card shadow h-100 border-success">

              <div className="card-body text-center">

                <h5 className="text-muted">
                  On Trip
                </h5>

                <h2 className="text-success">
                  {onTripDrivers}
                </h2>

              </div>

            </div>

          </div>

          <div className="col-md-3 col-6 mb-3">

            <div className="card shadow h-100 border-danger">

              <div className="card-body text-center">

                <h5 className="text-muted">
                  On Leave
                </h5>

                <h2 className="text-danger">
                  {onLeaveDrivers}
                </h2>

              </div>

            </div>

          </div>

        </div>

        {/* =========================
            DRIVER ANALYTICS
        ========================= */}

        <div className="row mb-4">

          {/* PIE CHART */}

          <div className="col-md-6 mb-4">

            <div className="card shadow h-100">

              <div className="card-header bg-success text-white">

                <h5 className="mb-0">
                  Driver Status Distribution
                </h5>

              </div>

              <div className="card-body chart-container">

                {drivers.length === 0 ? (

                  <div className="text-center text-muted py-5">
                    No driver data available.
                  </div>

                ) : (

                  <ResponsiveContainer
                    width="100%"
                    height={300}
                  >

                    <PieChart>

                      <Pie
                        data={driverStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >

                        {driverStatusData.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index]}
                            />
                          )
                        )}

                      </Pie>

                      <Tooltip />

                      <Legend />

                    </PieChart>

                  </ResponsiveContainer>

                )}

              </div>

            </div>

          </div>

          {/* BAR CHART */}

          <div className="col-md-6 mb-4">

            <div className="card shadow h-100">

              <div className="card-header bg-primary text-white">

                <h5 className="mb-0">
                  Driver Status Overview
                </h5>

              </div>

              <div className="card-body chart-container">

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >

                  <BarChart
                    data={driverBarData}
                    margin={{
                      top: 20,
                      right: 20,
                      left: 0,
                      bottom: 5,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="status"
                    />

                    <YAxis
                      allowDecimals={false}
                    />

                    <Tooltip />

                    <Legend />

                    <Bar
                      dataKey="count"
                      name="Drivers"
                      fill="#1976d2"
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>

          </div>

        </div>

        {/* =========================
            DRIVER TABLE
        ========================= */}

        <div className="card shadow">

          <div className="card-header bg-dark text-white driver-list-header">

            <h5 className="mb-0">
              Driver List
            </h5>

            <span className="badge bg-light text-dark">
              {drivers.length} Drivers
            </span>

          </div>

          <div className="card-body">

            {drivers.length === 0 ? (

              <div className="text-center text-muted py-4">
                No drivers available.
              </div>

            ) : (

              <div className="table-responsive">

                <table className="table table-bordered table-hover align-middle">

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

                        <td>
                          {driver.id}
                        </td>

                        <td>
                          <strong>
                            {driver.full_name || "-"}
                          </strong>
                        </td>

                        <td>
                          {driver.phone || "-"}
                        </td>

                        <td>
                          {driver.license_number || "-"}
                        </td>

                        <td>
                          {driver.experience !== null &&
                          driver.experience !== undefined
                            ? `${driver.experience} Years`
                            : "-"}
                        </td>

                        <td>

                          <span
                            className={`badge ${getStatusBadge(
                              driver.status
                            )}`}
                          >
                            {driver.status || "UNKNOWN"}
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

      </div>
    </>
  );
}