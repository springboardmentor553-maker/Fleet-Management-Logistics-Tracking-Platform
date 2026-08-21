import { useEffect, useState } from "react";
import {
    FaGasPump,
    FaMoneyBillWave,
    FaChartLine,
    FaArrowUp,
    FaArrowDown,
    FaCalculator,
    FaSyncAlt,
    FaExclamationTriangle
} from "react-icons/fa";

import Layout from "../components/Layout";
import { getFuelAnalytics } from "../services/fuelAnalyticsService";

import "../styles/fuelAnalytics.css";


function FuelAnalytics() {

    const [analytics, setAnalytics] = useState({
        total_records: 0,
        total_fuel_consumed: 0,
        total_fuel_cost: 0,
        average_fuel_bill: 0,
        highest_fuel_bill: 0,
        lowest_fuel_bill: 0
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);


    // =====================================================
    // LOAD ANALYTICS
    // =====================================================

    useEffect(() => {
        loadAnalytics();
    }, []);


    const loadAnalytics = async (isRefresh = false) => {

        try {

            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const data = await getFuelAnalytics();

            console.log("Fuel Analytics:", data);

            setAnalytics({
                total_records: Number(data?.total_records || 0),
                total_fuel_consumed: Number(
                    data?.total_fuel_consumed || 0
                ),
                total_fuel_cost: Number(
                    data?.total_fuel_cost || 0
                ),
                average_fuel_bill: Number(
                    data?.average_fuel_bill || 0
                ),
                highest_fuel_bill: Number(
                    data?.highest_fuel_bill || 0
                ),
                lowest_fuel_bill: Number(
                    data?.lowest_fuel_bill || 0
                )
            });

        } catch (error) {

            console.error(
                "Failed to load fuel analytics:",
                error
            );

        } finally {

            setLoading(false);
            setRefreshing(false);

        }
    };


    // =====================================================
    // FORMAT CURRENCY
    // =====================================================

    const formatCurrency = (value) => {

        return Number(value || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    };


    // =====================================================
    // FORMAT NUMBER
    // =====================================================

    const formatNumber = (value) => {

        return Number(value || 0).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        );
    };


    // =====================================================
    // LOADING SCREEN
    // =====================================================

    if (loading) {

        return (

            <Layout>

                <div className="fuel-analytics-page">

                    <div className="fuel-loading">

                        <div className="loading-spinner"></div>

                        <h2>
                            Loading Fuel Analytics
                        </h2>

                        <p>
                            Fetching the latest fuel performance data...
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

            <div className="fuel-analytics-page">


                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <div className="fuel-page-header">

                    <div className="fuel-header-content">

                        <div className="fuel-header-icon">
                            <FaGasPump />
                        </div>

                        <div>

                            <h1>
                                Fuel Analytics
                            </h1>

                            <p>
                                Monitor fuel consumption,
                                costs and billing performance.
                            </p>

                        </div>

                    </div>


                    <button
                        className="refresh-btn"
                        type="button"
                        onClick={() => loadAnalytics(true)}
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
                            : "Refresh Data"
                        }

                    </button>

                </div>


                {/* =================================================
                    OVERVIEW
                ================================================= */}

                <div className="analytics-section-header">

                    <div>

                        <span className="section-label">
                            FUEL OVERVIEW
                        </span>

                        <h2>
                            Current Fuel Statistics
                        </h2>

                    </div>

                </div>


                {/* =================================================
                    SUMMARY CARDS
                ================================================= */}

                <div className="fuel-summary-grid">


                    {/* TOTAL RECORDS */}

                    <div className="fuel-stat-card">

                        <div className="fuel-stat-top">

                            <div className="fuel-stat-icon blue">
                                <FaGasPump />
                            </div>

                            <span className="stat-badge">
                                Records
                            </span>

                        </div>

                        <div className="fuel-stat-content">

                            <h3>
                                {formatNumber(
                                    analytics.total_records
                                )}
                            </h3>

                            <p>
                                Total fuel transactions
                            </p>

                        </div>

                    </div>


                    {/* TOTAL FUEL */}

                    <div className="fuel-stat-card">

                        <div className="fuel-stat-top">

                            <div className="fuel-stat-icon green">
                                <FaChartLine />
                            </div>

                            <span className="stat-badge">
                                Consumption
                            </span>

                        </div>

                        <div className="fuel-stat-content">

                            <h3>

                                {formatNumber(
                                    analytics.total_fuel_consumed
                                )}

                                <span className="unit">
                                    L
                                </span>

                            </h3>

                            <p>
                                Total fuel consumed
                            </p>

                        </div>

                    </div>


                    {/* TOTAL COST */}

                    <div className="fuel-stat-card">

                        <div className="fuel-stat-top">

                            <div className="fuel-stat-icon orange">
                                <FaMoneyBillWave />
                            </div>

                            <span className="stat-badge">
                                Expenses
                            </span>

                        </div>

                        <div className="fuel-stat-content">

                            <h3>
                                ₹ {formatCurrency(
                                    analytics.total_fuel_cost
                                )}
                            </h3>

                            <p>
                                Total fuel expenditure
                            </p>

                        </div>

                    </div>


                    {/* AVERAGE BILL */}

                    <div className="fuel-stat-card">

                        <div className="fuel-stat-top">

                            <div className="fuel-stat-icon purple">
                                <FaCalculator />
                            </div>

                            <span className="stat-badge">
                                Average
                            </span>

                        </div>

                        <div className="fuel-stat-content">

                            <h3>
                                ₹ {formatCurrency(
                                    analytics.average_fuel_bill
                                )}
                            </h3>

                            <p>
                                Average fuel bill
                            </p>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    BILL ANALYSIS
                ================================================= */}

                <div className="analytics-section-header bill-header">

                    <div>

                        <span className="section-label">
                            BILL ANALYSIS
                        </span>

                        <h2>
                            Fuel Bill Performance
                        </h2>

                    </div>

                </div>


                <div className="bill-analysis-grid">


                    {/* HIGHEST */}

                    <div className="bill-card highest">

                        <div className="bill-icon">

                            <FaArrowUp />

                        </div>

                        <div className="bill-info">

                            <span>
                                Highest Fuel Bill
                            </span>

                            <strong>
                                ₹ {formatCurrency(
                                    analytics.highest_fuel_bill
                                )}
                            </strong>

                            <small>
                                Maximum recorded transaction
                            </small>

                        </div>

                    </div>


                    {/* AVERAGE */}

                    <div className="bill-card average">

                        <div className="bill-icon">

                            <FaCalculator />

                        </div>

                        <div className="bill-info">

                            <span>
                                Average Fuel Bill
                            </span>

                            <strong>
                                ₹ {formatCurrency(
                                    analytics.average_fuel_bill
                                )}
                            </strong>

                            <small>
                                Average transaction value
                            </small>

                        </div>

                    </div>


                    {/* LOWEST */}

                    <div className="bill-card lowest">

                        <div className="bill-icon">

                            <FaArrowDown />

                        </div>

                        <div className="bill-info">

                            <span>
                                Lowest Fuel Bill
                            </span>

                            <strong>
                                ₹ {formatCurrency(
                                    analytics.lowest_fuel_bill
                                )}
                            </strong>

                            <small>
                                Minimum recorded transaction
                            </small>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    INSIGHT
                ================================================= */}

                <div className="fuel-insight-card">

                    <div className="insight-icon">

                        <FaChartLine />

                    </div>

                    <div className="insight-content">

                        <span>
                            FLEET INSIGHT
                        </span>

                        <h3>
                            Fuel expenditure overview
                        </h3>

                        <p>

                            Your fleet has recorded{" "}

                            <strong>
                                {formatNumber(
                                    analytics.total_fuel_consumed
                                )} L
                            </strong>{" "}

                            of fuel consumption across{" "}

                            <strong>
                                {formatNumber(
                                    analytics.total_records
                                )}
                            </strong>{" "}

                            fuel transactions, with a total
                            expenditure of{" "}

                            <strong>
                                ₹ {formatCurrency(
                                    analytics.total_fuel_cost
                                )}
                            </strong>.

                        </p>

                    </div>

                </div>


            </div>

        </Layout>

    );
}


export default FuelAnalytics;