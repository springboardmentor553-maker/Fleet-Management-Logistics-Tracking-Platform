import { useEffect, useState } from "react";

import {
    FaTruck,
    FaRoute,
    FaCheckCircle,
    FaClock,
    FaChartLine,
    FaTachometerAlt,
    FaTools,
} from "react-icons/fa";

import api from "../services/api";

import "./FleetPerformance.css";


// ==========================================================
// FLEET PERFORMANCE
// ==========================================================

function FleetPerformance() {

    const [performance, setPerformance] = useState({

        total_vehicles: 0,

        available_vehicles: 0,

        active_vehicles: 0,

        maintenance_vehicles: 0,

        inactive_vehicles: 0,

        completed_trips: 0,

        active_trips: 0,

        delayed_trips: 0,

        utilization: 0,

    });


    const [loading, setLoading] =
        useState(true);


    const [error, setError] =
        useState("");


    // ==========================================================
    // FETCH PERFORMANCE
    // ==========================================================

    useEffect(() => {

        fetchFleetPerformance();

    }, []);


    // ==========================================================
    // FETCH DATA
    // ==========================================================

    const fetchFleetPerformance = async () => {

        try {

            setLoading(true);

            setError("");


            const response =
                await api.get(
                    "/dashboard"
                );


            const data =
                response.data || {};


            // ==================================================
            // VEHICLES
            // ==================================================

            const totalVehicles =
                Number(
                    data.total_vehicles ??
                    data.totalVehicles ??
                    0
                );


            const availableVehicles =
                Number(
                    data.available_vehicles ??
                    data.availableVehicles ??
                    data.available ??
                    0
                );


            const activeVehicles =
                Number(
                    data.active_vehicles ??
                    data.activeVehicles ??
                    data.on_trip ??
                    data.onTrip ??
                    data.active_deliveries ??
                    data.activeDeliveries ??
                    0
                );


            const maintenanceVehicles =
                Number(
                    data.maintenance_vehicles ??
                    data.maintenanceVehicles ??
                    data.maintenance ??
                    0
                );


            const inactiveVehicles =
                Number(
                    data.inactive_vehicles ??
                    data.inactiveVehicles ??
                    data.inactive ??
                    0
                );


            // ==================================================
            // TRIPS
            // ==================================================

            const completedTrips =
                Number(
                    data.completed_trips ??
                    data.completedTrips ??
                    data.delivered_shipments ??
                    data.deliveredShipments ??
                    0
                );


            const activeTrips =
                Number(
                    data.active_trips ??
                    data.activeTrips ??
                    data.active_deliveries ??
                    data.activeDeliveries ??
                    0
                );


            const delayedTrips =
                Number(
                    data.delayed_trips ??
                    data.delayedTrips ??
                    data.delayed_shipments ??
                    data.delayedShipments ??
                    0
                );


            // ==================================================
            // UTILIZATION
            // ==================================================

            let utilization = 0;


            if (totalVehicles > 0) {

                utilization =
                    Math.round(
                        (
                            activeVehicles /
                            totalVehicles
                        ) * 100
                    );
            }


            // ==================================================
            // SAVE DATA
            // ==================================================

            setPerformance({

                total_vehicles:
                    totalVehicles,

                available_vehicles:
                    availableVehicles,

                active_vehicles:
                    activeVehicles,

                maintenance_vehicles:
                    maintenanceVehicles,

                inactive_vehicles:
                    inactiveVehicles,

                completed_trips:
                    completedTrips,

                active_trips:
                    activeTrips,

                delayed_trips:
                    delayedTrips,

                utilization:
                    Math.min(
                        100,
                        Math.max(
                            0,
                            utilization
                        )
                    ),

            });

        } catch (error) {

            console.error(
                "Fleet Performance error:",
                error
            );

            setError(
                "Unable to load fleet performance data."
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

            <div className="fleet-performance-page">

                <div className="fleet-performance-loading">

                    Loading Fleet Performance...

                </div>

            </div>

        );
    }


    // ==========================================================
    // PAGE
    // ==========================================================

    return (

        <div className="fleet-performance-page">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="fleet-performance-header">

                <div>

                    <h1>
                        Fleet Performance
                    </h1>

                    <p>
                        Monitor vehicle utilization,
                        trip performance and fleet
                        efficiency.
                    </p>

                </div>


                <button
                    type="button"
                    className="fleet-performance-refresh"
                    onClick={
                        fetchFleetPerformance
                    }
                >
                    Refresh
                </button>

            </div>


            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

                <div className="fleet-performance-error">

                    {error}

                </div>

            )}


            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="fleet-performance-cards">


                {/* TOTAL VEHICLES */}

                <div className="fleet-performance-card">

                    <div className="fleet-performance-card-icon">

                        <FaTruck />

                    </div>

                    <div>

                        <h3>
                            Total Vehicles
                        </h3>

                        <strong>
                            {
                                performance.total_vehicles
                            }
                        </strong>

                    </div>

                </div>


                {/* AVAILABLE */}

                <div className="fleet-performance-card">

                    <div className="fleet-performance-card-icon">

                        <FaCheckCircle />

                    </div>

                    <div>

                        <h3>
                            Available
                        </h3>

                        <strong>
                            {
                                performance.available_vehicles
                            }
                        </strong>

                    </div>

                </div>


                {/* ON TRIP */}

                <div className="fleet-performance-card">

                    <div className="fleet-performance-card-icon">

                        <FaRoute />

                    </div>

                    <div>

                        <h3>
                            On Trip
                        </h3>

                        <strong>
                            {
                                performance.active_vehicles
                            }
                        </strong>

                    </div>

                </div>


                {/* MAINTENANCE */}

                <div className="fleet-performance-card">

                    <div className="fleet-performance-card-icon">

                        <FaTools />

                    </div>

                    <div>

                        <h3>
                            Maintenance
                        </h3>

                        <strong>
                            {
                                performance.maintenance_vehicles
                            }
                        </strong>

                    </div>

                </div>

            </div>


            {/* ==================================================
                MAIN PERFORMANCE GRID
            ================================================== */}

            <div className="fleet-performance-grid">


                {/* ==================================================
                    UTILIZATION
                ================================================== */}

                <div className="fleet-performance-panel">

                    <div className="fleet-performance-panel-header">

                        <div>

                            <h2>
                                Fleet Utilization
                            </h2>

                            <p>
                                Current vehicle usage
                                across the fleet.
                            </p>

                        </div>


                        <FaTachometerAlt
                            className="fleet-performance-panel-icon"
                        />

                    </div>


                    <div className="fleet-utilization-content">


                        <div className="fleet-utilization-circle">

                            <div>

                                <strong>
                                    {
                                        performance.utilization
                                    }%
                                </strong>

                                <span>
                                    Utilized
                                </span>

                            </div>

                        </div>


                        <div className="fleet-utilization-details">


                            <div className="fleet-detail-row">

                                <span>
                                    Total Vehicles
                                </span>

                                <strong>
                                    {
                                        performance.total_vehicles
                                    }
                                </strong>

                            </div>


                            <div className="fleet-detail-row">

                                <span>
                                    Available
                                </span>

                                <strong>
                                    {
                                        performance.available_vehicles
                                    }
                                </strong>

                            </div>


                            <div className="fleet-detail-row">

                                <span>
                                    On Trip
                                </span>

                                <strong>
                                    {
                                        performance.active_vehicles
                                    }
                                </strong>

                            </div>


                            <div className="fleet-detail-row">

                                <span>
                                    Maintenance
                                </span>

                                <strong>
                                    {
                                        performance.maintenance_vehicles
                                    }
                                </strong>

                            </div>


                            <div className="fleet-detail-row">

                                <span>
                                    Inactive
                                </span>

                                <strong>
                                    {
                                        performance.inactive_vehicles
                                    }
                                </strong>

                            </div>

                        </div>

                    </div>

                </div>


                {/* ==================================================
                    TRIP PERFORMANCE
                ================================================== */}

                <div className="fleet-performance-panel">

                    <div className="fleet-performance-panel-header">

                        <div>

                            <h2>
                                Trip Performance
                            </h2>

                            <p>
                                Current trip activity
                                and completion.
                            </p>

                        </div>


                        <FaChartLine
                            className="fleet-performance-panel-icon"
                        />

                    </div>


                    <div className="fleet-trip-stats">


                        <div className="fleet-trip-stat">

                            <span>
                                Active Trips
                            </span>

                            <strong>
                                {
                                    performance.active_trips
                                }
                            </strong>

                        </div>


                        <div className="fleet-trip-stat">

                            <span>
                                Completed Trips
                            </span>

                            <strong>
                                {
                                    performance.completed_trips
                                }
                            </strong>

                        </div>


                        <div className="fleet-trip-stat">

                            <span>
                                Delayed Trips
                            </span>

                            <strong>
                                {
                                    performance.delayed_trips
                                }
                            </strong>

                        </div>

                    </div>


                    <div className="fleet-performance-progress">

                        <div className="fleet-performance-progress-header">

                            <span>
                                Completion Performance
                            </span>

                            <strong>

                                {
                                    (
                                        performance.completed_trips +
                                        performance.active_trips +
                                        performance.delayed_trips
                                    ) > 0
                                        ? Math.round(
                                            (
                                                performance.completed_trips /
                                                (
                                                    performance.completed_trips +
                                                    performance.active_trips +
                                                    performance.delayed_trips
                                                )
                                            ) * 100
                                        )
                                        : 0
                                }%

                            </strong>

                        </div>


                        <div className="fleet-performance-progress-track">

                            <div
                                className="fleet-performance-progress-bar"
                                style={{
                                    width:
                                        (
                                            performance.completed_trips +
                                            performance.active_trips +
                                            performance.delayed_trips
                                        ) > 0
                                            ? `${Math.min(
                                                100,
                                                (
                                                    performance.completed_trips /
                                                    (
                                                        performance.completed_trips +
                                                        performance.active_trips +
                                                        performance.delayed_trips
                                                    )
                                                ) * 100
                                            )}%`
                                            : "0%",
                                }}
                            />

                        </div>

                    </div>

                </div>

            </div>


            {/* ==================================================
                FLEET STATUS
            ================================================== */}

            <div className="fleet-status-panel">

                <div className="fleet-status-header">

                    <div>

                        <h2>
                            Fleet Status
                        </h2>

                        <p>
                            Current distribution of
                            vehicles.
                        </p>

                    </div>

                </div>


                <div className="fleet-status-grid">


                    {/* AVAILABLE */}

                    <div className="fleet-status-item">

                        <div className="fleet-status-item-top">

                            <span>
                                Available
                            </span>

                            <strong>
                                {
                                    performance.available_vehicles
                                }
                            </strong>

                        </div>


                        <div className="fleet-status-progress">

                            <div
                                className="fleet-status-progress-bar"
                                style={{
                                    width:
                                        performance.total_vehicles > 0
                                            ? `${Math.min(
                                                100,
                                                (
                                                    performance.available_vehicles /
                                                    performance.total_vehicles
                                                ) * 100
                                            )}%`
                                            : "0%",
                                }}
                            />

                        </div>

                    </div>


                    {/* ON TRIP */}

                    <div className="fleet-status-item">

                        <div className="fleet-status-item-top">

                            <span>
                                On Trip
                            </span>

                            <strong>
                                {
                                    performance.active_vehicles
                                }
                            </strong>

                        </div>


                        <div className="fleet-status-progress">

                            <div
                                className="fleet-status-progress-bar"
                                style={{
                                    width:
                                        performance.total_vehicles > 0
                                            ? `${Math.min(
                                                100,
                                                (
                                                    performance.active_vehicles /
                                                    performance.total_vehicles
                                                ) * 100
                                            )}%`
                                            : "0%",
                                }}
                            />

                        </div>

                    </div>


                    {/* MAINTENANCE */}

                    <div className="fleet-status-item">

                        <div className="fleet-status-item-top">

                            <span>
                                Maintenance
                            </span>

                            <strong>
                                {
                                    performance.maintenance_vehicles
                                }
                            </strong>

                        </div>


                        <div className="fleet-status-progress">

                            <div
                                className="fleet-status-progress-bar"
                                style={{
                                    width:
                                        performance.total_vehicles > 0
                                            ? `${Math.min(
                                                100,
                                                (
                                                    performance.maintenance_vehicles /
                                                    performance.total_vehicles
                                                ) * 100
                                            )}%`
                                            : "0%",
                                }}
                            />

                        </div>

                    </div>


                    {/* INACTIVE */}

                    <div className="fleet-status-item">

                        <div className="fleet-status-item-top">

                            <span>
                                Inactive
                            </span>

                            <strong>
                                {
                                    performance.inactive_vehicles
                                }
                            </strong>

                        </div>


                        <div className="fleet-status-progress">

                            <div
                                className="fleet-status-progress-bar"
                                style={{
                                    width:
                                        performance.total_vehicles > 0
                                            ? `${Math.min(
                                                100,
                                                (
                                                    performance.inactive_vehicles /
                                                    performance.total_vehicles
                                                ) * 100
                                            )}%`
                                            : "0%",
                                }}
                            />

                        </div>

                    </div>


                </div>

            </div>


        </div>
    );
}


export default FleetPerformance;