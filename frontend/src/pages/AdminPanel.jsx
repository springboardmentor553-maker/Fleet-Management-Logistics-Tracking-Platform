import { useEffect, useState } from "react";

import {
    FaUsers,
    FaUserTie,
    FaTruck,
    FaRoute,
    FaBoxOpen,
    FaTools,
    FaChartLine,
    FaShieldAlt,
    FaClock,
    FaCheckCircle,
    FaExclamationTriangle,
    FaSyncAlt,
} from "react-icons/fa";

import Layout from "../components/Layout";

import {
    getDashboardSummary
} from "../services/dashboardService";

import "../styles/admin.css";


function AdminPanel() {


    // ============================================================
    // STATE
    // ============================================================

    const [loading, setLoading] =
        useState(true);


    const [refreshing, setRefreshing] =
        useState(false);


    const [error, setError] =
        useState("");


    const [stats, setStats] = useState({

        users: 0,

        managers: 0,

        drivers: 0,

        vehicles: 0,

        activeTrips: 0,

        shipments: 0,

        maintenance: 0,

    });


    // ============================================================
    // LOAD ADMIN DASHBOARD
    // ============================================================

    const loadAdminData = async (
        showRefresh = false
    ) => {

        try {

            if (showRefresh) {

                setRefreshing(true);

            } else {

                setLoading(true);

            }


            setError("");


            // ====================================================
            // GET REAL DATABASE DATA
            // ====================================================

            const data =
                await getDashboardSummary();


            console.log(
                "Admin dashboard data:",
                data
            );


            // ====================================================
            // UPDATE STATISTICS
            // ====================================================

            setStats({

                users:
                    data?.users ?? 0,

                managers:
                    data?.managers ?? 0,

                drivers:
                    data?.drivers ?? 0,

                vehicles:
                    data?.vehicles ?? 0,

                activeTrips:
                    data?.active_trips ?? 0,

                shipments:
                    data?.shipments ?? 0,

                maintenance:
                    data?.maintenance ?? 0,

            });


        } catch (err) {

            console.error(
                "Failed to load admin dashboard:",
                err
            );


            setError(

                err?.response?.data?.detail
                ||

                "Unable to load dashboard data."

            );


        } finally {

            setLoading(false);

            setRefreshing(false);

        }

    };


    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {

        loadAdminData();


        // Automatically refresh every 60 seconds

        const interval =
            setInterval(() => {

                loadAdminData(true);

            }, 60000);


        return () => {

            clearInterval(interval);

        };

    }, []);


    // ============================================================
    // CURRENT DATE
    // ============================================================

    const currentDate =
        new Date().toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            }
        );


    // ============================================================
    // STAT CARDS
    // ============================================================

    const statCards = [

        {
            title: "Total Users",

            value:
                stats.users,

            subtitle:
                "Registered accounts",

            icon:
                <FaUsers />,

            className:
                "admin-blue",
        },


        {
            title: "Managers",

            value:
                stats.managers,

            subtitle:
                "Management accounts",

            icon:
                <FaUserTie />,

            className:
                "admin-purple",
        },


        {
            title: "Drivers",

            value:
                stats.drivers,

            subtitle:
                "Registered drivers",

            icon:
                <FaUsers />,

            className:
                "admin-green",
        },


        {
            title: "Vehicles",

            value:
                stats.vehicles,

            subtitle:
                "Fleet vehicles",

            icon:
                <FaTruck />,

            className:
                "admin-orange",
        },


        {
            title: "Active Trips",

            value:
                stats.activeTrips,

            subtitle:
                "Currently running",

            icon:
                <FaRoute />,

            className:
                "admin-cyan",
        },


        {
            title: "Shipments",

            value:
                stats.shipments,

            subtitle:
                "Total shipments",

            icon:
                <FaBoxOpen />,

            className:
                "admin-pink",
        },


        {
            title: "Maintenance",

            value:
                stats.maintenance,

            subtitle:
                "Maintenance records",

            icon:
                <FaTools />,

            className:
                "admin-red",
        },

    ];


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (

            <Layout>

                <div className="admin-loading">

                    <div
                        className=
                            "admin-loading-spinner"
                    >

                        <FaSyncAlt />

                    </div>


                    <h3>
                        Loading Admin Panel
                    </h3>


                    <p>
                        Fetching your FleetFlow
                        database information...
                    </p>

                </div>

            </Layout>

        );

    }


    // ============================================================
    // MAIN UI
    // ============================================================

    return (

        <Layout>

            <div className="admin-panel">


                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="admin-header">

                    <div>

                        <p className="admin-eyebrow">
                            ADMINISTRATION
                        </p>


                        <h1>
                            Admin Dashboard
                        </h1>


                        <p className="admin-description">

                            Manage FleetFlow users,
                            fleet operations and
                            system activity.

                        </p>

                    </div>


                    {/* HEADER RIGHT */}

                    <div className="admin-header-right">


                        <div className="admin-date">

                            <FaClock />


                            <div>

                                <span>
                                    TODAY
                                </span>


                                <strong>
                                    {currentDate}
                                </strong>

                            </div>

                        </div>


                        <button

                            className=
                                "admin-refresh-btn"

                            onClick={() =>
                                loadAdminData(true)
                            }

                            disabled={refreshing}

                        >

                            <FaSyncAlt />

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

                    <div
                        className=
                            "dashboard-error"
                    >

                        <strong>
                            Dashboard data unavailable
                        </strong>


                        <span>
                            {error}
                        </span>


                        <button
                            onClick={() =>
                                loadAdminData()
                            }
                        >

                            Try Again

                        </button>

                    </div>

                )}


                {/* ==================================================
                    SECURITY BANNER
                ================================================== */}

                <div
                    className=
                        "admin-security-banner"
                >

                    <div
                        className=
                            "admin-security-icon"
                    >

                        <FaShieldAlt />

                    </div>


                    <div>

                        <strong>
                            Administrator Access
                        </strong>


                        <p>

                            You have full access
                            to FleetFlow system
                            administration and
                            management.

                        </p>

                    </div>


                    <div
                        className=
                            "admin-security-status"
                    >

                        <FaCheckCircle />

                        Secure

                    </div>

                </div>


                {/* ==================================================
                    OVERVIEW
                ================================================== */}

                <div
                    className=
                        "admin-section-heading"
                >

                    <div>

                        <h2>
                            System Overview
                        </h2>


                        <p>
                            Current FleetFlow
                            platform statistics
                        </p>

                    </div>

                </div>


                {/* ==================================================
                    STAT CARDS
                ================================================== */}

                <div
                    className=
                        "admin-stat-grid"
                >

                    {statCards.map(
                        (card) => (

                            <div

                                className=
                                    "admin-stat-card"

                                key=
                                    {card.title}

                            >

                                <div

                                    className={
                                        `admin-stat-icon ${card.className}`
                                    }

                                >

                                    {card.icon}

                                </div>


                                <div
                                    className=
                                        "admin-stat-content"
                                >

                                    <span
                                        className=
                                            "admin-stat-title"
                                    >

                                        {card.title}

                                    </span>


                                    <strong
                                        className=
                                            "admin-stat-value"
                                    >

                                        {card.value}

                                    </strong>


                                    <span
                                        className=
                                            "admin-stat-subtitle"
                                    >

                                        {card.subtitle}

                                    </span>

                                </div>

                            </div>

                        )
                    )}

                </div>


                {/* ==================================================
                    MAIN GRID
                ================================================== */}

                <div
                    className=
                        "admin-main-grid"
                >


                    {/* =================================================
                        SYSTEM HEALTH
                    ================================================= */}

                    <div
                        className=
                            "admin-card"
                    >

                        <div
                            className=
                                "admin-card-header"
                        >

                            <div>

                                <h3>
                                    System Health
                                </h3>


                                <p>
                                    FleetFlow service
                                    status
                                </p>

                            </div>


                            <FaChartLine />

                        </div>


                        <div
                            className=
                                "health-list"
                        >


                            <div
                                className=
                                    "health-item"
                            >

                                <div
                                    className=
                                        "health-left"
                                >

                                    <span
                                        className=
                                            "health-dot online"
                                    ></span>


                                    <span>
                                        Backend API
                                    </span>

                                </div>


                                <strong
                                    className=
                                        "health-online"
                                >

                                    Operational

                                </strong>

                            </div>


                            <div
                                className=
                                    "health-item"
                            >

                                <div
                                    className=
                                        "health-left"
                                >

                                    <span
                                        className=
                                            "health-dot online"
                                    ></span>


                                    <span>
                                        Database
                                    </span>

                                </div>


                                <strong
                                    className=
                                        "health-online"
                                >

                                    Operational

                                </strong>

                            </div>


                            <div
                                className=
                                    "health-item"
                            >

                                <div
                                    className=
                                        "health-left"
                                >

                                    <span
                                        className=
                                            "health-dot online"
                                    ></span>


                                    <span>
                                        Authentication
                                    </span>

                                </div>


                                <strong
                                    className=
                                        "health-online"
                                >

                                    Operational

                                </strong>

                            </div>


                            <div
                                className=
                                    "health-item"
                            >

                                <div
                                    className=
                                        "health-left"
                                >

                                    <span
                                        className=
                                            "health-dot warning"
                                    ></span>


                                    <span>
                                        Maintenance Service
                                    </span>

                                </div>


                                <strong
                                    className=
                                        "health-warning"
                                >

                                    Attention

                                </strong>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        FLEET SUMMARY
                    ================================================= */}

                    <div
                        className=
                            "admin-card"
                    >

                        <div
                            className=
                                "admin-card-header"
                        >

                            <div>

                                <h3>
                                    Fleet Summary
                                </h3>


                                <p>
                                    Current operational
                                    status
                                </p>

                            </div>


                            <FaTruck />

                        </div>


                        <div
                            className=
                                "fleet-summary"
                        >


                            {/* VEHICLES */}

                            <div
                                className=
                                    "fleet-summary-row"
                            >

                                <span>
                                    Vehicles
                                </span>


                                <strong>
                                    {stats.vehicles}
                                </strong>

                            </div>


                            <div
                                className=
                                    "fleet-progress"
                            >

                                <div
                                    style={{
                                        width:
                                            stats.vehicles > 0
                                                ? "100%"
                                                : "0%"
                                    }}
                                ></div>

                            </div>


                            {/* ACTIVE TRIPS */}

                            <div
                                className=
                                    "fleet-summary-row"
                            >

                                <span>
                                    Active Trips
                                </span>


                                <strong>
                                    {stats.activeTrips}
                                </strong>

                            </div>


                            <div
                                className=
                                    "fleet-progress"
                            >

                                <div
                                    style={{
                                        width:
                                            stats.trips > 0
                                                ? `${Math.min(
                                                    (
                                                        stats.activeTrips
                                                        /
                                                        stats.trips
                                                    ) * 100,
                                                    100
                                                )}%`
                                                : "0%"
                                    }}
                                ></div>

                            </div>


                            {/* SHIPMENTS */}

                            <div
                                className=
                                    "fleet-summary-row"
                            >

                                <span>
                                    Shipments
                                </span>


                                <strong>
                                    {stats.shipments}
                                </strong>

                            </div>


                            <div
                                className=
                                    "fleet-progress"
                            >

                                <div
                                    style={{
                                        width:
                                            stats.shipments > 0
                                                ? "100%"
                                                : "0%"
                                    }}
                                ></div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* ==================================================
                    ADMIN WARNING
                ================================================== */}

                <div
                    className=
                        "admin-warning"
                >

                    <FaExclamationTriangle />


                    <div>

                        <strong>
                            Maintenance information
                        </strong>


                        <p>

                            {stats.maintenance}
                            maintenance records
                            currently exist in
                            the system.

                        </p>

                    </div>

                </div>


            </div>

        </Layout>

    );

}


export default AdminPanel;