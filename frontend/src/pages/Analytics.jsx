import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaChartLine } from "react-icons/fa";

import {
    getFleetAnalytics
} from "../services/analyticsService";

import VehicleStatusChart
    from "../components/charts/VehicleStatusChart";

import "../styles/analytics.css";

function Analytics() {

    const navigate = useNavigate();

    const [analytics, setAnalytics] = useState({
        vehicles: {},
        drivers: {},
        trips: {},
        expenses: {}
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {

        try {

            setLoading(true);

            const data = await getFleetAnalytics();

            console.log("Analytics Data:", data);

            setAnalytics(data);

        } catch (err) {

            console.error("Failed to load analytics:", err);

        } finally {

            setLoading(false);

        }
    };

    // -----------------------------------------
    // Vehicle chart data
    // -----------------------------------------

    const chartData = [
        {
            status: "Available",
            count: analytics.vehicles?.available || 0
        },
        {
            status: "In Transit",
            count: analytics.vehicles?.in_transit || 0
        },
        {
            status: "Maintenance",
            count: analytics.vehicles?.maintenance || 0
        }
    ];

    // -----------------------------------------
    // Loading
    // -----------------------------------------

    if (loading) {

        return (
            <div className="analytics-page">

                <button
                    className="analytics-back-button"
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft />
                    Back
                </button>

                <div className="analytics-loading">

                    <div className="analytics-spinner"></div>

                    <h3>Loading Analytics</h3>

                    <p>
                        Fetching the latest fleet performance data...
                    </p>

                </div>

            </div>
        );
    }

    return (

        <div className="analytics-page">

            {/* ---------------------------------
                Header
            ---------------------------------- */}

            <div className="analytics-header">

                <div>

                    <button
                        className="analytics-back-button"
                        onClick={() => navigate(-1)}
                    >
                        <FaArrowLeft />
                        Back
                    </button>

                    <div className="analytics-title">

                        <div className="analytics-title-icon">
                            <FaChartLine />
                        </div>

                        <div>

                            <h2>
                                Fleet Analytics
                            </h2>

                            <p>
                                Monitor fleet performance,
                                drivers, trips and expenses.
                            </p>

                        </div>

                    </div>

                </div>

            </div>


            {/* ---------------------------------
                Vehicle Overview
            ---------------------------------- */}

            <div className="analytics-section">

                <div className="analytics-section-header">

                    <div>
                        <h3>Vehicle Overview</h3>

                        <p>
                            Current fleet availability and status
                        </p>
                    </div>

                </div>


                <div className="analytics-cards">

                    <div className="analytics-card">

                        <div className="analytics-card-content">

                            <h4>Total Vehicles</h4>

                            <h1>
                                {analytics.vehicles?.total || 0}
                            </h1>

                        </div>

                    </div>


                    <div className="analytics-card">

                        <div className="analytics-card-content">

                            <h4>Available Vehicles</h4>

                            <h1>
                                {analytics.vehicles?.available || 0}
                            </h1>

                        </div>

                    </div>


                    <div className="analytics-card">

                        <div className="analytics-card-content">

                            <h4>Vehicles In Transit</h4>

                            <h1>
                                {analytics.vehicles?.in_transit || 0}
                            </h1>

                        </div>

                    </div>


                    <div className="analytics-card">

                        <div className="analytics-card-content">

                            <h4>Under Maintenance</h4>

                            <h1>
                                {analytics.vehicles?.maintenance || 0}
                            </h1>

                        </div>

                    </div>

                </div>

            </div>


            {/* ---------------------------------
                Driver Overview
            ---------------------------------- */}

            <div className="analytics-section">

                <div className="analytics-section-header">

                    <div>
                        <h3>Driver Overview</h3>

                        <p>
                            Driver availability and assignment status
                        </p>
                    </div>

                </div>


                <div className="analytics-cards">

                    <div className="analytics-card">

                        <div className="analytics-card-content">

                            <h4>Total Drivers</h4>

                            <h1>
                                {analytics.drivers?.total || 0}
                            </h1>

                        </div>

                    </div>


                    <div className="analytics-card">

                        <div className="analytics-card-content">

                            <h4>Available Drivers</h4>

                            <h1>
                                {analytics.drivers?.available || 0}
                            </h1>

                        </div>

                    </div>


                    <div className="analytics-card">

                        <div className="analytics-card-content">

                            <h4>Assigned Drivers</h4>

                            <h1>
                                {analytics.drivers?.assigned || 0}
                            </h1>

                        </div>

                    </div>

                </div>

            </div>


            {/* ---------------------------------
                Trip Overview
            ---------------------------------- */}

            <div className="analytics-section">

                <div className="analytics-section-header">

                    <div>
                        <h3>Trip Performance</h3>

                        <p>
                            Overview of fleet trip activity
                        </p>
                    </div>

                </div>


                <div className="analytics-cards">

                    <div className="analytics-card">

                        <div className="analytics-card-content">

                            <h4>Total Trips</h4>

                            <h1>
                                {analytics.trips?.total || 0}
                            </h1>

                        </div>

                    </div>


                    <div className="analytics-card">

                        <div className="analytics-card-content">

                            <h4>Completed Trips</h4>

                            <h1>
                                {analytics.trips?.completed || 0}
                            </h1>

                        </div>

                    </div>

                </div>

            </div>


            {/* ---------------------------------
                Expense Overview
            ---------------------------------- */}

            <div className="analytics-section">

                <div className="analytics-section-header">

                    <div>
                        <h3>Expense Overview</h3>

                        <p>
                            Fleet fuel and maintenance expenditure
                        </p>
                    </div>

                </div>


                <div className="analytics-cards">

                    <div className="analytics-card">

                        <div className="analytics-card-content">

                            <h4>Fuel Cost</h4>

                            <h1>
                                ₹ {Number(
                                    analytics.expenses?.fuel_cost || 0
                                ).toLocaleString("en-IN")}
                            </h1>

                        </div>

                    </div>


                    <div className="analytics-card">

                        <div className="analytics-card-content">

                            <h4>Maintenance Cost</h4>

                            <h1>
                                ₹ {Number(
                                    analytics.expenses?.maintenance_cost || 0
                                ).toLocaleString("en-IN")}
                            </h1>

                        </div>

                    </div>


                    <div className="analytics-card analytics-card-total">

                        <div className="analytics-card-content">

                            <h4>Total Fleet Expense</h4>

                            <h1>
                                ₹ {Number(
                                    analytics.expenses?.total_cost || 0
                                ).toLocaleString("en-IN")}
                            </h1>

                        </div>

                    </div>

                </div>

            </div>


            {/* ---------------------------------
                Vehicle Status Chart
            ---------------------------------- */}

            <div className="analytics-section">

                <div className="analytics-section-header">

                    <div>

                        <h3>
                            Vehicle Status Distribution
                        </h3>

                        <p>
                            Current distribution of vehicles across
                            operational states
                        </p>

                    </div>

                </div>


                <div className="analytics-chart-card">

                    <VehicleStatusChart
                        data={chartData}
                    />

                </div>

            </div>

        </div>
    );
}

export default Analytics;