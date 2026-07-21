import { useEffect, useState } from "react";

import Layout from "../components/Layout";
import StatCard from "../components/StatCard";

import "../styles/dashboard.css";

import { getDashboardData } from "../services/dashboardService";

function Dashboard() {

    const [stats, setStats] = useState({
        vehicles: 0,
        drivers: 0,
        shipments: 0,
        trips: 0,
        fuel_records: 0,
        maintenance: 0
    });

    useEffect(() => {

        async function loadDashboard() {
            try {
                const data = await getDashboardData();
                setStats(data);
            } catch (error) {
                console.error(error);
            }
        }

        loadDashboard();

    }, []);

    return (

        <Layout>

            <div className="dashboard">

                <div className="cards">

                    <StatCard
                        title="Vehicles"
                        value={stats.vehicles}
                        color="#3b82f6"
                    />

                    <StatCard
                        title="Drivers"
                        value={stats.drivers}
                        color="#22c55e"
                    />

                    <StatCard
                        title="Shipments"
                        value={stats.shipments}
                        color="#f97316"
                    />

                    <StatCard
                        title="Trips"
                        value={stats.trips}
                        color="#ef4444"
                    />

                    <StatCard
                        title="Fuel Records"
                        value={stats.fuel_records}
                        color="#8b5cf6"
                    />

                    <StatCard
                        title="Maintenance"
                        value={stats.maintenance}
                        color="#14b8a6"
                    />

                </div>

            </div>

        </Layout>

    );
}

export default Dashboard;