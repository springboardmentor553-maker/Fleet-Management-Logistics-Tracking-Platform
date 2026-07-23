import { useEffect, useState } from "react";

import api from "../services/api";
import RecentTrips from "../components/Dashboard/RecentTrips";

import RecentActiveDeliveries from "../components/Dashboard/RecentActiveDeliveries";

import RecentDeliveredShipments from "../components/Dashboard/RecentDeliveredShipments";

import RecentDelayedShipments from "../components/Dashboard/RecentDelayedShipments";

import RecentNotifications from "../components/Dashboard/RecentNotifications";
import DashboardCard from "../components/Dashboard/DashboardCard";
import FleetChart from "../components/Dashboard/FleetChart";
import RecentDrivers from "../components/Dashboard/RecentDrivers";
import RecentVehicles from "../components/Dashboard/RecentVehicles";
import RecentShipments from "../components/Dashboard/RecentShipments";

import {
  FaUserTie,
  FaTruck,
  FaBoxOpen,
  FaCheckCircle,
  FaShippingFast,
  FaClock,
  FaClipboardCheck,
  FaWarehouse,
} from "react-icons/fa";

import "../components/Dashboard/Dashboard.css";

function Dashboard() {
  const [dashboard, setDashboard] = useState({
    total_drivers: 0,
    total_vehicles: 0,
    total_shipments: 0,
    available_drivers: 0,
    available_vehicles: 0,
    active_deliveries: 0,
    delivered_shipments: 0,
    delayed_shipments: 0,
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get("/dashboard");

      setDashboard(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="dashboard-page">
      {/* Header */}

      <div className="dashboard-header">
        <div>
          <h1>Fleet Dashboard</h1>

          <p>Welcome to FleetFlow Management & Logistics Tracking Platform</p>
        </div>
      </div>

      {/* Summary Cards */}

      <div className="dashboard-cards">
        <DashboardCard
          title="Total Drivers"
          value={dashboard.total_drivers}
          icon={<FaUserTie />}
        />

        <DashboardCard
          title="Total Vehicles"
          value={dashboard.total_vehicles}
          icon={<FaTruck />}
        />

        <DashboardCard
          title="Total Shipments"
          value={dashboard.total_shipments}
          icon={<FaBoxOpen />}
        />

        <DashboardCard
          title="Available Drivers"
          value={dashboard.available_drivers}
          icon={<FaClipboardCheck />}
        />

        <DashboardCard
          title="Available Vehicles"
          value={dashboard.available_vehicles}
          icon={<FaCheckCircle />}
        />

        <DashboardCard
          title="Active Deliveries"
          value={dashboard.active_deliveries}
          icon={<FaShippingFast />}
        />

        <DashboardCard
          title="Delivered Shipments"
          value={dashboard.delivered_shipments}
          icon={<FaWarehouse />}
        />

        <DashboardCard
          title="Delayed Shipments"
          value={dashboard.delayed_shipments}
          icon={<FaClock />}
        />
      </div>

      {/* Chart */}

      <div className="chart-section">
        <FleetChart dashboard={dashboard} />
      </div>

      {/* Recent Tables */}

      <div className="tables-section">
        <RecentDrivers />

        <RecentVehicles />

        <RecentShipments />

        <RecentTrips />

        <RecentActiveDeliveries />

        <RecentDeliveredShipments />

        <RecentDelayedShipments />

        <RecentNotifications />
      </div>
    </div>
  );
}

export default Dashboard;
