import { useEffect, useState } from "react";

import {
    FaTruckMoving,
    FaUsers,
    FaBoxOpen,
    FaRoute,
    FaGasPump,
    FaTools,
    FaSyncAlt,
    FaUserShield,
    FaUser,
    FaChartLine,
    FaMapMarkedAlt
} from "react-icons/fa";

import Layout from "../components/Layout";

import SummaryCard from "../components/ui/SummaryCard";
import ChartCard from "../components/ui/ChartCard";

import ShipmentPieChart from "../components/charts/ShipmentPieChart";
import VehicleBarChart from "../components/charts/VehicleBarChart";
import MonthlyShipmentChart from "../components/charts/MonthlyShipmentChart";

import RecentActivities from "../components/RecentActivities";

import {
    getDashboardSummary,
    getDashboardAnalytics
} from "../services/dashboardService";

import "../styles/dashboard.css";


function Dashboard() {

    // ============================================================
    // ROLE
    // ============================================================

    const role = (
        localStorage.getItem("role") || "user"
    ).toLowerCase();

    const isAdmin = role === "admin";
    const isManager = role === "manager";
    const isDriver = role === "driver";


    // ============================================================
    // DASHBOARD STATE
    // ============================================================

    const [summary, setSummary] = useState({
        vehicles: 0,
        drivers: 0,
        shipments: 0,
        trips: 0,
        fuel_records: 0,
        maintenance: 0
    });

    const [analytics, setAnalytics] = useState({
        shipment_status: [],
        vehicle_status: [],
        monthly_shipments: []
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");


    // ============================================================
    // LOAD DASHBOARD
    // ============================================================

    const loadDashboard = async (showRefresh = false) => {

        try {

            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const [
                summaryData,
                analyticsData
            ] = await Promise.all([
                getDashboardSummary(),
                getDashboardAnalytics()
            ]);


            // ----------------------------------------------------
            // SUMMARY
            // ----------------------------------------------------

            setSummary({
                vehicles: summaryData?.vehicles ?? 0,
                drivers: summaryData?.drivers ?? 0,
                shipments: summaryData?.shipments ?? 0,
                trips: summaryData?.trips ?? 0,
                fuel_records: summaryData?.fuel_records ?? 0,
                maintenance: summaryData?.maintenance ?? 0
            });


            // ----------------------------------------------------
            // ANALYTICS
            // ----------------------------------------------------

            setAnalytics({
                shipment_status:
                    analyticsData?.shipment_status ?? [],

                vehicle_status:
                    analyticsData?.vehicle_status ?? [],

                monthly_shipments:
                    analyticsData?.monthly_shipments ?? []
            });

        } catch (err) {

            console.error(
                "Dashboard loading error:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                "Unable to load dashboard data."
            );

        } finally {

            setLoading(false);
            setRefreshing(false);

        }
    };


    // ============================================================
    // INITIAL LOAD + AUTO REFRESH
    // ============================================================

    useEffect(() => {

        loadDashboard();

        const interval = setInterval(() => {
            loadDashboard(true);
        }, 60000);

        return () => clearInterval(interval);

    }, []);


    // ============================================================
    // DATE
    // ============================================================

    const currentDate =
        new Date().toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );


    // ============================================================
    // ROLE DISPLAY
    // ============================================================

    const getRoleName = () => {

        if (isAdmin) {
            return "Administrator";
        }

        if (isManager) {
            return "Fleet Manager";
        }

        if (isDriver) {
            return "Driver";
        }

        return "Fleet User";
    };


    const getDashboardDescription = () => {

        if (isAdmin) {

            return (
                "Monitor your complete fleet operations, "
                + "performance, users and business activities "
                + "from one place."
            );
        }

        if (isManager) {

            return (
                "Monitor fleet operations, shipments, trips "
                + "and vehicle performance."
            );
        }

        if (isDriver) {

            return (
                "View your fleet operations, trips, shipments "
                + "and tracking information."
            );
        }

        return (
            "View fleet operations, shipments, trips "
            + "and tracking information."
        );
    };


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (

            <Layout>

                <div className="dashboard-loading">

                    <div className="dashboard-spinner"></div>

                    <h3>
                        Loading FleetFlow Dashboard...
                    </h3>

                    <p>
                        Fetching your latest fleet information.
                    </p>

                </div>

            </Layout>

        );
    }


    // ============================================================
    // MAIN DASHBOARD
    // ============================================================

    return (

        <Layout>

            <div className="dashboard">


                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="dashboard-header">

                    <div>

                        <div className="dashboard-eyebrow">

                            {isAdmin
                                ? "ADMINISTRATION"
                                : "FLEET OPERATIONS"
                            }

                        </div>


                        <h1>

                            {isAdmin
                                ? "Admin Dashboard"
                                : "FleetFlow Dashboard"
                            }

                        </h1>


                        <p>
                            {getDashboardDescription()}
                        </p>


                        {/* ROLE BADGE */}

                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                marginTop: "12px",
                                padding: "7px 13px",
                                borderRadius: "20px",
                                background: isAdmin
                                    ? "#eef2ff"
                                    : "#f1f5f9",
                                color: isAdmin
                                    ? "#4338ca"
                                    : "#475569",
                                fontSize: "13px",
                                fontWeight: "600"
                            }}
                        >

                            {isAdmin
                                ? <FaUserShield />
                                : <FaUser />
                            }

                            {getRoleName()}

                        </div>

                    </div>


                    {/* HEADER ACTIONS */}

                    <div className="dashboard-header-actions">

                        <div className="dashboard-date">

                            <span>
                                Today
                            </span>

                            <strong>
                                {currentDate}
                            </strong>

                        </div>


                        <button
                            className="refresh-dashboard-btn"
                            onClick={() =>
                                loadDashboard(true)
                            }
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
                                : "Refresh"
                            }

                        </button>

                    </div>

                </div>


                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (

                    <div className="dashboard-error">

                        <strong>
                            Dashboard data unavailable
                        </strong>

                        <span>
                            {error}
                        </span>

                        <button
                            onClick={() =>
                                loadDashboard()
                            }
                        >
                            Try Again
                        </button>

                    </div>

                )}


                {/* ==================================================
                    ADMIN DASHBOARD
                ================================================== */}

                {isAdmin && (

                    <>


                        {/* ADMIN WELCOME */}

                        <div
                            style={{
                                marginBottom: "25px",
                                padding: "20px",
                                borderRadius: "12px",
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0"
                            }}
                        >

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px"
                                }}
                            >

                                <FaUserShield
                                    size={22}
                                />

                                <div>

                                    <strong>
                                        Administrator Overview
                                    </strong>

                                    <p
                                        style={{
                                            margin:
                                                "5px 0 0",
                                            color:
                                                "#64748b",
                                            fontSize:
                                                "14px"
                                        }}
                                    >
                                        You have access to
                                        complete fleet
                                        management and
                                        analytics.
                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* FLEET OVERVIEW */}

                        <div className="dashboard-section-heading">

                            <div>

                                <h2>
                                    Fleet Overview
                                </h2>

                                <p>
                                    Current operational statistics
                                </p>

                            </div>

                        </div>


                        <div className="dashboard-cards">

                            <SummaryCard
                                title="Vehicles"
                                value={summary.vehicles}
                                subtitle="Total fleet vehicles"
                                icon={
                                    <FaTruckMoving
                                        color="white"
                                    />
                                }
                                color="#2563EB"
                            />


                            <SummaryCard
                                title="Drivers"
                                value={summary.drivers}
                                subtitle="Registered drivers"
                                icon={
                                    <FaUsers
                                        color="white"
                                    />
                                }
                                color="#10B981"
                            />


                            <SummaryCard
                                title="Shipments"
                                value={summary.shipments}
                                subtitle="Total shipments"
                                icon={
                                    <FaBoxOpen
                                        color="white"
                                    />
                                }
                                color="#F59E0B"
                            />


                            <SummaryCard
                                title="Trips"
                                value={summary.trips}
                                subtitle="Recorded trips"
                                icon={
                                    <FaRoute
                                        color="white"
                                    />
                                }
                                color="#8B5CF6"
                            />


                            <SummaryCard
                                title="Fuel Records"
                                value={summary.fuel_records}
                                subtitle="Fuel transactions"
                                icon={
                                    <FaGasPump
                                        color="white"
                                    />
                                }
                                color="#EF4444"
                            />


                            <SummaryCard
                                title="Maintenance"
                                value={summary.maintenance}
                                subtitle="Maintenance records"
                                icon={
                                    <FaTools
                                        color="white"
                                    />
                                }
                                color="#14B8A6"
                            />

                        </div>


                        {/* ADMIN ANALYTICS */}

                        <div
                            className={
                                "dashboard-section-heading " +
                                "dashboard-analytics-heading"
                            }
                        >

                            <div>

                                <h2>
                                    Operational Analytics
                                </h2>

                                <p>
                                    Complete overview of
                                    fleet activity
                                </p>

                            </div>

                        </div>


                        <div className="dashboard-charts">

                            <ChartCard
                                title="Shipment Status"
                            >

                                <ShipmentPieChart
                                    data={
                                        analytics.shipment_status
                                    }
                                />

                            </ChartCard>


                            <ChartCard
                                title="Vehicle Status"
                            >

                                <VehicleBarChart
                                    data={
                                        analytics.vehicle_status
                                    }
                                />

                            </ChartCard>

                        </div>


                        <div className="dashboard-bottom">

                            <ChartCard
                                title="Monthly Shipments"
                            >

                                <MonthlyShipmentChart
                                    data={
                                        analytics.monthly_shipments
                                    }
                                />

                            </ChartCard>

                        </div>


                        {/* RECENT ACTIVITY */}

                        <RecentActivities />

                    </>

                )}


                {/* ==================================================
                    MANAGER / USER / DRIVER DASHBOARD
                ================================================== */}

                {!isAdmin && (

                    <>


                        {/* OPERATIONAL OVERVIEW */}

                        <div className="dashboard-section-heading">

                            <div>

                                <h2>
                                    My Fleet Operations
                                </h2>

                                <p>
                                    Current operational
                                    information
                                </p>

                            </div>

                        </div>


                        <div className="dashboard-cards">


                            {/* VEHICLES */}

                            <SummaryCard
                                title="Vehicles"
                                value={summary.vehicles}
                                subtitle="Fleet vehicles"
                                icon={
                                    <FaTruckMoving
                                        color="white"
                                    />
                                }
                                color="#2563EB"
                            />


                            {/* SHIPMENTS */}

                            <SummaryCard
                                title="Shipments"
                                value={summary.shipments}
                                subtitle="Current shipments"
                                icon={
                                    <FaBoxOpen
                                        color="white"
                                    />
                                }
                                color="#F59E0B"
                            />


                            {/* TRIPS */}

                            <SummaryCard
                                title="Trips"
                                value={summary.trips}
                                subtitle="Scheduled trips"
                                icon={
                                    <FaRoute
                                        color="white"
                                    />
                                }
                                color="#8B5CF6"
                            />


                            {/* DRIVERS */}

                            {!isDriver && (

                                <SummaryCard
                                    title="Drivers"
                                    value={
                                        summary.drivers
                                    }
                                    subtitle="Available drivers"
                                    icon={
                                        <FaUsers
                                            color="white"
                                        />
                                    }
                                    color="#10B981"
                                />

                            )}


                            {/* TRACKING */}

                            <SummaryCard
                                title="Tracking"
                                value="Live"
                                subtitle="Real-time tracking"
                                icon={
                                    <FaMapMarkedAlt
                                        color="white"
                                    />
                                }
                                color="#06B6D4"
                            />


                            {/* ANALYTICS */}

                            {!isDriver && (

                                <SummaryCard
                                    title="Analytics"
                                    value="View"
                                    subtitle="Fleet performance"
                                    icon={
                                        <FaChartLine
                                            color="white"
                                        />
                                    }
                                    color="#6366F1"
                                />

                            )}

                        </div>


                        {/* OPERATIONAL ANALYTICS */}

                        <div
                            className={
                                "dashboard-section-heading " +
                                "dashboard-analytics-heading"
                            }
                        >

                            <div>

                                <h2>
                                    Operational Analytics
                                </h2>

                                <p>
                                    Monitor fleet activity
                                    and shipment progress
                                </p>

                            </div>

                        </div>


                        <div className="dashboard-charts">

                            <ChartCard
                                title="Shipment Status"
                            >

                                <ShipmentPieChart
                                    data={
                                        analytics.shipment_status
                                    }
                                />

                            </ChartCard>


                            <ChartCard
                                title="Vehicle Status"
                            >

                                <VehicleBarChart
                                    data={
                                        analytics.vehicle_status
                                    }
                                />

                            </ChartCard>

                        </div>


                        {/* MONTHLY SHIPMENTS */}

                        <div className="dashboard-bottom">

                            <ChartCard
                                title="Monthly Shipments"
                            >

                                <MonthlyShipmentChart
                                    data={
                                        analytics.monthly_shipments
                                    }
                                />

                            </ChartCard>

                        </div>


                        {/* RECENT ACTIVITY */}

                        <RecentActivities />

                    </>

                )}

            </div>

        </Layout>

    );
}


export default Dashboard;