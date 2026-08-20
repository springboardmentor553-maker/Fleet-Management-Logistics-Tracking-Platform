import { useEffect, useState } from "react";

import {
    FaBoxOpen,
    FaRoute,
    FaCheckCircle,
    FaClock,
    FaTruck,
    FaChartLine,
} from "react-icons/fa";

import api from "../services/api";

import "./OperationalAnalytics.css";


function OperationalAnalytics() {

    const [analytics, setAnalytics] = useState({
        total_shipments: 0,
        active_trips: 0,
        delivered_shipments: 0,
        delayed_shipments: 0,
        total_vehicles: 0,
        fleet_utilization: 0,
    });

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // ==========================================================
    // FETCH ANALYTICS
    // ==========================================================

    useEffect(() => {

        fetchAnalytics();

    }, []);


    const fetchAnalytics = async () => {

        try {

            setLoading(true);

            setError("");


            /*
             * Use the existing dashboard API first.
             *
             * This prevents this new page from requiring
             * another backend endpoint immediately.
             */

            const response =
                await api.get(
                    "/dashboard"
                );


            const data =
                response.data || {};


            setAnalytics({

                total_shipments:
                    Number(
                        data.total_shipments ??
                        data.totalShipments ??
                        0
                    ),

                active_trips:
                    Number(
                        data.active_trips ??
                        data.activeTrips ??
                        data.active_deliveries ??
                        data.activeDeliveries ??
                        0
                    ),

                delivered_shipments:
                    Number(
                        data.delivered_shipments ??
                        data.deliveredShipments ??
                        0
                    ),

                delayed_shipments:
                    Number(
                        data.delayed_shipments ??
                        data.delayedShipments ??
                        0
                    ),

                total_vehicles:
                    Number(
                        data.total_vehicles ??
                        data.totalVehicles ??
                        0
                    ),

                fleet_utilization:
                    Number(
                        data.fleet_utilization ??
                        data.fleetUtilization ??
                        0
                    ),
            });

        } catch (err) {

            console.error(
                "Operational Analytics error:",
                err
            );

            setError(
                "Unable to load operational analytics."
            );

        } finally {

            setLoading(false);
        }
    };


    // ==========================================================
    // LOADING
    // ==========================================================

    if (loading) {

        return (

            <div className="operational-analytics-page">

                <div className="operational-loading">

                    Loading Operational Analytics...

                </div>

            </div>

        );
    }


    // ==========================================================
    // PAGE
    // ==========================================================

    return (

        <div className="operational-analytics-page">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="operational-analytics-header">

                <div>

                    <h1>
                        Operational Analytics
                    </h1>

                    <p>
                        Monitor and analyze your fleet
                        operations.
                    </p>

                </div>


                <button
                    className="operational-refresh"
                    onClick={fetchAnalytics}
                >
                    Refresh
                </button>

            </div>


            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

                <div className="operational-error">

                    {error}

                </div>

            )}


            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="operational-summary-grid">


                {/* TOTAL SHIPMENTS */}

                <div className="operational-summary-card">

                    <div className="operational-summary-icon">

                        <FaBoxOpen />

                    </div>

                    <div className="operational-summary-content">

                        <h3>
                            Total Shipments
                        </h3>

                        <strong>
                            {
                                analytics.total_shipments
                            }
                        </strong>

                    </div>

                </div>


                {/* ACTIVE TRIPS */}

                <div className="operational-summary-card">

                    <div className="operational-summary-icon">

                        <FaRoute />

                    </div>

                    <div className="operational-summary-content">

                        <h3>
                            Active Trips
                        </h3>

                        <strong>
                            {
                                analytics.active_trips
                            }
                        </strong>

                    </div>

                </div>


                {/* DELIVERED */}

                <div className="operational-summary-card">

                    <div className="operational-summary-icon">

                        <FaCheckCircle />

                    </div>

                    <div className="operational-summary-content">

                        <h3>
                            Delivered
                        </h3>

                        <strong>
                            {
                                analytics.delivered_shipments
                            }
                        </strong>

                    </div>

                </div>


                {/* DELAYED */}

                <div className="operational-summary-card">

                    <div className="operational-summary-icon">

                        <FaClock />

                    </div>

                    <div className="operational-summary-content">

                        <h3>
                            Delayed
                        </h3>

                        <strong>
                            {
                                analytics.delayed_shipments
                            }
                        </strong>

                    </div>

                </div>

            </div>


            {/* ==================================================
                ANALYTICS CARDS
            ================================================== */}

            <div className="operational-analytics-grid">


                {/* FLEET */}

                <div className="operational-analytics-card">

                    <h2>
                        Fleet Overview
                    </h2>

                    <p>
                        Current fleet utilization
                        information.
                    </p>


                    <div className="operational-status-list">

                        <div className="operational-status-item">

                            <span>
                                Total Vehicles
                            </span>

                            <strong>
                                {
                                    analytics.total_vehicles
                                }
                            </strong>

                        </div>


                        <div className="operational-status-item">

                            <span>
                                Utilization
                            </span>

                            <strong>
                                {
                                    analytics.fleet_utilization
                                }%
                            </strong>

                        </div>

                    </div>

                </div>


                {/* PERFORMANCE */}

                <div className="operational-analytics-card">

                    <h2>
                        Delivery Performance
                    </h2>

                    <p>
                        Current shipment delivery
                        performance.
                    </p>


                    <div className="operational-performance-list">


                        <div className="operational-performance-item">

                            <div className="operational-performance-header">

                                <span>
                                    Delivered
                                </span>

                                <strong>
                                    {
                                        analytics.delivered_shipments
                                    }
                                </strong>

                            </div>

                            <div className="operational-progress">

                                <div
                                    className="operational-progress-bar"
                                    style={{
                                        width:
                                            analytics.total_shipments > 0
                                                ? `${Math.min(
                                                    100,
                                                    (
                                                        analytics.delivered_shipments /
                                                        analytics.total_shipments
                                                    ) * 100
                                                )}%`
                                                : "0%",
                                    }}
                                />

                            </div>

                        </div>


                        <div className="operational-performance-item">

                            <div className="operational-performance-header">

                                <span>
                                    Delayed
                                </span>

                                <strong>
                                    {
                                        analytics.delayed_shipments
                                    }
                                </strong>

                            </div>

                            <div className="operational-progress">

                                <div
                                    className="operational-progress-bar"
                                    style={{
                                        width:
                                            analytics.total_shipments > 0
                                                ? `${Math.min(
                                                    100,
                                                    (
                                                        analytics.delayed_shipments /
                                                        analytics.total_shipments
                                                    ) * 100
                                                )}%`
                                                : "0%",
                                    }}
                                />

                            </div>

                        </div>

                    </div>

                </div>


                {/* OPERATIONAL STATUS */}

                <div className="operational-analytics-card">

                    <h2>
                        Operational Status
                    </h2>

                    <p>
                        Current fleet and shipment
                        activity.
                    </p>


                    <div className="operational-chart">

                        <div>

                            <FaChartLine
                                style={{
                                    fontSize: "42px",
                                    marginBottom: "12px",
                                }}
                            />

                            <div>
                                Analytics data
                                overview
                            </div>

                        </div>

                    </div>

                </div>


                {/* VEHICLE ACTIVITY */}

                <div className="operational-analytics-card">

                    <h2>
                        Vehicle Activity
                    </h2>

                    <p>
                        Current vehicle availability
                        and utilization.
                    </p>


                    <div className="operational-chart">

                        <div>

                            <FaTruck
                                style={{
                                    fontSize: "42px",
                                    marginBottom: "12px",
                                }}
                            />

                            <div>
                                {
                                    analytics.total_vehicles
                                } vehicles registered
                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}


export default OperationalAnalytics;