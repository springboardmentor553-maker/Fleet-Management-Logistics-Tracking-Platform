import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";

import {
  FaTruck,
  FaUserTie,
  FaBoxOpen,
  FaCheckCircle,
  FaClock,
  FaShippingFast,
  FaClipboardList,
  FaRoute,
  FaTools,
  FaGasPump,
  FaUsers,
  FaArrowRight,
  FaSyncAlt,
} from "react-icons/fa";


function Dashboard() {

  const navigate = useNavigate();


  // =========================================================
  // DASHBOARD STATE
  // =========================================================

  const [stats, setStats] = useState({

    vehicles: 0,
    drivers: 0,
    shipments: 0,
    users: 0,

    available: 0,
    busy: 0,
    maintenance: 0,
    out_of_service: 0,

    pending_shipments: 0,
    transit: 0,
    delivered: 0,

    routes: 0,
    maintenance_records: 0,

    vehicle_status: {},
    driver_status: {},
    shipment_status: {},

  });


  // =========================================================
  // EXTRA DATA
  // =========================================================

  const [trips, setTrips] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);


  // =========================================================
  // AUDIT LOGS
  // =========================================================

  const [auditLogs, setAuditLogs] = useState([]);


  // =========================================================
  // LOADING
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  // =========================================================
  // USER NAME
  // =========================================================

  const [userName] = useState(() => {

    try {

      const raw =
        localStorage.getItem("user") ||
        localStorage.getItem("currentUser");

      const user =
        raw
          ? JSON.parse(raw)
          : {};

      return (
        user?.name ||
        user?.full_name ||
        user?.username ||
        "Test User"
      );

    } catch {

      return "Test User";

    }

  });


  // =========================================================
  // GREETING
  // =========================================================

  const greeting = useMemo(() => {

    const hour = new Date().getHours();

    if (hour < 12) {
      return "Good Morning";
    }

    if (hour < 17) {
      return "Good Afternoon";
    }

    return "Good Evening";

  }, []);


  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  useEffect(() => {

    loadDashboard();

  }, []);


  const loadDashboard = async () => {

    setRefreshing(true);

    await Promise.allSettled([

      fetchStats(),
      fetchTrips(),
      fetchFuelLogs(),
      fetchAuditLogs(),

    ]);

    setLoading(false);
    setRefreshing(false);

  };


  // =========================================================
  // FETCH DASHBOARD SUMMARY
  // =========================================================

  const fetchStats = async () => {

    try {

      const response =
        await api.get(
          "/dashboard/summary"
        );

      const data =
        response.data || {};


      setStats({

        vehicles:
          Number(data.vehicles ?? 0),

        drivers:
          Number(data.drivers ?? 0),

        shipments:
          Number(data.shipments ?? 0),

        users:
          Number(data.users ?? 0),


        available:
          Number(data.available ?? 0),

        busy:
          Number(data.busy ?? 0),

        maintenance:
          Number(data.maintenance ?? 0),

        out_of_service:
          Number(
            data.out_of_service ?? 0
          ),


        pending_shipments:
          Number(
            data.pending_shipments ?? 0
          ),

        transit:
          Number(data.transit ?? 0),

        delivered:
          Number(data.delivered ?? 0),


        routes:
          Number(data.routes ?? 0),

        maintenance_records:
          Number(
            data.maintenance_records ?? 0
          ),


        vehicle_status:
          data.vehicle_status || {},

        driver_status:
          data.driver_status || {},

        shipment_status:
          data.shipment_status || {},

      });

    } catch (error) {

      console.error(
        "Dashboard summary error:",
        error
      );

    }

  };


  // =========================================================
  // FETCH TRIPS
  // =========================================================

  const fetchTrips = async () => {

    try {

      const response =
        await api.get("/trips");

      setTrips(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {

      console.error(
        "Dashboard trips error:",
        error
      );

      setTrips([]);

    }

  };


  // =========================================================
  // FETCH FUEL
  // =========================================================

  const fetchFuelLogs = async () => {

    try {

      const response =
        await api.get("/fuel");

      setFuelLogs(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {

      console.error(
        "Dashboard fuel error:",
        error
      );

      setFuelLogs([]);

    }

  };


  // =========================================================
  // FETCH AUDIT LOGS
  // =========================================================

  const fetchAuditLogs = async () => {

    try {

      const response =
        await api.get(
          "/audit-logs/"
        );

      const logs =
        Array.isArray(response.data)
          ? response.data
          : [];

      setAuditLogs(
        logs.slice(0, 5)
      );

    } catch (error) {

      console.error(
        "Dashboard audit logs error:",
        error
      );

      setAuditLogs([]);

    }

  };


  // =========================================================
  // TRIP COUNTS
  // =========================================================

  const tripCounts = useMemo(() => {

    const counts = {

      total: trips.length,

      scheduled: 0,

      inTransit: 0,

      completed: 0,

    };


    trips.forEach((trip) => {

      const status =
        String(
          trip.trip_status || ""
        )
          .trim()
          .toLowerCase();


      if (
        status === "scheduled"
      ) {

        counts.scheduled++;

      }


      if (
        status === "in transit" ||
        status === "in_transit" ||
        status === "started"
      ) {

        counts.inTransit++;

      }


      if (
        status === "completed"
      ) {

        counts.completed++;

      }

    });


    return counts;

  }, [trips]);


  // =========================================================
  // PERCENTAGE
  // =========================================================

  const percentage = (
    value,
    total
  ) => {

    if (!total) {
      return 0;
    }

    return Math.round(
      (Number(value) / Number(total)) *
      100
    );

  };


  // =========================================================
  // FLEET DONUT
  // =========================================================

  const fleetDonutStyle = useMemo(() => {

    const total =
      Math.max(
        Number(stats.vehicles),
        0
      );


    if (!total) {

      return {

        background:
          "conic-gradient(#e5eaf1 0deg 360deg)",

      };

    }


    const available =
      (
        Number(stats.available) /
        total
      ) * 360;


    const busy =
      available +
      (
        Number(stats.busy) /
        total
      ) * 360;


    const maintenance =
      busy +
      (
        Number(stats.maintenance) /
        total
      ) * 360;


    return {

      background:
        `conic-gradient(
          #10b981 0deg ${available}deg,
          #2563eb ${available}deg ${busy}deg,
          #f59e0b ${busy}deg ${maintenance}deg,
          #ef4444 ${maintenance}deg 360deg
        )`,

    };

  }, [

    stats.vehicles,
    stats.available,
    stats.busy,
    stats.maintenance,

  ]);


  // =========================================================
  // AUDIT DATE
  // =========================================================

  const formatAuditDate = (date) => {

    if (!date) {
      return "-";
    }


    const parsed =
      new Date(date);


    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {

      return "-";

    }


    return parsed.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  };


  // =========================================================
  // AUDIT ACTION
  // =========================================================

  const getAuditAction = (log) => {

    return (
      log.action ||
      log.event ||
      log.activity ||
      log.message ||
      "System activity"
    );

  };


  // =========================================================
  // AUDIT USER
  // =========================================================

  const getAuditUser = (log) => {

    return (
      log.username ||
      log.email ||
      log.user_email ||
      "System"
    );

  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <div className="dashboard-loading">

        <div className="dashboard-spinner" />

        <p>
          Loading Dashboard...
        </p>

      </div>

    );

  }


  // =========================================================
  // MAIN UI
  // =========================================================

  return (

    <div className="dashboard-content">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="dashboard-header">

        <div>

          <h1>
            {greeting}, {userName}! 👋
          </h1>

          <p>
            Monitor your fleet, drivers and
            shipments in one place.
          </p>

        </div>


        <button
          type="button"
          className="dashboard-refresh-btn"
          onClick={loadDashboard}
          disabled={refreshing}
        >

          <FaSyncAlt
            className={
              refreshing
                ? "refresh-spinning"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}

        </button>

      </div>


      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <div className="dashboard-card-grid">


        {/* VEHICLES */}

        <div
          className="premium-card blue-card"
          onClick={() =>
            navigate("/vehicles")
          }
        >

          <div className="card-icon">
            <FaTruck />
          </div>

          <div className="card-watermark">
            <FaTruck />
          </div>

          <div className="card-title">
            Total Vehicles
          </div>

          <div className="card-number">
            {stats.vehicles}
          </div>

          <div className="card-growth">
            Registered vehicles
          </div>

        </div>


        {/* AVAILABLE */}

        <div
          className="premium-card purple-card"
          onClick={() =>
            navigate("/vehicles")
          }
        >

          <div className="card-icon">
            <FaCheckCircle />
          </div>

          <div className="card-watermark">
            <FaCheckCircle />
          </div>

          <div className="card-title">
            Available Vehicles
          </div>

          <div className="card-number">
            {stats.available}
          </div>

          <div className="card-growth">
            {percentage(
              stats.available,
              stats.vehicles
            )}% of fleet
          </div>

        </div>


        {/* DRIVERS */}

        <div
          className="premium-card green-card"
          onClick={() =>
            navigate("/drivers")
          }
        >

          <div className="card-icon">
            <FaUserTie />
          </div>

          <div className="card-watermark">
            <FaUserTie />
          </div>

          <div className="card-title">
            Total Drivers
          </div>

          <div className="card-number">
            {stats.drivers}
          </div>

          <div className="card-growth">
            Registered drivers
          </div>

        </div>


        {/* BUSY */}

        <div
          className="premium-card cyan-card"
          onClick={() =>
            navigate("/trips")
          }
        >

          <div className="card-icon">
            <FaShippingFast />
          </div>

          <div className="card-watermark">
            <FaShippingFast />
          </div>

          <div className="card-title">
            Busy Vehicles
          </div>

          <div className="card-number">
            {stats.busy}
          </div>

          <div className="card-growth">
            Currently assigned
          </div>

        </div>


        {/* SHIPMENTS */}

        <div
          className="premium-card yellow-card"
          onClick={() =>
            navigate("/shipments")
          }
        >

          <div className="card-icon">
            <FaBoxOpen />
          </div>

          <div className="card-watermark">
            <FaBoxOpen />
          </div>

          <div className="card-title">
            Total Shipments
          </div>

          <div className="card-number">
            {stats.shipments}
          </div>

          <div className="card-growth">
            All shipments
          </div>

        </div>


        {/* PENDING */}

        <div
          className="premium-card orange-card"
          onClick={() =>
            navigate("/shipments")
          }
        >

          <div className="card-icon">
            <FaClock />
          </div>

          <div className="card-watermark">
            <FaClock />
          </div>

          <div className="card-title">
            Pending Shipments
          </div>

          <div className="card-number">
            {stats.pending_shipments}
          </div>

          <div className="card-growth">
            Awaiting completion
          </div>

        </div>


        {/* DELIVERED */}

        <div
          className="premium-card red-card"
          onClick={() =>
            navigate("/shipments")
          }
        >

          <div className="card-icon">
            <FaCheckCircle />
          </div>

          <div className="card-watermark">
            <FaCheckCircle />
          </div>

          <div className="card-title">
            Delivered Shipments
          </div>

          <div className="card-number">
            {stats.delivered}
          </div>

          <div className="card-growth">
            Successfully delivered
          </div>

        </div>

      </div>


      {/* =====================================================
          OPERATIONS SUMMARY
      ===================================================== */}


      {/* =====================================================
          FLEET OVERVIEW + OPERATIONS STATUS
          REPLACES RECENT ACTIVITIES
      ===================================================== */}

      <div className="dashboard-bottom dashboard-bottom-two">


        {/* ===================================================
    FLEET DISTRIBUTION
=================================================== */}

<div className="dashboard-panel fleet-distribution-panel">

  <div className="fleet-distribution-header">

    <div>
      <h2>Fleet Distribution</h2>

      <p>
        Vehicles, drivers, shipments and trips
      </p>
    </div>

    <span className="fleet-distribution-live">
      <span></span>
      Live
    </span>

  </div>


  <div className="fleet-distribution-content">

    {/* ================= PIE CHART ================= */}

    <div className="fleet-pie-section">

      <div
        className="fleet-main-pie"
        style={{
          background: (() => {

            const vehicles =
              Number(stats.vehicles) || 0;

            const drivers =
              Number(stats.drivers) || 0;

            const shipments =
              Number(stats.shipments) || 0;

            const trips =
              Number(tripCounts?.total) || 0;

            const total =
              vehicles +
              drivers +
              shipments +
              trips;

            if (total === 0) {
              return "#e5e7eb";
            }

            const vehicleEnd =
              (vehicles / total) * 100;

            const driverEnd =
              vehicleEnd +
              (drivers / total) * 100;

            const shipmentEnd =
              driverEnd +
              (shipments / total) * 100;

            return `
              conic-gradient(
                #2563eb 0% ${vehicleEnd}%,
                #10b981 ${vehicleEnd}% ${driverEnd}%,
                #f59e0b ${driverEnd}% ${shipmentEnd}%,
                #8b5cf6 ${shipmentEnd}% 100%
              )
            `;

          })()
        }}
      >

        {/* WHITE CENTER */}

        <div className="fleet-pie-hole">

          <span>
            Total Assets
          </span>

          <strong>
            {
              (Number(stats.vehicles) || 0) +
              (Number(stats.drivers) || 0) +
              (Number(stats.shipments) || 0) +
              (Number(tripCounts?.total) || 0)
            }
          </strong>

        </div>

      </div>

    </div>


    {/* ================= LEGEND ================= */}

    <div className="fleet-distribution-legend">


      {/* VEHICLES */}

      <div className="fleet-distribution-item">

        <div className="fleet-distribution-label">

          <span className="distribution-dot vehicles"></span>

          <span>Vehicles</span>

        </div>

        <div className="fleet-distribution-value">

          <strong>
            {stats.vehicles || 0}
          </strong>

          <small>
            {
              percentage(
                stats.vehicles || 0,
                (
                  Number(stats.vehicles) +
                  Number(stats.drivers) +
                  Number(stats.shipments) +
                  Number(tripCounts?.total || 0)
                )
              )
            }%
          </small>

        </div>

      </div>


      {/* DRIVERS */}

      <div className="fleet-distribution-item">

        <div className="fleet-distribution-label">

          <span className="distribution-dot drivers"></span>

          <span>Drivers</span>

        </div>

        <div className="fleet-distribution-value">

          <strong>
            {stats.drivers || 0}
          </strong>

          <small>
            {
              percentage(
                stats.drivers || 0,
                (
                  Number(stats.vehicles) +
                  Number(stats.drivers) +
                  Number(stats.shipments) +
                  Number(tripCounts?.total || 0)
                )
              )
            }%
          </small>

        </div>

      </div>


      {/* SHIPMENTS */}

      <div className="fleet-distribution-item">

        <div className="fleet-distribution-label">

          <span className="distribution-dot shipments"></span>

          <span>Shipments</span>

        </div>

        <div className="fleet-distribution-value">

          <strong>
            {stats.shipments || 0}
          </strong>

          <small>
            {
              percentage(
                stats.shipments || 0,
                (
                  Number(stats.vehicles) +
                  Number(stats.drivers) +
                  Number(stats.shipments) +
                  Number(tripCounts?.total || 0)
                )
              )
            }%
          </small>

        </div>

      </div>


      {/* TRIPS */}

      <div className="fleet-distribution-item">

        <div className="fleet-distribution-label">

          <span className="distribution-dot trips"></span>

          <span>Trips</span>

        </div>

        <div className="fleet-distribution-value">

          <strong>
            {tripCounts?.total || 0}
          </strong>

          <small>
            {
              percentage(
                tripCounts?.total || 0,
                (
                  Number(stats.vehicles) +
                  Number(stats.drivers) +
                  Number(stats.shipments) +
                  Number(tripCounts?.total || 0)
                )
              )
            }%
          </small>

        </div>

      </div>

    </div>

  </div>

</div>
        

        {/* ===================================================
            OPERATIONS STATUS
            THIS REPLACES RECENT ACTIVITIES
        =================================================== */}

        <div className="dashboard-panel operations-panel">

          <div className="panel-header">

            <div>

              <h2>
                Operations Status
              </h2>

              <p className="panel-subtitle">
                Current shipment and trip activity
              </p>

            </div>


            <button
              type="button"
              className="view-all-btn"
              onClick={() =>
                navigate("/reports")
              }
            >
              View All
            </button>

          </div>


          <div className="operations-status-list">


            {/* SHIPMENTS */}

            <div className="operation-status-card">

              <div className="operation-status-icon shipment-status-icon">

                <FaBoxOpen />

              </div>


              <div className="operation-status-main">

                <span>
                  Shipments
                </span>

                <strong>
                  {stats.shipments}
                </strong>

              </div>


              <div className="operation-status-values">

                <span className="status-pending">

                  Pending

                  <b>
                    {stats.pending_shipments}
                  </b>

                </span>


                <span className="status-transit">

                  In Transit

                  <b>
                    {stats.transit}
                  </b>

                </span>


                <span className="status-delivered">

                  Delivered

                  <b>
                    {stats.delivered}
                  </b>

                </span>

              </div>

            </div>


            {/* TRIPS */}

            <div className="operation-status-card">

              <div className="operation-status-icon trip-status-icon">

                <FaRoute />

              </div>


              <div className="operation-status-main">

                <span>
                  Trips
                </span>

                <strong>
                  {tripCounts.total}
                </strong>

              </div>


              <div className="operation-status-values">

                <span>

                  Scheduled

                  <b>
                    {tripCounts.scheduled}
                  </b>

                </span>


                <span className="status-transit">

                  In Transit

                  <b>
                    {tripCounts.inTransit}
                  </b>

                </span>


                <span className="status-delivered">

                  Completed

                  <b>
                    {tripCounts.completed}
                  </b>

                </span>

              </div>

            </div>


            {/* DRIVERS */}

            <div className="operation-status-card">

              <div className="operation-status-icon driver-status-icon">

                <FaUserTie />

              </div>


              <div className="operation-status-main">

                <span>
                  Drivers
                </span>

                <strong>
                  {stats.drivers}
                </strong>

              </div>


              <div className="operation-status-values">

                <span>

                  Available

                  <b>
                    {stats.available}
                  </b>

                </span>


                <span className="status-transit">

                  Busy

                  <b>
                    {stats.busy}
                  </b>

                </span>


                <span className="status-delivered">

                  Other

                  <b>
                    {Math.max(
                      0,
                      stats.drivers -
                      stats.available -
                      stats.busy
                    )}
                  </b>

                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          QUICK ACCESS
      ===================================================== */}


        <div className="dashboard-shortcuts">


        <button
          type="button"
          className="dashboard-shortcut"
          onClick={() =>
            navigate("/trips")
          }
        >

          <span className="shortcut-icon shortcut-purple">
            <FaRoute />
          </span>

          <span className="shortcut-text">

            <strong>
              Trips
            </strong>

            <span>
              View trips and routes
            </span>

          </span>

          <FaArrowRight />

        </button>


        <button
          type="button"
          className="dashboard-shortcut"
          onClick={() =>
            navigate("/maintenance")
          }
        >

          <span className="shortcut-icon shortcut-blue">
            <FaTools />
          </span>

          <span className="shortcut-text">

            <strong>
              Maintenance
            </strong>

            <span>
              Manage maintenance
            </span>

          </span>

          <FaArrowRight />

        </button>


        <button
          type="button"
          className="dashboard-shortcut"
          onClick={() =>
            navigate("/fuel")
          }
        >

          <span className="shortcut-icon shortcut-green">
            <FaGasPump />
          </span>

          <span className="shortcut-text">

            <strong>
              Fuel Logs
            </strong>

            <span>
              {fuelLogs.length} records
            </span>

          </span>

          <FaArrowRight />

        </button>


        <button
          type="button"
          className="dashboard-shortcut"
          onClick={() =>
            navigate("/users")
          }
        >

          <span className="shortcut-icon shortcut-cyan">
            <FaUsers />
          </span>

          <span className="shortcut-text">

            <strong>
              Users
            </strong>

            <span>
              Manage system users
            </span>

          </span>

          <FaArrowRight />

        </button>


        <button
          type="button"
          className="dashboard-shortcut"
          onClick={() =>
            navigate("/reports")
          }
        >

          <span className="shortcut-icon shortcut-orange">
            <FaClipboardList />
          </span>

          <span className="shortcut-text">

            <strong>
              Reports
            </strong>

            <span>
              View analytics reports
            </span>

          </span>

          <FaArrowRight />

        </button>

      </div>



      {/* =====================================================
          AUDIT ACTIVITY
      ===================================================== */}

      <div className="dashboard-panel audit-dashboard-panel">

        <div className="panel-header">

          <div className="audit-title">

            <div className="audit-title-icon">

              <FaClipboardList />

            </div>


            <div>

              <h2>
                Recent Audit Activity
              </h2>

              <p>
                Latest user authentication activity
              </p>

            </div>

          </div>


          <button
            type="button"
            className="view-all-btn"
            onClick={() =>
              navigate("/audit-logs")
            }
          >
            View All
          </button>

        </div>


        <div className="audit-list">

          {auditLogs.length === 0 ? (

            <div className="audit-empty">
              No audit activity available.
            </div>

          ) : (

            auditLogs.map((log) => (

              <div
                className="audit-row"
                key={log.id}
              >

                <div
                  className={
                    log.status === "Success"
                      ? "audit-status-icon audit-success"
                      : "audit-status-icon audit-failed"
                  }
                >

                  {log.status === "Success"
                    ? <FaCheckCircle />
                    : <FaClock />}

                </div>


                <div className="audit-main">

                  <strong>
                    {getAuditAction(log)}
                  </strong>

                  <span>
                    {getAuditUser(log)}
                  </span>

                </div>


                <div className="audit-time">

                  {formatAuditDate(
                    log.created_at ||
                    log.timestamp ||
                    log.date
                  )}

                </div>

              </div>

            ))

          )}

        </div>

      </div>

      


    </div>

  );

}


export default Dashboard;