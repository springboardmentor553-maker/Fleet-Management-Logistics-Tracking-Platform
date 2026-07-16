import { useEffect, useState } from "react";
import {
  FaTruck,
  FaCheckCircle,
  FaRoute,
  FaTools,
} from "react-icons/fa";

import { getDashboard } from "../services/dashboardService";
import { getVehicles } from "../services/vehicleService";

import DashboardCard from "../components/DashboardCard";
import VehicleTable from "../components/VehicleTable";
import AddVehicleModal from "../components/AddVehicleModal";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const dashboardData = await getDashboard();
        setStats(dashboardData);

        const vehicleData = await getVehicles();
        setVehicles(vehicleData);
      } catch (error) {
        console.error(error);
      }
    };

    loadDashboard();
  }, []);

  if (!stats) {
    return (
      <div className="text-xl font-semibold">
        Loading dashboard...
      </div>
    );
  }

  const openAddVehicle = () => {
    setVehicleToEdit(null);
    setShowAddModal(true);
  };

  const openEditVehicle = (vehicle) => {
    setVehicleToEdit(vehicle);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setVehicleToEdit(null);
  };

  const handleVehicleDeleted = (deletedId) => {
    setVehicles((prevVehicles) =>
      prevVehicles.filter((vehicle) => vehicle.id !== deletedId)
    );
  };

  return (
    <div>
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Fleet Operations Dashboard
        </h1>

        <p className="text-slate-500 mt-2">
          Monitor your fleet, drivers and shipments in one place.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Vehicles"
          value={stats.totalVehicles}
          icon={<FaTruck />}
          color="bg-blue-600"
        />

        <DashboardCard
          title="Available"
          value={stats.available}
          icon={<FaCheckCircle />}
          color="bg-green-500"
        />

        <DashboardCard
          title="On Trip"
          value={stats.active}
          icon={<FaRoute />}
          color="bg-orange-500"
        />

        <DashboardCard
          title="Maintenance"
          value={stats.maintenance}
          icon={<FaTools />}
          color="bg-red-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">
          Quick Actions
        </h2>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={openAddVehicle}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
          >
            Add Vehicle
          </button>

          <button className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition">
            Add Driver
          </button>

          <button className="bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition">
            Create Shipment
          </button>
        </div>
      </div>

      <VehicleTable
        vehicles={vehicles}
        onEdit={openEditVehicle}
        onVehicleDeleted={handleVehicleDeleted}
      />

      {showAddModal && (
        <AddVehicleModal
          onClose={closeModal}
          vehicleToEdit={vehicleToEdit}
        />
      )}
    </div>
  );
}

export default Dashboard;