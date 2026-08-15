import {
    useEffect,
    useState,
} from "react";

import api from "../services/api";

import RecentTrips from "../components/Dashboard/RecentTrips";
import RecentActiveDeliveries from "../components/Dashboard/RecentActiveDeliveries";
import RecentDeliveredShipments from "../components/Dashboard/RecentDeliveredShipments";
import RecentDelayedShipments from "../components/Dashboard/RecentDelayedShipments";
import RecentNotifications from "../components/Dashboard/RecentNotifications";

import DashboardCard from "../components/Dashboard/DashboardCard";
import FleetChart from "../components/Dashboard/FleetChart";

import RecentDrivers from "../components/Dashboard/RecentDrivers";
import RecentVehicles from "../components/Dashboard/RecentVehicles";
import RecentShipments from "../components/Dashboard/RecentShipments";

import {
    FaUserTie,
    FaTruck,
    FaBoxOpen,
    FaCheckCircle,
    FaShippingFast,
    FaClock,
    FaClipboardCheck,
    FaWarehouse,
    FaRoute,
    FaBell,
} from "react-icons/fa";

import "../components/Dashboard/Dashboard.css";


// ==========================================================
// GET CURRENT USER
// ==========================================================

function getCurrentUser() {

    try {

        const storedUser =
            sessionStorage.getItem("user");


        if (!storedUser) {

            return null;
        }


        const user =
            JSON.parse(storedUser);


        console.log(
            "FleetFlow current user:",
            user
        );


        return user;

    } catch (error) {

        console.error(
            "Unable to read current user:",
            error
        );

        return null;
    }
}


// ==========================================================
// NORMALIZE ROLE
// ==========================================================

function normalizeRole(role) {

    if (!role) {

        return "";
    }


    return String(role)
        .trim()
        .toLowerCase()
        .replace(/[_-]/g, " ")
        .replace(/\s+/g, " ");
}


// ==========================================================
// USER DASHBOARD
// ==========================================================

function UserDashboard() {

    const user =
        getCurrentUser();


    const userName =
        user?.name ||
        user?.full_name ||
        user?.username ||
        "User";


    return (

        <div className="dashboard-page">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="dashboard-header">

                <div>

                    <h1>
                        Welcome, {userName}
                    </h1>

                    <p>
                        Welcome to FleetFlow Management
                        & Logistics Tracking Platform
                    </p>

                </div>

            </div>


            {/* ==================================================
                USER CARDS
            ================================================== */}

            <div className="dashboard-cards">

                <DashboardCard
                    title="My Shipments"
                    value="View"
                    icon={<FaBoxOpen />}
                />

                <DashboardCard
                    title="My Trips"
                    value="View"
                    icon={<FaRoute />}
                />

                <DashboardCard
                    title="Notifications"
                    value="View"
                    icon={<FaBell />}
                />

                <DashboardCard
                    title="Profile"
                    value="View"
                    icon={<FaUserTie />}
                />

            </div>


            {/* ==================================================
                USER MESSAGE
            ================================================== */}

            <div className="tables-section">

                <div className="dashboard-user-message">

                    <h2>
                        FleetFlow User Portal
                    </h2>

                    <p>
                        You can manage and track your
                        shipments and trips from the
                        navigation menu.
                    </p>

                </div>

            </div>

        </div>
    );
}


// ==========================================================
// ADMIN DASHBOARD
// ==========================================================

function AdminDashboard() {

    const [
        dashboard,
        setDashboard,
    ] = useState({

        total_drivers: 0,

        total_vehicles: 0,

        total_shipments: 0,

        available_drivers: 0,

        available_vehicles: 0,

        active_deliveries: 0,

        delivered_shipments: 0,

        delayed_shipments: 0,
    });


    const [
        loading,
        setLoading,
    ] = useState(true);


    // ======================================================
    // FETCH DASHBOARD DATA
    // ======================================================

    useEffect(() => {

        let mounted = true;


        const fetchDashboard =
            async () => {

                try {

                    const response =
                        await api.get(
                            "/dashboard"
                        );


                    console.log(
                        "FleetFlow Admin Dashboard:",
                        response.data
                    );


                    if (mounted) {

                        setDashboard(
                            response.data
                        );
                    }

                } catch (error) {

                    console.error(
                        "Unable to load admin dashboard:",
                        error
                    );

                } finally {

                    if (mounted) {

                        setLoading(false);
                    }
                }
            };


        fetchDashboard();


        return () => {

            mounted = false;
        };

    }, []);


    // ======================================================
    // ADMIN DASHBOARD
    // ======================================================

    return (

        <div className="dashboard-page">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="dashboard-header">

                <div>

                    <h1>
                        Fleet Dashboard
                    </h1>

                    <p>
                        Welcome to FleetFlow Management
                        & Logistics Tracking Platform
                    </p>

                </div>

            </div>


            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="dashboard-cards">

                <DashboardCard
                    title="Total Drivers"
                    value={
                        loading
                            ? "..."
                            : dashboard.total_drivers
                    }
                    icon={<FaUserTie />}
                />


                <DashboardCard
                    title="Total Vehicles"
                    value={
                        loading
                            ? "..."
                            : dashboard.total_vehicles
                    }
                    icon={<FaTruck />}
                />


                <DashboardCard
                    title="Total Shipments"
                    value={
                        loading
                            ? "..."
                            : dashboard.total_shipments
                    }
                    icon={<FaBoxOpen />}
                />


                <DashboardCard
                    title="Available Drivers"
                    value={
                        loading
                            ? "..."
                            : dashboard.available_drivers
                    }
                    icon={<FaClipboardCheck />}
                />


                <DashboardCard
                    title="Available Vehicles"
                    value={
                        loading
                            ? "..."
                            : dashboard.available_vehicles
                    }
                    icon={<FaCheckCircle />}
                />


                <DashboardCard
                    title="Active Deliveries"
                    value={
                        loading
                            ? "..."
                            : dashboard.active_deliveries
                    }
                    icon={<FaShippingFast />}
                />


                <DashboardCard
                    title="Delivered Shipments"
                    value={
                        loading
                            ? "..."
                            : dashboard.delivered_shipments
                    }
                    icon={<FaWarehouse />}
                />


                <DashboardCard
                    title="Delayed Shipments"
                    value={
                        loading
                            ? "..."
                            : dashboard.delayed_shipments
                    }
                    icon={<FaClock />}
                />

            </div>


            {/* ==================================================
                CHART
            ================================================== */}

            <div className="chart-section">

                <FleetChart
                    dashboard={dashboard}
                />

            </div>


            {/* ==================================================
                RECENT DATA
            ================================================== */}

            <div className="tables-section">

                <RecentDrivers />

                <RecentVehicles />

                <RecentShipments />

                <RecentTrips />

                <RecentActiveDeliveries />

                <RecentDeliveredShipments />

                <RecentDelayedShipments />

                <RecentNotifications />

            </div>

        </div>
    );
}


// ==========================================================
// MAIN DASHBOARD
// ==========================================================

function Dashboard() {

    const user =
        getCurrentUser();


    // ======================================================
    // GET ROLE
    // ======================================================

    const role =
        normalizeRole(
            user?.role
        );


    console.log(
        "FleetFlow dashboard role:",
        role
    );


    // ======================================================
    // ADMIN
    // ======================================================

    if (
        role === "admin"
    ) {

        console.log(
            "✅ ADMIN DETECTED → ADMIN DASHBOARD"
        );


        return (
            <AdminDashboard />
        );
    }


    // ======================================================
    // FLEET MANAGER
    // ======================================================

    if (
        role === "fleet manager"
    ) {

        console.log(
            "✅ FLEET MANAGER DETECTED → ADMIN DASHBOARD"
        );


        return (
            <AdminDashboard />
        );
    }


    // ======================================================
    // DISPATCHER
    // ======================================================

    if (
        role === "dispatcher"
    ) {

        console.log(
            "✅ DISPATCHER DETECTED → ADMIN DASHBOARD"
        );


        return (
            <AdminDashboard />
        );
    }


    // ======================================================
    // DRIVER
    // ======================================================

    if (
        role === "driver"
    ) {

        console.log(
            "👤 DRIVER DETECTED → USER DASHBOARD"
        );


        return (
            <UserDashboard />
        );
    }


    // ======================================================
    // NORMAL USER
    // ======================================================

    if (
        role === "user"
    ) {

        console.log(
            "👤 USER DETECTED → USER DASHBOARD"
        );


        return (
            <UserDashboard />
        );
    }


    // ======================================================
    // UNKNOWN ROLE
    // ======================================================

    console.warn(
        "⚠️ Unknown or missing role:",
        user?.role
    );


    return (
        <UserDashboard />
    );
}


export default Dashboard;