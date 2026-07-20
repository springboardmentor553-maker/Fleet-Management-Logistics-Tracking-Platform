import { useEffect, useState } from "react";

import api from "../services/api";

import DashboardCard from "../components/Dashboard/DashboardCard";
import FleetChart from "../components/Dashboard/FleetChart";
import RecentDrivers from "../components/Dashboard/RecentDrivers";
import RecentVehicles from "../components/Dashboard/RecentVehicles";
import RecentShipments from "../components/Dashboard/RecentShipments";

import {
    FaUserTie,
    FaTruck,
    FaBoxOpen,
    FaCheckCircle
} from "react-icons/fa";

import "../components/Dashboard/Dashboard.css";

function Dashboard() {

    const [dashboard, setDashboard] = useState({

        total_drivers: 0,

        total_vehicles: 0,

        total_shipments: 0,

        available_vehicles: 0

    });

    useEffect(() => {

        fetchDashboard();

    }, []);

    const fetchDashboard = async () => {

        try {

            const drivers = await api.get("/drivers");

            const vehicles = await api.get("/vehicles");

            const shipments = await api.get("/shipments");

            setDashboard({

                total_drivers: drivers.data.length,

                total_vehicles: vehicles.data.length,

                total_shipments: shipments.data.length,

                available_vehicles: vehicles.data.filter(

                    (vehicle) => vehicle.status === "Available"

                ).length

            });

        }

        catch (error) {

            console.log(error);

        }

    };

    return (

        <div className="dashboard-page">

            <div className="dashboard-header">

                <div>

                    <h1>Fleet Dashboard</h1>

                    <p>

                        Welcome to FleetFlow Management System

                    </p>

                </div>

            </div>

            <div className="dashboard-cards">

                <DashboardCard

                    title="Drivers"

                    value={dashboard.total_drivers}

                    icon={<FaUserTie />}

                />

                <DashboardCard

                    title="Vehicles"

                    value={dashboard.total_vehicles}

                    icon={<FaTruck />}

                />

                <DashboardCard

                    title="Shipments"

                    value={dashboard.total_shipments}

                    icon={<FaBoxOpen />}

                />

                <DashboardCard

                    title="Available Vehicles"

                    value={dashboard.available_vehicles}

                    icon={<FaCheckCircle />}

                />

            </div>

            <div className="chart-section">

                <FleetChart dashboard={dashboard} />

            </div>

            <div className="tables-section">

                <RecentDrivers />

                <RecentVehicles />

                <RecentShipments />

            </div>

        </div>

    );

}

export default Dashboard;