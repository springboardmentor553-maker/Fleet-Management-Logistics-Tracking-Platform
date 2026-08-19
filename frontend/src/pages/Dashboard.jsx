import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function Dashboard() {
  // ==============================
  // STATES
  // ==============================

  const [dashboard, setDashboard] = useState({
    total_vehicles: 0,
    active_vehicles: 0,
    vehicles_under_maintenance: 0,

    total_drivers: 0,
    available_drivers: 0,
    assigned_drivers: 0,

    total_trips: 0,
    completed_trips: 0,

    active_shipments: 0,

    recent_trips: [],
  });

  const [analytics, setAnalytics] = useState({
    total_deliveries: 0,
    successful_deliveries: 0,
    delayed_deliveries: 0,
    cancelled_deliveries: 0,
    average_trip_distance: 0,
    average_delivery_time_hours: 0,
  });

  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);

  const [loading, setLoading] = useState(true);

  // ==============================
  // LOAD DASHBOARD DATA
  // ==============================

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // Fleet overview
      const dashboardResponse = await api.get(
        "/dashboard/fleet"
      );

      setDashboard(dashboardResponse.data);

      // Operations analytics
      const role = localStorage
        .getItem("role")
        ?.toLowerCase();

      if (
        role === "administrator" ||
        role === "fleet_manager" ||
        role === "dispatcher"
      ) {
        try {
          const analyticsResponse = await api.get(
            "/dashboard/analytics/operations"
          );

          setAnalytics(analyticsResponse.data);
        } catch (err) {
          console.log(
            "Operations Analytics Error:",
            err
          );
        }
      }

      // Maintenance alerts
      try {
        const alertsResponse = await api.get(
          "/maintenance-alerts/"
        );

        setMaintenanceAlerts(
          Array.isArray(alertsResponse.data)
            ? alertsResponse.data
            : []
        );
      } catch (err) {
        console.log(
          "Maintenance Alerts Error:",
          err
        );

        setMaintenanceAlerts([]);
      }
    } catch (err) {
      console.log(
        "Dashboard Error:",
        err
      );
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // REFRESH
  // ==============================

  const handleRefresh = () => {
    loadDashboard();
  };

  // ==============================
  // DATA
  // ==============================

  const recentTrips =
    dashboard.recent_trips || [];

  const recentAlerts =
    maintenanceAlerts.slice(0, 5);

  // ==============================
  // RENDER
  // ==============================

  return (
    <Layout>

      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">

        <div>

          <p className="text-teal-300/70 text-sm font-medium mb-2">
            FleetFlow • Operations Center
          </p>

          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
            FleetFlow Dashboard
          </h1>

          <p className="text-teal-100/60 mt-2 text-lg">
            Manage your fleet and logistics with ease.
          </p>

        </div>

        <button
          onClick={handleRefresh}
          className="w-fit bg-teal-500/10 hover:bg-teal-400/20 border border-teal-400/30 text-teal-300 px-5 py-3 rounded-xl transition-all duration-200"
        >
          ↻ Refresh
        </button>

      </div>


      {/* ========================================= */}
      {/* FLEET SNAPSHOT */}
      {/* ========================================= */}

      <section className="mb-12">

        <h2 className="text-2xl font-bold text-white mb-6">
          Fleet Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* ACTIVE VEHICLES */}

          <DashboardCard
            title="Active Vehicles"
            value={dashboard.active_vehicles}
            icon="🚛"
            highlight
          />

          {/* TOTAL VEHICLES */}

          <DashboardCard
            title="Fleet Vehicles"
            value={dashboard.total_vehicles}
            icon="🚚"
          />

          {/* MAINTENANCE */}

          <DashboardCard
            title="Under Maintenance"
            value={
              dashboard.vehicles_under_maintenance
            }
            icon="🛠️"
            danger
          />

          {/* AVAILABLE DRIVERS */}

          <DashboardCard
            title="Available Drivers"
            value={dashboard.available_drivers}
            icon="👤"
            highlight
          />

          {/* TOTAL DRIVERS */}

          <DashboardCard
            title="Total Drivers"
            value={dashboard.total_drivers}
            icon="🧑‍✈️"
          />

          {/* ASSIGNED DRIVERS */}

          <DashboardCard
            title="Assigned Drivers"
            value={dashboard.assigned_drivers}
            icon="📋"
          />

          {/* ACTIVE SHIPMENTS */}

          <DashboardCard
            title="Active Shipments"
            value={dashboard.active_shipments}
            icon="📦"
            highlight
          />

          {/* COMPLETED TRIPS */}

          <DashboardCard
            title="Completed Trips"
            value={dashboard.completed_trips}
            icon="✓"
            highlight
          />

          {/* TOTAL TRIPS */}

          <DashboardCard
            title="Total Trips"
            value={dashboard.total_trips}
            icon="🛣️"
          />

        </div>

      </section>


      {/* ========================================= */}
      {/* FLEET STATUS */}
      {/* ========================================= */}

      <section className="mb-12">

        <h2 className="text-2xl font-bold text-white mb-6">
          Fleet Status
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* VEHICLE STATUS */}

          <div className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl p-6 shadow-xl hover:border-teal-400/30 transition">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h3 className="text-xl font-bold text-white">
                  Vehicle Availability
                </h3>

                <p className="text-teal-200/50 text-sm mt-1">
                  Current vehicle distribution
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-400/20 flex items-center justify-center text-xl">
                🚚
              </div>

            </div>

            <div className="space-y-5">

              <StatusBar
                label="Active"
                value={dashboard.active_vehicles}
                total={dashboard.total_vehicles}
              />

              <StatusBar
                label="Available"
                value={Math.max(
                  dashboard.total_vehicles -
                    dashboard.active_vehicles -
                    dashboard.vehicles_under_maintenance,
                  0
                )}
                total={dashboard.total_vehicles}
              />

              <StatusBar
                label="Maintenance"
                value={
                  dashboard.vehicles_under_maintenance
                }
                total={dashboard.total_vehicles}
                warning
              />

            </div>

          </div>


          {/* DRIVER STATUS */}

          <div className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl p-6 shadow-xl hover:border-teal-400/30 transition">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h3 className="text-xl font-bold text-white">
                  Driver Availability
                </h3>

                <p className="text-teal-200/50 text-sm mt-1">
                  Current driver assignments
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-400/20 flex items-center justify-center text-xl">
                👥
              </div>

            </div>

            <div className="space-y-5">

              <StatusBar
                label="Available"
                value={dashboard.available_drivers}
                total={dashboard.total_drivers}
              />

              <StatusBar
                label="Assigned"
                value={dashboard.assigned_drivers}
                total={dashboard.total_drivers}
              />

            </div>

          </div>

        </div>

      </section>


      {/* ========================================= */}
      {/* OPERATIONS */}
      {/* ========================================= */}

      <section className="mb-12">

        <h2 className="text-2xl font-bold text-white mb-6">
          Operations Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          <DashboardCard
            title="Successful Deliveries"
            value={
              analytics.successful_deliveries
            }
            icon="✓"
            highlight
          />

          <DashboardCard
            title="Total Deliveries"
            value={
              analytics.total_deliveries
            }
            icon="📦"
          />

          <DashboardCard
            title="Delayed Deliveries"
            value={
              analytics.delayed_deliveries
            }
            icon="⏳"
            danger
          />

          <DashboardCard
            title="Cancelled Deliveries"
            value={
              analytics.cancelled_deliveries
            }
            icon="×"
            danger
          />

          <DashboardCard
            title="Average Trip Distance"
            value={`${Number(
              analytics.average_trip_distance || 0
            ).toFixed(2)} km`}
            icon="📍"
            highlight
          />

          <DashboardCard
            title="Average Delivery Time"
            value={`${Number(
              analytics.average_delivery_time_hours || 0
            ).toFixed(2)} hrs`}
            icon="⏱️"
          />

        </div>

      </section>
      {/* ========================================= */}
      {/* LIVE OPERATIONS */}
      {/* ========================================= */}

      <section className="mb-12">

        <h2 className="text-2xl font-bold text-white mb-6">
          Live Operations
        </h2>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* ===================================== */}
          {/* RECENT TRIPS */}
          {/* ===================================== */}

          <div className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl p-6 shadow-xl hover:border-teal-400/30 transition">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2 className="text-2xl font-bold text-white">
                  Recent Trips
                </h2>

                <p className="text-teal-200/50 mt-1">
                  Latest fleet activity
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-400/20 flex items-center justify-center text-xl">
                🛣️
              </div>

            </div>

            {recentTrips.length === 0 ? (

              <div className="text-center py-10">

                <div className="text-4xl mb-3">
                  🛣️
                </div>

                <p className="text-teal-200/50">
                  No recent trips found
                </p>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead>

                    <tr className="bg-teal-700 text-white">

                      <th className="p-3 text-left">
                        Trip
                      </th>

                      <th className="p-3 text-left">
                        Driver
                      </th>

                      <th className="p-3 text-left">
                        Vehicle
                      </th>

                      <th className="p-3 text-left">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {recentTrips
                      .slice(0, 5)
                      .map((trip) => (

                        <tr
                          key={
                            trip.trip_id ||
                            trip.id
                          }
                          className="border-b border-teal-900/60 hover:bg-teal-500/10 transition"
                        >

                          <td className="p-4 text-white">
                            {trip.trip_id ||
                              trip.id ||
                              "-"}
                          </td>

                          <td className="p-4 text-teal-100/70">
                            {trip.driver_id ||
                              "-"}
                          </td>

                          <td className="p-4 text-teal-100/70">
                            {trip.vehicle_id ||
                              "-"}
                          </td>

                          <td className="p-4">

                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-400/30">

                              {trip.status ||
                                trip.trip_status ||
                                "Unknown"}

                            </span>

                          </td>

                        </tr>

                      ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>


          {/* ===================================== */}
          {/* MAINTENANCE ALERTS */}
          {/* ===================================== */}

          <div className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl p-6 shadow-xl hover:border-teal-400/30 transition">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2 className="text-2xl font-bold text-white">
                  Maintenance Alerts
                </h2>

                <p className="text-teal-200/50 mt-1">
                  Recent vehicle service updates
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-400/20 flex items-center justify-center text-2xl">
                🔔
              </div>

            </div>


            {recentAlerts.length === 0 ? (

              <div className="text-center py-10">

                <div className="text-4xl mb-3">
                  ✓
                </div>

                <p className="text-teal-100/70">
                  No maintenance alerts
                </p>

              </div>

            ) : (

              <div className="space-y-4">

                {recentAlerts.map((alert) => {

                  const status =
                    alert.alert_status?.toLowerCase();

                  const isResolved =
                    status === "resolved" ||
                    status === "completed";

                  return (

                    <div
                      key={alert.alert_id}
                      className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${
                        isResolved
                          ? "bg-teal-500/10 border-teal-400/20"
                          : "bg-amber-500/10 border-amber-400/20"
                      }`}
                    >

                      <div>

                        <h3 className="text-white font-semibold">
                          Vehicle{" "}
                          {alert.vehicle_id}
                        </h3>

                        <p className="text-teal-100/70 text-sm mt-1">
                          {alert.alert_type ||
                            "Vehicle service attention required"}
                        </p>

                        <p className="text-teal-200/50 text-sm mt-1">
                          Maintenance #
                          {alert.maintenance_id ||
                            "-"}
                        </p>

                      </div>


                      <span
                        className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${
                          isResolved
                            ? "bg-teal-500/10 text-teal-300 border-teal-400/30"
                            : "bg-amber-500/10 text-amber-300 border-amber-400/30"
                        }`}
                      >
                        {alert.alert_status ||
                          "Pending"}
                      </span>

                    </div>

                  );
                })}

              </div>

            )}

          </div>

        </div>

      </section>


      {/* ========================================= */}
      {/* LOADING */}
      {/* ========================================= */}

      {loading && (

        <div className="fixed bottom-5 right-5 bg-[#062126] border border-teal-900/60 px-5 py-3 rounded-xl shadow-xl">

          <p className="text-teal-300 text-sm">
            Loading dashboard...
          </p>

        </div>

      )}

    </Layout>
  );
}


/* ================================================= */
/* DASHBOARD CARD */
/* ================================================= */

function DashboardCard({
  title,
  value,
  icon,
  highlight = false,
  danger = false,
}) {

  return (

    <div
      className={`bg-[#062126]/80 backdrop-blur-xl border rounded-2xl p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:bg-[#0a2b30] ${
        highlight
          ? "border-teal-400/40"
          : danger
          ? "border-rose-400/30"
          : "border-teal-900/60"
      }`}
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-teal-100/70 text-lg">
            {title}
          </p>

          <p
            className={`text-4xl font-extrabold mt-4 ${
              highlight
                ? "text-teal-300"
                : danger
                ? "text-rose-300"
                : "text-white"
            }`}
          >
            {value}
          </p>

        </div>


        <div className="w-16 h-16 rounded-xl bg-[#0a2b30] border border-teal-900/60 flex items-center justify-center text-3xl">
          {icon}
        </div>

      </div>

    </div>

  );
}


/* ================================================= */
/* STATUS BAR */
/* ================================================= */

function StatusBar({
  label,
  value,
  total,
  warning = false,
}) {

  const percentage =
    total > 0
      ? Math.min(
          (value / total) * 100,
          100
        )
      : 0;

  return (

    <div>

      <div className="flex items-center justify-between mb-2">

        <span className="text-teal-50/80">
          {label}
        </span>

        <span className="text-white font-semibold">
          {value}
        </span>

      </div>


      <div className="w-full h-3 bg-[#0a2b30] rounded-full overflow-hidden">

        <div
          className={
            warning
              ? "h-full bg-gradient-to-r from-amber-400 to-orange-300 rounded-full transition-all duration-500"
              : "h-full bg-gradient-to-r from-teal-400 to-cyan-300 rounded-full transition-all duration-500"
          }
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>

  );
}


export default Dashboard;