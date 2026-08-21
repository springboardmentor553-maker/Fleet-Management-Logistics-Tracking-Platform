import { useEffect, useState } from "react";

import {
    FaRoute,
    FaCheckCircle,
    FaClock,
    FaTimesCircle,
    FaRoad,
    FaStopwatch,
    FaSyncAlt,
    FaChartLine,
    FaTruck
} from "react-icons/fa";

import Layout from "../components/Layout";

import {
    getOperationsAnalytics
} from "../services/operationsAnalyticsService";

import "../styles/operationsAnalytics.css";


function OperationsAnalytics() {

    const [data, setData] = useState({

        total_deliveries: 0,

        successful_deliveries: 0,

        delayed_deliveries: 0,

        cancelled_deliveries: 0,

        average_trip_distance: 0,

        average_delivery_time_hours: 0

    });


    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);


    // =====================================================
    // LOAD DATA
    // =====================================================

    useEffect(() => {

        loadData();

    }, []);


    const loadData = async (
        isRefresh = false
    ) => {

        try {

            if (isRefresh) {

                setRefreshing(true);

            } else {

                setLoading(true);

            }


            const response =
                await getOperationsAnalytics();


            console.log(
                "Operations Analytics:",
                response
            );


            setData({

                total_deliveries:
                    Number(
                        response?.total_deliveries || 0
                    ),

                successful_deliveries:
                    Number(
                        response?.successful_deliveries || 0
                    ),

                delayed_deliveries:
                    Number(
                        response?.delayed_deliveries || 0
                    ),

                cancelled_deliveries:
                    Number(
                        response?.cancelled_deliveries || 0
                    ),

                average_trip_distance:
                    Number(
                        response?.average_trip_distance || 0
                    ),

                average_delivery_time_hours:
                    Number(
                        response
                            ?.average_delivery_time_hours
                        || 0
                    )

            });

        }

        catch (error) {

            console.error(
                "Failed to load operations analytics:",
                error
            );

        }

        finally {

            setLoading(false);

            setRefreshing(false);

        }

    };


    // =====================================================
    // FORMAT NUMBER
    // =====================================================

    const formatNumber = (
        value
    ) => {

        return Number(
            value || 0
        ).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        );

    };


    // =====================================================
    // RATES
    // =====================================================

    const successRate =
        data.total_deliveries > 0

            ? (
                data.successful_deliveries
                /
                data.total_deliveries
            ) * 100

            : 0;


    const delayRate =
        data.total_deliveries > 0

            ? (
                data.delayed_deliveries
                /
                data.total_deliveries
            ) * 100

            : 0;


    const cancellationRate =
        data.total_deliveries > 0

            ? (
                data.cancelled_deliveries
                /
                data.total_deliveries
            ) * 100

            : 0;


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <Layout>

                <div className="operations-page">

                    <div className="operations-loading">

                        <div className="operations-spinner"></div>

                        <h2>
                            Loading Operations Analytics
                        </h2>

                        <p>
                            Fetching the latest
                            operational data...
                        </p>

                    </div>

                </div>

            </Layout>

        );

    }


    // =====================================================
    // PAGE
    // =====================================================

    return (

        <Layout>

            <div className="operations-page">


                {/* HEADER */}

                <div className="operations-page-header">

                    <div className="operations-header-content">

                        <div className="operations-header-icon">

                            <FaRoute />

                        </div>

                        <div>

                            <h1>
                                Operations Analytics
                            </h1>

                            <p>
                                Monitor delivery performance,
                                trip efficiency and
                                operational reliability.
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="operations-refresh-btn"
                        onClick={() =>
                            loadData(true)
                        }
                        disabled={refreshing}
                    >

                        <FaSyncAlt
                            className={
                                refreshing
                                    ? "operations-refresh-spin"
                                    : ""
                            }
                        />

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh Data"
                        }

                    </button>

                </div>


                {/* OVERVIEW */}

                <div className="operations-section-header">

                    <div>

                        <span className="operations-section-label">

                            OPERATIONS OVERVIEW

                        </span>

                        <h2>
                            Current Operational Statistics
                        </h2>

                    </div>

                </div>


                {/* SUMMARY */}

                <div className="operations-summary-grid">


                    {/* TOTAL */}

                    <div className="operations-stat-card">

                        <div className="operations-stat-top">

                            <div className="operations-stat-icon blue">

                                <FaTruck />

                            </div>

                            <span className="operations-badge">
                                Deliveries
                            </span>

                        </div>

                        <div className="operations-stat-content">

                            <h3>
                                {formatNumber(
                                    data.total_deliveries
                                )}
                            </h3>

                            <p>
                                Total deliveries
                            </p>

                        </div>

                    </div>


                    {/* SUCCESSFUL */}

                    <div className="operations-stat-card">

                        <div className="operations-stat-top">

                            <div className="operations-stat-icon green">

                                <FaCheckCircle />

                            </div>

                            <span className="operations-badge success">

                                {successRate.toFixed(1)}%

                            </span>

                        </div>

                        <div className="operations-stat-content">

                            <h3>
                                {formatNumber(
                                    data.successful_deliveries
                                )}
                            </h3>

                            <p>
                                Successful deliveries
                            </p>

                        </div>

                    </div>


                    {/* DELAYED */}

                    <div className="operations-stat-card">

                        <div className="operations-stat-top">

                            <div className="operations-stat-icon orange">

                                <FaClock />

                            </div>

                            <span className="operations-badge warning">

                                {delayRate.toFixed(1)}%

                            </span>

                        </div>

                        <div className="operations-stat-content">

                            <h3>
                                {formatNumber(
                                    data.delayed_deliveries
                                )}
                            </h3>

                            <p>
                                Delayed deliveries
                            </p>

                        </div>

                    </div>


                    {/* CANCELLED */}

                    <div className="operations-stat-card">

                        <div className="operations-stat-top">

                            <div className="operations-stat-icon red">

                                <FaTimesCircle />

                            </div>

                            <span className="operations-badge danger">

                                {cancellationRate.toFixed(1)}%

                            </span>

                        </div>

                        <div className="operations-stat-content">

                            <h3>
                                {formatNumber(
                                    data.cancelled_deliveries
                                )}
                            </h3>

                            <p>
                                Cancelled deliveries
                            </p>

                        </div>

                    </div>

                </div>


                {/* TRIP PERFORMANCE */}

                <div className="operations-section-header performance-header">

                    <div>

                        <span className="operations-section-label">

                            TRIP PERFORMANCE

                        </span>

                        <h2>
                            Fleet Efficiency Metrics
                        </h2>

                    </div>

                </div>


                <div className="operations-performance-grid">


                    {/* DISTANCE */}

                    <div className="operations-performance-card">

                        <div className="performance-icon blue">

                            <FaRoad />

                        </div>

                        <div className="performance-content">

                            <span>
                                Average Trip Distance
                            </span>

                            <strong>

                                {formatNumber(
                                    data.average_trip_distance
                                )}

                                <small>
                                    km
                                </small>

                            </strong>

                            <p>
                                Average distance between
                                trip origin and destination
                            </p>

                        </div>

                    </div>


                    {/* TIME */}

                    <div className="operations-performance-card">

                        <div className="performance-icon purple">

                            <FaStopwatch />

                        </div>

                        <div className="performance-content">

                            <span>
                                Average Planned Delivery Time
                            </span>

                            <strong>

                                {formatNumber(
                                    data.average_delivery_time_hours
                                )}

                                <small>
                                    hrs
                                </small>

                            </strong>

                            <p>
                                Average planned duration
                                from departure to expected arrival
                            </p>

                        </div>

                    </div>


                    {/* SUCCESS RATE */}

                    <div className="operations-performance-card">

                        <div className="performance-icon green">

                            <FaChartLine />

                        </div>

                        <div className="performance-content">

                            <span>
                                Delivery Success Rate
                            </span>

                            <strong>

                                {successRate.toFixed(1)}

                                <small>
                                    %
                                </small>

                            </strong>

                            <p>
                                Percentage of successful
                                deliveries
                            </p>

                        </div>

                    </div>

                </div>


                {/* INSIGHT */}

                <div className="operations-insight-card">

                    <div className="operations-insight-icon">

                        <FaChartLine />

                    </div>


                    <div className="operations-insight-content">

                        <span>
                            FLEETFLOW OPERATIONAL INSIGHT
                        </span>

                        <h3>
                            Delivery performance overview
                        </h3>

                        <p>

                            Fleet operations currently show{" "}

                            <strong>
                                {formatNumber(
                                    data.total_deliveries
                                )}
                            </strong>{" "}

                            total deliveries, of which{" "}

                            <strong>
                                {formatNumber(
                                    data.successful_deliveries
                                )}
                            </strong>{" "}

                            were completed successfully.

                            The current delivery success
                            rate is{" "}

                            <strong>
                                {successRate.toFixed(1)}%
                            </strong>.

                        </p>

                    </div>

                </div>

            </div>

        </Layout>

    );

}


export default OperationsAnalytics;