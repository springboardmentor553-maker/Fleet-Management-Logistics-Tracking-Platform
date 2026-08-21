import { useEffect, useState } from "react";

import {
    FaTruckMoving,
    FaUsers,
    FaBoxOpen,
    FaRoute,
    FaGasPump,
    FaTools,
    FaSyncAlt
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

function ManagerDashboard() {

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

            setSummary({
                vehicles: summaryData?.vehicles ?? 0,
                drivers: summaryData?.drivers ?? 0,
                shipments: summaryData?.shipments ?? 0,
                trips: summaryData?.trips ?? 0,
                fuel_records: summaryData?.fuel_records ?? 0,
                maintenance: summaryData?.maintenance ?? 0
            });

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
                "Manager dashboard loading error:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                "Unable to load manager dashboard data."
            );

        } finally {

            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {

        loadDashboard();

        const interval = setInterval(() => {
            loadDashboard(true);
        }, 60000);

        return () => clearInterval(interval);

    }, []);

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

    if (loading) {

        return (
            <Layout>

                <div className="dashboard-loading">

                    <div className="dashboard-spinner"></div>

                    <h3>
                        Loading Manager Dashboard...
                    </h3>

                    <p>
                        Fetching the latest operational information.
                    </p>

                </div>

            </Layout>
        );
    }

    return (

        <Layout>

            <div className="dashboard">

                {/* =========================
                    HEADER
                ========================= */}

                <div className="dashboard-header">

                    <div>

                        <div className="dashboard-eyebrow">
                            FLEET OPERATIONS
                        </div>

                        <h1>
                            Manager Dashboard
                        </h1>

                        <p>
                            Monitor fleet operations,
                            drivers, shipments and trips.
                        </p>

                    </div>

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


                {/* =========================
                    ERROR
                ========================= */}

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


                {/* =========================
                    FLEET OVERVIEW
                ========================= */}

                <div className="dashboard-section-heading">

                    <div>

                        <h2>
                            Operations Overview
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
                        icon={<FaTruckMoving color="white" />}
                        color="#2563EB"
                    />

                    <SummaryCard
                        title="Drivers"
                        value={summary.drivers}
                        subtitle="Registered drivers"
                        icon={<FaUsers color="white" />}
                        color="#10B981"
                    />

                    <SummaryCard
                        title="Shipments"
                        value={summary.shipments}
                        subtitle="Total shipments"
                        icon={<FaBoxOpen color="white" />}
                        color="#F59E0B"
                    />

                    <SummaryCard
                        title="Trips"
                        value={summary.trips}
                        subtitle="Recorded trips"
                        icon={<FaRoute color="white" />}
                        color="#8B5CF6"
                    />

                    <SummaryCard
                        title="Fuel Records"
                        value={summary.fuel_records}
                        subtitle="Fuel transactions"
                        icon={<FaGasPump color="white" />}
                        color="#EF4444"
                    />

                    <SummaryCard
                        title="Maintenance"
                        value={summary.maintenance}
                        subtitle="Maintenance records"
                        icon={<FaTools color="white" />}
                        color="#14B8A6"
                    />

                </div>


                {/* =========================
                    ANALYTICS
                ========================= */}

                <div className="dashboard-section-heading dashboard-analytics-heading">

                    <div>

                        <h2>
                            Operational Analytics
                        </h2>

                        <p>
                            Monitor fleet activity and performance
                        </p>

                    </div>

                </div>


                <div className="dashboard-charts">

                    <ChartCard title="Shipment Status">

                        <ShipmentPieChart
                            data={analytics.shipment_status}
                        />

                    </ChartCard>


                    <ChartCard title="Vehicle Status">

                        <VehicleBarChart
                            data={analytics.vehicle_status}
                        />

                    </ChartCard>

                </div>


                <div className="dashboard-bottom">

                    <ChartCard title="Monthly Shipments">

                        <MonthlyShipmentChart
                            data={analytics.monthly_shipments}
                        />

                    </ChartCard>

                </div>


                {/* =========================
                    RECENT ACTIVITY
                ========================= */}

                <RecentActivities />

            </div>

        </Layout>
    );
}

export default ManagerDashboard;
