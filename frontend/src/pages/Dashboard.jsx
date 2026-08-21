import { useEffect, useState } from "react";

import {
  FaTruck,
  FaUserTie,
  FaRoute,
  FaCheckCircle,
  FaTools,
  FaBox,
} from "react-icons/fa";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { getDashboard } from "../services/dashboardService";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // LOAD DASHBOARD + AUTO REFRESH
  // --------------------------------------------------
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setError("");

        const dashboardData = await getDashboard();

        setStats(dashboardData);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.detail ||
            "Failed to load fleet dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();

    // Refresh dashboard every 10 seconds
    const interval = setInterval(() => {
      loadDashboard();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-full bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-lg font-medium">
          Loading fleet dashboard...
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------
  if (error) {
    return (
      <div className="min-h-full bg-slate-950 text-slate-100 p-6">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // --------------------------------------------------
  // FLEET UTILIZATION
  // --------------------------------------------------
  const utilization =
    stats.totalVehicles > 0
      ? (
          (stats.activeVehicles / stats.totalVehicles) *
          100
        ).toFixed(1)
      : 0;

  // --------------------------------------------------
  // WORKFLOW SUMMARY
  // --------------------------------------------------
  const workflowData = [
    {
      category: "Vehicles",
      total: stats.totalVehicles,
      active: stats.activeVehicles,
    },
    {
      category: "Drivers",
      total: stats.totalDrivers,
      active: stats.availableDrivers,
    },
    {
      category: "Trips",
      total: stats.totalTrips,
      active: stats.completedTrips,
    },
    {
      category: "Shipments",
      total: stats.activeShipments,
      active: stats.activeShipments,
    },
  ];

  // --------------------------------------------------
  // SAFE CHART DATA
  // --------------------------------------------------
  const monthlyShipments = stats.monthlyShipments || [];

  const vehiclePerformance = stats.vehiclePerformance || [];

  const driverPerformance = stats.driverPerformance || [];

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-6">

      {/* ==================================================
          HEADER
      ================================================== */}
      <div className="mb-8">

        <h1 className="text-3xl font-bold text-white">
          Fleet Operations Dashboard
        </h1>

        <p className="text-slate-400 mt-2">
          Current overview of fleet, drivers, trips and shipments.
        </p>

      </div>


      {/* ==================================================
          VEHICLE METRICS
      ================================================== */}
      <div className="mb-8">

        <div className="mb-4">

          <h2 className="text-lg font-semibold text-white">
            Fleet Overview
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Current vehicle availability and maintenance status
          </p>

        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

          {/* TOTAL VEHICLES */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Total Vehicles
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {stats.totalVehicles}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Registered in fleet
                </p>

              </div>

              <div className="w-11 h-11 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <FaTruck />
              </div>

            </div>

          </div>


          {/* ACTIVE VEHICLES */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Active Vehicles
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {stats.activeVehicles}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Currently operational
                </p>

              </div>

              <div className="w-11 h-11 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FaCheckCircle />
              </div>

            </div>

          </div>


          {/* MAINTENANCE */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Vehicles Under Maintenance
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {stats.vehiclesUnderMaintenance}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Currently unavailable
                </p>

              </div>

              <div className="w-11 h-11 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                <FaTools />
              </div>

            </div>

          </div>

        </div>

      </div>


      {/* ==================================================
          DRIVER METRICS
      ================================================== */}
      <div className="mb-8">

        <div className="mb-4">

          <h2 className="text-lg font-semibold text-white">
            Driver Overview
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Current driver availability and assignments
          </p>

        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

          {/* TOTAL DRIVERS */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Total Drivers
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {stats.totalDrivers}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Registered drivers
                </p>

              </div>

              <div className="w-11 h-11 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <FaUserTie />
              </div>

            </div>

          </div>


          {/* AVAILABLE DRIVERS */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Available Drivers
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {stats.availableDrivers}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Ready for assignment
                </p>

              </div>

              <div className="w-11 h-11 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FaCheckCircle />
              </div>

            </div>

          </div>


          {/* ASSIGNED DRIVERS */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Assigned Drivers
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {stats.assignedDrivers}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Currently assigned
                </p>

              </div>

              <div className="w-11 h-11 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <FaUserTie />
              </div>

            </div>

          </div>

        </div>

      </div>


      {/* ==================================================
          TRIP + SHIPMENT METRICS
      ================================================== */}
      <div className="mb-8">

        <div className="mb-4">

          <h2 className="text-lg font-semibold text-white">
            Operations Overview
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Current trip and shipment activity
          </p>

        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

          {/* TOTAL TRIPS */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Total Trips
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {stats.totalTrips}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  All recorded trips
                </p>

              </div>

              <div className="w-11 h-11 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <FaRoute />
              </div>

            </div>

          </div>


          {/* COMPLETED TRIPS */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Completed Trips
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {stats.completedTrips}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Successfully completed
                </p>

              </div>

              <div className="w-11 h-11 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FaCheckCircle />
              </div>

            </div>

          </div>


          {/* ACTIVE SHIPMENTS */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Active Shipments
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {stats.activeShipments}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Currently in operation
                </p>

              </div>

              <div className="w-11 h-11 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <FaBox />
              </div>

            </div>

          </div>

        </div>

      </div>


      {/* ==================================================
          FLEET UTILIZATION
      ================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

        <div className="flex items-center justify-between mb-5">

          <div>

            <h2 className="text-lg font-semibold text-white">
              Fleet Utilization
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Active vehicles as a percentage of the total fleet
            </p>

          </div>

          <span className="text-2xl font-bold text-white">
            {utilization}%
          </span>

        </div>


        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">

          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{
              width: `${utilization}%`,
            }}
          />

        </div>


        <div className="flex justify-between mt-3 text-xs text-slate-500">

          <span>
            {stats.activeVehicles} active
          </span>

          <span>
            {stats.totalVehicles} total
          </span>

        </div>

      </div>


      {/* ==================================================
          DASHBOARD ANALYTICS
      ================================================== */}
      <div className="mt-8">

        <div className="mb-4">

          <h2 className="text-lg font-semibold text-white">
            Operations Analytics
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Visual summary of fleet operations and performance
          </p>

        </div>


        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* ==================================================
              WORKFLOW SUMMARY
          ================================================== */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

            <h3 className="text-base font-semibold text-white mb-1">
              Workflow Summary
            </h3>

            <p className="text-sm text-slate-500 mb-6">
              Overall operational activity
            </p>


            <div className="h-80">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={workflowData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 5,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                  />

                  <XAxis
                    dataKey="category"
                    stroke="#94a3b8"
                  />

                  <YAxis
                    stroke="#94a3b8"
                    allowDecimals={false}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />

                  <Legend />

                  <Bar
                    dataKey="total"
                    name="Total"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                  />

                  <Bar
                    dataKey="active"
                    name="Active / Completed"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>


          {/* ==================================================
              MONTHLY SHIPMENTS
          ================================================== */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

            <h3 className="text-base font-semibold text-white mb-1">
              Monthly Shipments
            </h3>

            <p className="text-sm text-slate-500 mb-6">
              Shipment activity over time
            </p>


            <div className="h-80">

              {monthlyShipments.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={monthlyShipments}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 5,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#334155"
                    />

                    <XAxis
                      dataKey="month"
                      stroke="#94a3b8"
                    />

                    <YAxis
                      stroke="#94a3b8"
                      allowDecimals={false}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />

                    <Bar
                      dataKey="shipments"
                      name="Shipments"
                      fill="#06b6d4"
                      radius={[6, 6, 0, 0]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              ) : (

                <div className="h-full flex items-center justify-center text-slate-500">
                  No shipment data available yet.
                </div>

              )}

            </div>

          </div>


          {/* ==================================================
              VEHICLE PERFORMANCE
          ================================================== */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

            <h3 className="text-base font-semibold text-white mb-1">
              Vehicle Performance
            </h3>

            <p className="text-sm text-slate-500 mb-6">
              Completed trips by vehicle
            </p>


            <div className="h-80">

              {vehiclePerformance.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={vehiclePerformance}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 5,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#334155"
                    />

                    <XAxis
                      dataKey="vehicle"
                      stroke="#94a3b8"
                    />

                    <YAxis
                      stroke="#94a3b8"
                      allowDecimals={false}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />

                    <Bar
                      dataKey="completedTrips"
                      name="Completed Trips"
                      fill="#8b5cf6"
                      radius={[6, 6, 0, 0]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              ) : (

                <div className="h-full flex items-center justify-center text-slate-500 text-center px-4">
                  No completed trip data available yet.
                  <br />
                  Complete a trip to see vehicle performance.
                </div>

              )}

            </div>

          </div>


          {/* ==================================================
              DRIVER PERFORMANCE
          ================================================== */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

            <h3 className="text-base font-semibold text-white mb-1">
              Driver Performance
            </h3>

            <p className="text-sm text-slate-500 mb-6">
              Completed trips by driver
            </p>


            <div className="h-80">

              {driverPerformance.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={driverPerformance}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 5,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#334155"
                    />

                    <XAxis
                      dataKey="driver"
                      stroke="#94a3b8"
                    />

                    <YAxis
                      stroke="#94a3b8"
                      allowDecimals={false}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />

                    <Bar
                      dataKey="completedTrips"
                      name="Completed Trips"
                      fill="#f59e0b"
                      radius={[6, 6, 0, 0]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              ) : (

                <div className="h-full flex items-center justify-center text-slate-500 text-center px-4">
                  No completed trip data available yet.
                  <br />
                  Complete a trip to see driver performance.
                </div>

              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;