import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import {
  Bar,
  Pie,
} from "react-chartjs-2";

import {
  useEffect,
  useState,
} from "react";

import api from "../api/api";

import {
  FaChartPie,
  FaTruck,
  FaUserTie,
  FaBoxOpen,
  FaRoute,
  FaTools,
  FaGasPump,
  FaArrowUp,
} from "react-icons/fa";


// =========================================================
// CHART.JS REGISTRATION
// =========================================================

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);


// =========================================================
// ANALYTICS PAGE
// =========================================================

function Analytics() {

  // =======================================================
  // STATE
  // =======================================================

  const [analytics, setAnalytics] =
    useState({

      total_vehicles: 0,

      total_drivers: 0,

      total_shipments: 0,

      total_trips: 0,

      total_maintenance: 0,

      total_fuel_logs: 0,

    });


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState("");


  // =======================================================
  // FETCH ANALYTICS
  // =======================================================

  useEffect(() => {

    fetchAnalytics();

  }, []);


  const fetchAnalytics = async () => {

    try {

      setLoading(true);

      setError("");


      const response =
        await api.get(
          "/analytics/dashboard"
        );


      console.log(
        "Analytics API Response:",
        response.data
      );


      setAnalytics({

        total_vehicles:
          Number(
            response.data?.total_vehicles || 0
          ),

        total_drivers:
          Number(
            response.data?.total_drivers || 0
          ),

        total_shipments:
          Number(
            response.data?.total_shipments || 0
          ),

        total_trips:
          Number(
            response.data?.total_trips || 0
          ),

        total_maintenance:
          Number(
            response.data?.total_maintenance || 0
          ),

        total_fuel_logs:
          Number(
            response.data?.total_fuel_logs || 0
          ),

      });


    } catch (err) {

      console.error(
        "Error fetching analytics:",
        err
      );


      setError(
        err.response?.data?.detail ||
        "Unable to load analytics data."
      );


    } finally {

      setLoading(false);

    }

  };


  // =======================================================
  // LOADING SCREEN
  // =======================================================

  if (loading) {

    return (

      <div
        className="container-fluid d-flex align-items-center justify-content-center"
        style={{
          minHeight: "70vh",
        }}
      >

        <div
          className="text-center"
        >

          <div
            className="spinner-border text-primary"
            role="status"
          />

          <p
            className="text-muted mt-3 mb-0"
          >
            Loading Analytics...
          </p>

        </div>

      </div>

    );

  }


  // =======================================================
  // BAR CHART DATA
  // =======================================================

  const barData = {

    labels: [
      "Vehicles",
      "Drivers",
      "Shipments",
      "Trips",
      "Maintenance",
      "Fuel Logs",
    ],


    datasets: [

      {

        label:
          "Fleet Overview",


        data: [

          analytics.total_vehicles,

          analytics.total_drivers,

          analytics.total_shipments,

          analytics.total_trips,

          analytics.total_maintenance,

          analytics.total_fuel_logs,

        ],


        backgroundColor: [

          "#2563EB",

          "#10B981",

          "#F59E0B",

          "#8B5CF6",

          "#EF4444",

          "#F97316",

        ],


        borderRadius: 8,

        borderSkipped: false,

      },

    ],

  };


  // =======================================================
  // PIE CHART DATA
  // =======================================================

  const pieData = {

    labels: [

      "Vehicles",

      "Drivers",

      "Shipments",

      "Trips",

    ],


    datasets: [

      {

        data: [

          analytics.total_vehicles,

          analytics.total_drivers,

          analytics.total_shipments,

          analytics.total_trips,

        ],


        backgroundColor: [

          "#2563EB",

          "#10B981",

          "#F59E0B",

          "#8B5CF6",

        ],


        borderColor:
          "#ffffff",


        borderWidth: 3,


        hoverOffset: 8,

      },

    ],

  };


  // =======================================================
  // BAR CHART OPTIONS
  // =======================================================

  const barOptions = {

    responsive: true,

    maintainAspectRatio: false,


    plugins: {

      legend: {

        display: true,

        position: "top",


        labels: {

          usePointStyle: true,

          padding: 20,

        },

      },


      tooltip: {

        backgroundColor:
          "#0F172A",

        titleColor:
          "#ffffff",

        bodyColor:
          "#ffffff",

        padding: 12,

        cornerRadius: 8,

      },

    },


    scales: {

      x: {

        grid: {

          display: false,

        },


        ticks: {

          color:
            "#64748B",

        },

      },


      y: {

        beginAtZero: true,


        grid: {

          color:
            "#E2E8F0",

        },


        ticks: {

          color:
            "#64748B",

          precision: 0,

        },

      },

    },

  };


  // =======================================================
  // PIE CHART OPTIONS
  // =======================================================

  const pieOptions = {

    responsive: true,

    maintainAspectRatio: false,


    plugins: {

      legend: {

        position: "bottom",


        labels: {

          usePointStyle: true,

          padding: 18,

          color:
            "#475569",


          font: {

            size: 12,

          },

        },

      },


      tooltip: {

        backgroundColor:
          "#0F172A",

        padding: 12,

        cornerRadius: 8,

      },

    },

  };


  // =======================================================
  // STAT CARD COMPONENT
  // =======================================================

  const StatCard = ({

    title,

    value,

    icon,

    iconColor,

    iconBackground,

    description,

  }) => {

    return (

      <div
        className="col-xl-4 col-lg-4 col-md-6"
      >

        <div
          className="card border-0 h-100"
          style={{

            borderRadius:
              "16px",

            boxShadow:
              "0 6px 20px rgba(15,23,42,0.08)",

            transition:
              "all 0.25s ease",

            cursor:
              "default",

          }}


          onMouseEnter={(event) => {

            event.currentTarget.style.transform =
              "translateY(-5px)";

            event.currentTarget.style.boxShadow =
              "0 12px 28px rgba(15,23,42,0.12)";

          }}


          onMouseLeave={(event) => {

            event.currentTarget.style.transform =
              "translateY(0)";

            event.currentTarget.style.boxShadow =
              "0 6px 20px rgba(15,23,42,0.08)";

          }}

        >

          <div
            className="card-body p-4"
          >

            <div
              className="d-flex justify-content-between align-items-start"
            >

              <div>

                <p
                  className="text-muted mb-2"
                  style={{

                    fontSize:
                      "13px",

                    fontWeight:
                      "700",

                    letterSpacing:
                      "0.4px",

                  }}
                >
                  {title}
                </p>


                <h2
                  className="fw-bold mb-1"
                  style={{
                    color:
                      "#172033",
                  }}
                >
                  {value}
                </h2>


                <small
                  className="text-muted"
                >
                  {description}
                </small>

              </div>


              <div
                style={{

                  width:
                    "56px",

                  height:
                    "56px",

                  borderRadius:
                    "14px",

                  background:
                    iconBackground,

                  color:
                    iconColor,

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  fontSize:
                    "23px",

                }}
              >
                {icon}
              </div>

            </div>


            <div
              className="mt-4 d-flex align-items-center"
              style={{

                color:
                  "#10B981",

                fontSize:
                  "12px",

                fontWeight:
                  "600",

              }}
            >

              <FaArrowUp
                className="me-1"
              />

              Fleet Data

            </div>

          </div>

        </div>

      </div>

    );

  };


  // =======================================================
  // MAIN UI
  // =======================================================

  return (

    <div
      className="container-fluid"
      style={{
        padding:
          "30px",
      }}
    >


      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div
        className="mb-4"
      >

        <h2
          className="fw-bold mb-1"
          style={{

            color:
              "#172033",

            fontSize:
              "30px",

          }}
        >

          <FaChartPie
            className="me-2"
            style={{
              color:
                "#2563EB",
            }}
          />

          Fleet Analytics

        </h2>


        <p
          className="text-muted mb-0"
        >
          Monitor fleet performance,
          operations and resource utilization.
        </p>

      </div>


      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (

        <div
          className="alert alert-danger d-flex justify-content-between align-items-center"
          role="alert"
        >

          <span>
            {error}
          </span>


          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={
              fetchAnalytics
            }
          >
            Retry
          </button>

        </div>

      )}


      {/* ===================================================
          STATISTICS
      =================================================== */}

      <div
        className="row g-4 mb-4"
      >


        <StatCard

          title="TOTAL VEHICLES"

          value={
            analytics.total_vehicles
          }

          icon={
            <FaTruck />
          }

          iconColor="#2563EB"

          iconBackground="#EFF6FF"

          description="Registered vehicles"

        />


        <StatCard

          title="TOTAL DRIVERS"

          value={
            analytics.total_drivers
          }

          icon={
            <FaUserTie />
          }

          iconColor="#10B981"

          iconBackground="#ECFDF5"

          description="Registered drivers"

        />


        <StatCard

          title="TOTAL SHIPMENTS"

          value={
            analytics.total_shipments
          }

          icon={
            <FaBoxOpen />
          }

          iconColor="#F59E0B"

          iconBackground="#FFFBEB"

          description="All shipments"

        />


        <StatCard

          title="TOTAL TRIPS"

          value={
            analytics.total_trips
          }

          icon={
            <FaRoute />
          }

          iconColor="#8B5CF6"

          iconBackground="#F5F3FF"

          description="Fleet trips"

        />


        <StatCard

          title="MAINTENANCE RECORDS"

          value={
            analytics.total_maintenance
          }

          icon={
            <FaTools />
          }

          iconColor="#EF4444"

          iconBackground="#FEF2F2"

          description="Maintenance activities"

        />


        <StatCard

          title="FUEL LOGS"

          value={
            analytics.total_fuel_logs
          }

          icon={
            <FaGasPump />
          }

          iconColor="#F97316"

          iconBackground="#FFF7ED"

          description="Fuel transactions"

        />

      </div>


      {/* ===================================================
          CHARTS
      =================================================== */}

      <div
        className="row g-4"
      >


        {/* =================================================
            BAR CHART
        ================================================= */}

        <div
          className="col-xl-8 col-lg-7"
        >

          <div
            className="card border-0 h-100"
            style={{

              borderRadius:
                "16px",

              boxShadow:
                "0 6px 22px rgba(15,23,42,0.08)",

            }}
          >

            <div
              className="card-body p-4"
            >

              <div
                className="mb-3"
              >

                <h5
                  className="fw-bold mb-1"
                  style={{
                    color:
                      "#172033",
                  }}
                >
                  Fleet Overview
                </h5>


                <small
                  className="text-muted"
                >
                  Comparison of all fleet resources
                </small>

              </div>


              <div
                style={{
                  height:
                    "350px",
                }}
              >

                <Bar
                  data={
                    barData
                  }
                  options={
                    barOptions
                  }
                />

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            PIE CHART
        ================================================= */}

        <div
          className="col-xl-4 col-lg-5"
        >

          <div
            className="card border-0 h-100"
            style={{

              borderRadius:
                "16px",

              boxShadow:
                "0 6px 22px rgba(15,23,42,0.08)",

            }}
          >

            <div
              className="card-body p-4"
            >

              <div
                className="mb-3"
              >

                <h5
                  className="fw-bold mb-1"
                  style={{
                    color:
                      "#172033",
                  }}
                >
                  Fleet Distribution
                </h5>


                <small
                  className="text-muted"
                >
                  Vehicles, drivers, shipments and trips
                </small>

              </div>


              <div
                style={{
                  height:
                    "350px",
                }}
              >

                <Pie
                  data={
                    pieData
                  }
                  options={
                    pieOptions
                  }
                />

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* ===================================================
          ANALYTICS SUMMARY
      =================================================== */}

      <div
        className="card border-0 mt-4"
        style={{

          borderRadius:
            "16px",

          boxShadow:
            "0 6px 22px rgba(15,23,42,0.08)",

        }}
      >

        <div
          className="card-body p-4"
        >

          <h5
            className="fw-bold mb-4"
            style={{
              color:
                "#172033",
            }}
          >
            Analytics Summary
          </h5>


          <div
            className="row g-4"
          >


            {/* VEHICLES */}

            <div
              className="col-xl-3 col-md-6"
            >

              <div
                style={{

                  padding:
                    "15px",

                  background:
                    "#EFF6FF",

                  borderRadius:
                    "12px",

                }}
              >

                <small
                  style={{
                    color:
                      "#64748B",
                  }}
                >
                  Vehicles
                </small>


                <h4
                  className="fw-bold mb-0"
                  style={{
                    color:
                      "#2563EB",
                  }}
                >
                  {
                    analytics.total_vehicles
                  }
                </h4>

              </div>

            </div>


            {/* DRIVERS */}

            <div
              className="col-xl-3 col-md-6"
            >

              <div
                style={{

                  padding:
                    "15px",

                  background:
                    "#ECFDF5",

                  borderRadius:
                    "12px",

                }}
              >

                <small
                  style={{
                    color:
                      "#64748B",
                  }}
                >
                  Drivers
                </small>


                <h4
                  className="fw-bold mb-0"
                  style={{
                    color:
                      "#10B981",
                  }}
                >
                  {
                    analytics.total_drivers
                  }
                </h4>

              </div>

            </div>


            {/* SHIPMENTS */}

            <div
              className="col-xl-3 col-md-6"
            >

              <div
                style={{

                  padding:
                    "15px",

                  background:
                    "#FFFBEB",

                  borderRadius:
                    "12px",

                }}
              >

                <small
                  style={{
                    color:
                      "#64748B",
                  }}
                >
                  Shipments
                </small>


                <h4
                  className="fw-bold mb-0"
                  style={{
                    color:
                      "#F59E0B",
                  }}
                >
                  {
                    analytics.total_shipments
                  }
                </h4>

              </div>

            </div>


            {/* TRIPS */}

            <div
              className="col-xl-3 col-md-6"
            >

              <div
                style={{

                  padding:
                    "15px",

                  background:
                    "#F5F3FF",

                  borderRadius:
                    "12px",

                }}
              >

                <small
                  style={{
                    color:
                      "#64748B",
                  }}
                >
                  Trips
                </small>


                <h4
                  className="fw-bold mb-0"
                  style={{
                    color:
                      "#8B5CF6",
                  }}
                >
                  {
                    analytics.total_trips
                  }
                </h4>

              </div>

            </div>

          </div>

        </div>

      </div>


    </div>

  );

}


export default Analytics;