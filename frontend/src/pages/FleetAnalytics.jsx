import { useEffect, useState } from "react";
import Layout from "../components/Layout";

import {
    FaTruck,
    FaUserTie,
    FaRoute,
    FaMoneyBillWave,
    FaCheckCircle,
    FaTools,
    FaRoad,
    FaSyncAlt
} from "react-icons/fa";

import { getFleetAnalytics } from "../services/fleetAnalyticsService";

import "../styles/fleetAnalytics.css";

function FleetAnalytics() {

    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async (isRefresh = false) => {

        try {

            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const data = await getFleetAnalytics();

            setAnalytics(data);

        } catch (err) {

            console.error(
                "Error fetching fleet analytics:",
                err
            );

            setError(
                err.response?.data?.detail ||
                "Unable to load fleet analytics."
            );

        } finally {

            setLoading(false);
            setRefreshing(false);

        }
    };


    const formatCurrency = (value) => {

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(Number(value || 0));

    };


    if (loading) {

        return (

            <Layout>

                <div className="fleet-analytics-page">

                    <div className="analytics-loading">

                        <div className="loading-spinner"></div>

                        <h3>
                            Loading Fleet Analytics
                        </h3>

                        <p>
                            Fetching the latest fleet performance data...
                        </p>

                    </div>

                </div>

            </Layout>

        );

    }


    if (error || !analytics) {

        return (

            <Layout>

                <div className="fleet-analytics-page">

                    <div className="analytics-error">

                        <div className="error-icon">
                            !
                        </div>

                        <h2>
                            Unable to Load Analytics
                        </h2>

                        <p>
                            {error ||
                                "No analytics data is available."}
                        </p>

                        <button
                            className="analytics-refresh-btn"
                            onClick={() => fetchAnalytics()}
                        >
                            <FaSyncAlt />
                            Try Again
                        </button>

                    </div>

                </div>

            </Layout>

        );

    }


    const vehicles = analytics.vehicles || {};
    const drivers = analytics.drivers || {};
    const trips = analytics.trips || {};
    const expenses = analytics.expenses || {};


    const vehicleTotal =
        Number(vehicles.total || 0);

    const availableVehicles =
        Number(vehicles.available || 0);

    const transitVehicles =
        Number(vehicles.in_transit || 0);

    const maintenanceVehicles =
        Number(vehicles.maintenance || 0);


    const driverTotal =
        Number(drivers.total || 0);

    const availableDrivers =
        Number(drivers.available || 0);

    const assignedDrivers =
        Number(drivers.assigned || 0);


    const totalTrips =
        Number(trips.total || 0);

    const completedTrips =
        Number(trips.completed || 0);


    const completedPercentage =
        totalTrips > 0
            ? Math.round(
                (completedTrips / totalTrips) * 100
            )
            : 0;


    const driverUtilization =
        driverTotal > 0
            ? Math.round(
                (assignedDrivers / driverTotal) * 100
            )
            : 0;


    const vehicleAvailability =
        vehicleTotal > 0
            ? Math.round(
                (availableVehicles / vehicleTotal) * 100
            )
            : 0;


    return (

        <Layout>

            <div className="fleet-analytics-page">

                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

                <div className="fleet-analytics-header">

                    <div>

                        <div className="analytics-breadcrumb">
                            ANALYTICS / FLEET
                        </div>

                        <h1>
                            Fleet Analytics
                        </h1>

                        <p>
                            Monitor fleet utilization,
                            driver performance,
                            trip activity and operating expenses.
                        </p>

                    </div>

                    <button
                        className="analytics-refresh-btn"
                        onClick={() => fetchAnalytics(true)}
                        disabled={refreshing}
                    >

                        <FaSyncAlt
                            className={
                                refreshing
                                    ? "refresh-spin"
                                    : ""
                            }
                        />

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh Data"}

                    </button>

                </div>


                {/* ================================================= */}
                {/* KPI CARDS */}
                {/* ================================================= */}

                <div className="fleet-kpi-grid">


                    <div className="fleet-kpi-card">

                        <div className="fleet-kpi-icon blue">
                            <FaTruck />
                        </div>

                        <div className="fleet-kpi-content">

                            <span>
                                Total Vehicles
                            </span>

                            <strong>
                                {vehicleTotal}
                            </strong>

                            <small>
                                {vehicleAvailability}% available
                            </small>

                        </div>

                    </div>


                    <div className="fleet-kpi-card">

                        <div className="fleet-kpi-icon green">
                            <FaUserTie />
                        </div>

                        <div className="fleet-kpi-content">

                            <span>
                                Total Drivers
                            </span>

                            <strong>
                                {driverTotal}
                            </strong>

                            <small>
                                {driverUtilization}% assigned
                            </small>

                        </div>

                    </div>


                    <div className="fleet-kpi-card">

                        <div className="fleet-kpi-icon purple">
                            <FaRoute />
                        </div>

                        <div className="fleet-kpi-content">

                            <span>
                                Total Trips
                            </span>

                            <strong>
                                {totalTrips}
                            </strong>

                            <small>
                                {completedPercentage}% completed
                            </small>

                        </div>

                    </div>


                    <div className="fleet-kpi-card">

                        <div className="fleet-kpi-icon orange">
                            <FaMoneyBillWave />
                        </div>

                        <div className="fleet-kpi-content">

                            <span>
                                Total Expenses
                            </span>

                            <strong className="currency-value">
                                {formatCurrency(
                                    expenses.total_cost
                                )}
                            </strong>

                            <small>
                                Fuel + maintenance
                            </small>

                        </div>

                    </div>

                </div>


                {/* ================================================= */}
                {/* MAIN ANALYTICS */}
                {/* ================================================= */}

                <div className="fleet-analytics-grid">


                    {/* VEHICLE STATUS */}

                    <div className="analytics-panel">

                        <div className="panel-header">

                            <div>

                                <h2>
                                    Vehicle Status
                                </h2>

                                <p>
                                    Current fleet availability
                                </p>

                            </div>

                            <FaTruck className="panel-icon" />

                        </div>


                        <div className="status-list">


                            <div className="status-item">

                                <div className="status-label">

                                    <span className="status-dot available"></span>

                                    <span>
                                        Available
                                    </span>

                                </div>

                                <strong>
                                    {availableVehicles}
                                </strong>

                            </div>


                            <div className="status-progress">

                                <div
                                    className="progress-fill available-fill"
                                    style={{
                                        width: `${vehicleTotal
                                            ? (availableVehicles / vehicleTotal) * 100
                                            : 0}%`
                                    }}
                                ></div>

                            </div>


                            <div className="status-item">

                                <div className="status-label">

                                    <span className="status-dot transit"></span>

                                    <span>
                                        In Transit
                                    </span>

                                </div>

                                <strong>
                                    {transitVehicles}
                                </strong>

                            </div>


                            <div className="status-progress">

                                <div
                                    className="progress-fill transit-fill"
                                    style={{
                                        width: `${vehicleTotal
                                            ? (transitVehicles / vehicleTotal) * 100
                                            : 0}%`
                                    }}
                                ></div>

                            </div>


                            <div className="status-item">

                                <div className="status-label">

                                    <span className="status-dot maintenance"></span>

                                    <span>
                                        Under Maintenance
                                    </span>

                                </div>

                                <strong>
                                    {maintenanceVehicles}
                                </strong>

                            </div>


                            <div className="status-progress">

                                <div
                                    className="progress-fill maintenance-fill"
                                    style={{
                                        width: `${vehicleTotal
                                            ? (maintenanceVehicles / vehicleTotal) * 100
                                            : 0}%`
                                    }}
                                ></div>

                            </div>

                        </div>

                    </div>


                    {/* DRIVER UTILIZATION */}

                    <div className="analytics-panel">

                        <div className="panel-header">

                            <div>

                                <h2>
                                    Driver Utilization
                                </h2>

                                <p>
                                    Current driver assignment
                                </p>

                            </div>

                            <FaUserTie className="panel-icon" />

                        </div>


                        <div className="utilization-content">

                            <div className="utilization-circle">

                                <div className="utilization-inner">

                                    <strong>
                                        {driverUtilization}%
                                    </strong>

                                    <span>
                                        Utilized
                                    </span>

                                </div>

                            </div>


                            <div className="driver-stats">

                                <div>
                                    <span>
                                        Total Drivers
                                    </span>

                                    <strong>
                                        {driverTotal}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Assigned
                                    </span>

                                    <strong className="green-text">
                                        {assignedDrivers}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Available
                                    </span>

                                    <strong className="blue-text">
                                        {availableDrivers}
                                    </strong>
                                </div>

                            </div>

                        </div>

                    </div>


                    {/* TRIP PERFORMANCE */}

                    <div className="analytics-panel">

                        <div className="panel-header">

                            <div>

                                <h2>
                                    Trip Performance
                                </h2>

                                <p>
                                    Completed versus total trips
                                </p>

                            </div>

                            <FaRoute className="panel-icon" />

                        </div>


                        <div className="trip-performance">

                            <div className="trip-number">

                                <strong>
                                    {completedTrips}
                                </strong>

                                <span>
                                    Completed Trips
                                </span>

                            </div>


                            <div className="trip-number">

                                <strong>
                                    {totalTrips - completedTrips}
                                </strong>

                                <span>
                                    Remaining
                                </span>

                            </div>

                        </div>


                        <div className="trip-progress">

                            <div
                                className="trip-progress-fill"
                                style={{
                                    width: `${completedPercentage}%`
                                }}
                            ></div>

                        </div>


                        <div className="trip-footer">

                            <span>
                                Completion Rate
                            </span>

                            <strong>
                                {completedPercentage}%
                            </strong>

                        </div>

                    </div>


                    {/* EXPENSE BREAKDOWN */}

                    <div className="analytics-panel">

                        <div className="panel-header">

                            <div>

                                <h2>
                                    Expense Overview
                                </h2>

                                <p>
                                    Fleet operating expenses
                                </p>

                            </div>

                            <FaMoneyBillWave className="panel-icon" />

                        </div>


                        <div className="expense-total">

                            <span>
                                Total Expense
                            </span>

                            <strong>
                                {formatCurrency(
                                    expenses.total_cost
                                )}
                            </strong>

                        </div>


                        <div className="expense-row">

                            <div className="expense-label">

                                <FaRoad />

                                <span>
                                    Fuel Cost
                                </span>

                            </div>

                            <strong>
                                {formatCurrency(
                                    expenses.fuel_cost
                                )}
                            </strong>

                        </div>


                        <div className="expense-row">

                            <div className="expense-label">

                                <FaTools />

                                <span>
                                    Maintenance Cost
                                </span>

                            </div>

                            <strong>
                                {formatCurrency(
                                    expenses.maintenance_cost
                                )}
                            </strong>

                        </div>

                    </div>

                </div>


                {/* ================================================= */}
                {/* PERFORMANCE SUMMARY */}
                {/* ================================================= */}

                <div className="fleet-summary-banner">

                    <div className="summary-banner-icon">
                        <FaCheckCircle />
                    </div>

                    <div>

                        <h3>
                            Fleet Performance Overview
                        </h3>

                        <p>

                            {completedPercentage >= 80
                                ? "Fleet operations are performing well with a strong trip completion rate."
                                : completedPercentage >= 50
                                    ? "Fleet operations are progressing steadily. Monitor pending trips for better efficiency."
                                    : "Fleet operations require attention. Review pending trips and vehicle utilization."}

                        </p>

                    </div>

                </div>

            </div>

        </Layout>

    );

}

export default FleetAnalytics;