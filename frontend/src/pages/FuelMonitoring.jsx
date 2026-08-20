import { useEffect, useState } from "react";

import {
    FaGasPump,
    FaTruck,
    FaChartLine,
    FaRoad,
    FaTachometerAlt,
    FaExclamationTriangle,
    FaSyncAlt,
} from "react-icons/fa";

import api from "../services/api";

import "./FuelMonitoring.css";


/* ==========================================================
   DEFAULT DATA
========================================================== */

const DEFAULT_FUEL_DATA = {
    totalFuelConsumed: 0,
    averageFuelConsumption: 0,
    totalDistance: 0,
    averageMileage: 0,
    activeVehicles: 0,
    lowFuelVehicles: 0,
    fuelEfficiency: 0,
};


/* ==========================================================
   NUMBER HELPER
========================================================== */

function safeNumber(value) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}


/* ==========================================================
   FORMAT NUMBER
========================================================== */

function formatNumber(
    value,
    decimals = 2
) {

    const number = safeNumber(value);

    return Number(
        number.toFixed(decimals)
    );
}


/* ==========================================================
   FUEL MONITORING
========================================================== */

function FuelMonitoring() {

    const [
        fuelData,
        setFuelData,
    ] = useState(
        DEFAULT_FUEL_DATA
    );


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState("");


    /* ======================================================
       LOAD DATA ON PAGE LOAD
    ====================================================== */

    useEffect(() => {

        loadFuelData();

    }, []);


    /* ======================================================
       LOAD FUEL DATA
    ====================================================== */

    const loadFuelData = async () => {

        try {

            setLoading(true);

            setError("");


            /* ==================================================
               GET FUEL MONITORING DATA
            ================================================== */

            const response =
                await api.get(
                    "/fuel-monitoring/"
                );


            const data =
                response?.data || {};


            /* ==================================================
               BACKEND STRUCTURE

               {
                   summary: {},
                   vehicle_performance: [],
                   alerts: []
               }
            ================================================== */

            const summary =
                data?.summary || {};


            const vehiclePerformance =
                Array.isArray(
                    data?.vehicle_performance
                )
                    ? data.vehicle_performance
                    : [];


            const alerts =
                Array.isArray(
                    data?.alerts
                )
                    ? data.alerts
                    : [];


            /* ==================================================
               SUMMARY VALUES
            ================================================== */

            const totalFuelConsumed =
                safeNumber(
                    summary?.total_fuel_consumed
                );


            const totalDistance =
                safeNumber(
                    summary?.total_distance
                );


            let averageFuelConsumption =
                safeNumber(
                    summary?.average_consumption
                );


            let averageMileage =
                safeNumber(
                    summary?.average_mileage
                );


            /* ==================================================
               CALCULATE VALUES IF BACKEND DOES NOT PROVIDE THEM
            ================================================== */

            if (
                averageFuelConsumption === 0 &&
                totalDistance > 0 &&
                totalFuelConsumed > 0
            ) {

                averageFuelConsumption =
                    (
                        totalFuelConsumed /
                        totalDistance
                    ) * 100;
            }


            if (
                averageMileage === 0 &&
                totalFuelConsumed > 0 &&
                totalDistance > 0
            ) {

                averageMileage =
                    totalDistance /
                    totalFuelConsumed;
            }


            /* ==================================================
               FUEL EFFICIENCY
            ================================================== */

            let fuelEfficiency =
                averageMileage;


            if (
                fuelEfficiency === 0 &&
                totalFuelConsumed > 0 &&
                totalDistance > 0
            ) {

                fuelEfficiency =
                    totalDistance /
                    totalFuelConsumed;
            }


            /* ==================================================
               LOW FUEL ALERTS

               The current backend may return:

               HIGH_CONSUMPTION
               LOW_MILEAGE

               We only count LOW_FUEL here.

               Therefore we do NOT incorrectly call
               high-consumption vehicles "low-fuel vehicles".
            ================================================== */

            const alertTypeSet = new Set([
               "LOW_FUEL",
               "LOW_MILEAGE",
               "HIGH_CONSUMPTION",
            ]);

            const relevantAlerts =
               alerts.filter(
                   (alert) =>
                       alertTypeSet.has(
                           String(
                               alert?.alert_type || ""
                           )
                               .trim()
                               .toUpperCase()
                       )
               );

            const attentionVehicleIds =
               new Set(
                   relevantAlerts
                       .map(
                           (alert) =>
                               Number(
                                   alert?.vehicle_id
                               )
                       )
                       .filter(
                           Number.isFinite
                       )
               );


            /* ==================================================
               ACTIVE / MONITORED VEHICLES

               The current fuel-monitoring API does not expose
               vehicle status.

               Therefore we use the number of vehicles that
               currently have fuel-monitoring records.

               This avoids inventing an "active" value.
            ================================================== */

            const monitoredVehicles =
                vehiclePerformance.length;


            /* ==================================================
               UPDATE STATE
            ================================================== */

            setFuelData({

                totalFuelConsumed:
                    formatNumber(
                        totalFuelConsumed
                    ),

                averageFuelConsumption:
                    formatNumber(
                        averageFuelConsumption
                    ),

                totalDistance:
                    formatNumber(
                        totalDistance
                    ),

                averageMileage:
                    formatNumber(
                        averageMileage
                    ),

                activeVehicles:
                    monitoredVehicles,

                lowFuelVehicles:
                    attentionVehicleIds.size,

                fuelEfficiency:
                    formatNumber(
                        fuelEfficiency
                    ),

            });


        } catch (err) {

            console.error(
                "Fuel Monitoring error:",
                err
            );


            /* ==================================================
               IMPORTANT

               Do NOT clear sessionStorage here.

               api.js handles 401 authentication errors.
            ================================================== */

            if (
                err?.response?.status === 401
            ) {

                setError(
                    "Your session has expired. Please login again."
                );

            } else if (
                err?.response?.status === 403
            ) {

                setError(
                    "You do not have permission to access Fuel Monitoring."
                );

            } else {

                setError(
                    "Unable to load fuel monitoring data."
                );
            }


            /* ==================================================
               KEEP PAGE FUNCTIONAL
            ================================================== */

            setFuelData(
                DEFAULT_FUEL_DATA
            );


        } finally {

            setLoading(false);

        }

    };


    /* ==========================================================
       LOADING
    ========================================================== */

    if (loading) {

        return (

            <div className="fuel-monitoring-page">

                <div className="fuel-monitoring-loading">

                    <FaGasPump />

                    <span>
                        Loading Fuel Monitoring...
                    </span>

                </div>

            </div>

        );

    }


    /* ==========================================================
       PAGE
    ========================================================== */

    return (

        <div className="fuel-monitoring-page">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="fuel-monitoring-header">

                <div>

                    <h1>
                        Fuel Monitoring
                    </h1>

                    <p>
                        Monitor fuel consumption,
                        mileage and fuel efficiency
                        across the fleet.
                    </p>

                </div>


                <button
                    type="button"
                    className="fuel-refresh-btn"
                    onClick={
                        loadFuelData
                    }
                    disabled={loading}
                >

                    <FaSyncAlt />

                    <span>
                        Refresh
                    </span>

                </button>

            </div>


            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

                <div className="fuel-error">

                    <FaExclamationTriangle />

                    <span>
                        {error}
                    </span>

                </div>

            )}


            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="fuel-summary-grid">


                {/* ==================================================
                    TOTAL FUEL
                ================================================== */}

                <div className="fuel-summary-card">

                    <div className="fuel-card-icon">

                        <FaGasPump />

                    </div>


                    <div>

                        <p>
                            Total Fuel Consumed
                        </p>

                        <h2>

                            {
                                fuelData.totalFuelConsumed
                            }

                            <small>
                                L
                            </small>

                        </h2>

                    </div>

                </div>


                {/* ==================================================
                    AVERAGE CONSUMPTION
                ================================================== */}

                <div className="fuel-summary-card">

                    <div className="fuel-card-icon">

                        <FaChartLine />

                    </div>


                    <div>

                        <p>
                            Average Consumption
                        </p>

                        <h2>

                            {
                                fuelData.averageFuelConsumption
                            }

                            <small>
                                L/100km
                            </small>

                        </h2>

                    </div>

                </div>


                {/* ==================================================
                    TOTAL DISTANCE
                ================================================== */}

                <div className="fuel-summary-card">

                    <div className="fuel-card-icon">

                        <FaRoad />

                    </div>


                    <div>

                        <p>
                            Total Distance
                        </p>

                        <h2>

                            {
                                fuelData.totalDistance
                            }

                            <small>
                                km
                            </small>

                        </h2>

                    </div>

                </div>


                {/* ==================================================
                    MILEAGE
                ================================================== */}

                <div className="fuel-summary-card">

                    <div className="fuel-card-icon">

                        <FaTachometerAlt />

                    </div>


                    <div>

                        <p>
                            Average Mileage
                        </p>

                        <h2>

                            {
                                fuelData.averageMileage
                            }

                            <small>
                                km/L
                            </small>

                        </h2>

                    </div>

                </div>

            </div>


            {/* ==================================================
                MAIN GRID
            ================================================== */}

            <div className="fuel-main-grid">


                {/* ==================================================
                    FUEL EFFICIENCY
                ================================================== */}

                <div className="fuel-panel">

                    <div className="fuel-panel-header">

                        <div>

                            <h2>
                                Fuel Efficiency
                            </h2>

                            <p>
                                Overall fleet fuel
                                performance.
                            </p>

                        </div>


                        <FaGasPump
                            className="fuel-panel-icon"
                        />

                    </div>


                    <div className="fuel-efficiency-content">


                        {/* ==================================================
                            EFFICIENCY CIRCLE
                        ================================================== */}

                        <div className="fuel-efficiency-circle">

                            <div>

                                <strong>

                                    {
                                        fuelData.fuelEfficiency
                                            ? fuelData.fuelEfficiency.toFixed(1)
                                            : "0.0"
                                    }

                                </strong>

                                <span>
                                    km/L
                                </span>

                            </div>

                        </div>


                        {/* ==================================================
                            EFFICIENCY INFORMATION
                        ================================================== */}

                        <div className="fuel-efficiency-info">


                            <div className="fuel-info-row">

                                <span>
                                    Fuel Consumed
                                </span>

                                <strong>

                                    {
                                        fuelData.totalFuelConsumed
                                    } L

                                </strong>

                            </div>


                            <div className="fuel-info-row">

                                <span>
                                    Distance Covered
                                </span>

                                <strong>

                                    {
                                        fuelData.totalDistance
                                    } km

                                </strong>

                            </div>


                            <div className="fuel-info-row">

                                <span>
                                    Average Mileage
                                </span>

                                <strong>

                                    {
                                        fuelData.averageMileage
                                    } km/L

                                </strong>

                            </div>


                        </div>

                    </div>

                </div>


                {/* ==================================================
                    FUEL ALERTS
                ================================================== */}

                <div className="fuel-panel">

                    <div className="fuel-panel-header">

                        <div>

                            <h2>
                                Fuel Alerts
                            </h2>

                            <p>
                                Vehicles requiring
                                attention.
                            </p>

                        </div>


                        <FaExclamationTriangle
                            className="fuel-warning-icon"
                        />

                    </div>


                    <div className="fuel-alert-content">


                        {/* ==================================================
                            LOW FUEL
                        ================================================== */}

                        <div className="fuel-alert-number">

                            <strong>
                                {
                                    fuelData.lowFuelVehicles
                                }
                            </strong>

                            <span>
                                Low Fuel Vehicles
                            </span>

                        </div>


                        {/* ==================================================
                            MONITORED VEHICLES
                        ================================================== */}

                        <div className="fuel-alert-number">

                            <strong>
                                {
                                    fuelData.activeVehicles
                                }
                            </strong>

                            <span>
                                Monitored Vehicles
                            </span>

                        </div>


                    </div>


                    <div className="fuel-alert-message">

                        <FaExclamationTriangle />

                        <span>

                            {
                                fuelData.lowFuelVehicles > 0
                                    ? "Some vehicles have fuel-monitoring alerts and require attention."
                                    : "No fuel-monitoring alerts currently require attention."
                            }

                        </span>

                    </div>

                </div>

            </div>


            {/* ==================================================
                FUEL MONITORING TABLE
            ================================================== */}

            <div className="fuel-table-card">

                <div className="fuel-table-header">

                    <div>

                        <h2>
                            Fuel Monitoring Overview
                        </h2>

                        <p>
                            Current fleet fuel
                            statistics.
                        </p>

                    </div>

                </div>


                <div className="fuel-table-wrapper">

                    <table className="fuel-table">

                        <thead>

                            <tr>

                                <th>
                                    Metric
                                </th>

                                <th>
                                    Value
                                </th>

                                <th>
                                    Unit
                                </th>

                                <th>
                                    Status
                                </th>

                            </tr>

                        </thead>


                        <tbody>


                            {/* ==================================================
                                TOTAL FUEL
                            ================================================== */}

                            <tr>

                                <td>
                                    Total Fuel Consumed
                                </td>

                                <td>
                                    {
                                        fuelData.totalFuelConsumed
                                    }
                                </td>

                                <td>
                                    Litres
                                </td>

                                <td>

                                    <span className="fuel-status normal">
                                        Monitored
                                    </span>

                                </td>

                            </tr>


                            {/* ==================================================
                                CONSUMPTION
                            ================================================== */}

                            <tr>

                                <td>
                                    Average Consumption
                                </td>

                                <td>
                                    {
                                        fuelData.averageFuelConsumption
                                    }
                                </td>

                                <td>
                                    L/100km
                                </td>

                                <td>

                                    <span className="fuel-status normal">
                                        Monitored
                                    </span>

                                </td>

                            </tr>


                            {/* ==================================================
                                MILEAGE
                            ================================================== */}

                            <tr>

                                <td>
                                    Average Mileage
                                </td>

                                <td>
                                    {
                                        fuelData.averageMileage
                                    }
                                </td>

                                <td>
                                    km/L
                                </td>

                                <td>

                                    <span
                                        className={
                                            fuelData.averageMileage > 0
                                                ? "fuel-status efficient"
                                                : "fuel-status normal"
                                        }
                                    >
                                        {
                                            fuelData.averageMileage > 0
                                                ? "Efficient"
                                                : "No Data"
                                        }
                                    </span>

                                </td>

                            </tr>


                            {/* ==================================================
                                LOW FUEL
                            ================================================== */}

                            <tr>

                                <td>
                                    Low Fuel Vehicles
                                </td>

                                <td>
                                    {
                                        fuelData.lowFuelVehicles
                                    }
                                </td>

                                <td>
                                    Vehicles
                                </td>

                                <td>

                                    <span
                                        className={
                                            fuelData.lowFuelVehicles > 0
                                                ? "fuel-status warning"
                                                : "fuel-status normal"
                                        }
                                    >

                                        {
                                            fuelData.lowFuelVehicles > 0
                                                ? "Attention Required"
                                                : "Normal"
                                        }

                                    </span>

                                </td>

                            </tr>


                        </tbody>

                    </table>

                </div>

            </div>


        </div>

    );

}


export default FuelMonitoring;