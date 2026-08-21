import { useEffect, useState } from "react";
import {
  FaTools,
  FaPlus,
  FaEdit,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaBell,
  FaExclamationTriangle,
} from "react-icons/fa";

import { getMaintenance } from "../services/maintenanceService";
import { getMaintenanceAlerts } from "../services/maintenanceAlertService";
import { getVehicles } from "../services/vehicleService";

import MaintenanceModal from "../components/MaintenanceModal";

function Maintenance() {
  const [maintenance, setMaintenance] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [maintenanceToEdit, setMaintenanceToEdit] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [maintenanceData, vehicleData, alertData] = await Promise.all([
        getMaintenance(),
        getVehicles(),
        getMaintenanceAlerts(),
      ]);

      setMaintenance(maintenanceData || []);
      setVehicles(vehicleData || []);
      setAlerts(alertData || []);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load maintenance data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setMaintenanceToEdit(null);
    setShowModal(true);
  };

  const openEditModal = (record) => {
    setMaintenanceToEdit(record);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setMaintenanceToEdit(null);
  };

  const handleSaved = () => {
    closeModal();
    loadData();
  };

  const getVehicleNumber = (vehicleId) => {
    const vehicle = vehicles.find(
      (vehicle) => vehicle.id === vehicleId
    );

    return vehicle
      ? vehicle.vehicle_number
      : `Vehicle #${vehicleId}`;
  };

  const getStatusClass = (status) => {
    const value = status?.toLowerCase();

    if (value === "completed") {
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }

    if (value === "in progress") {
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    }

    return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
  };

  const totalRecords = maintenance.length;

  const inProgress = maintenance.filter(
    (item) =>
      item.maintenance_status?.toLowerCase() === "in progress"
  ).length;

  const completed = maintenance.filter(
    (item) =>
      item.maintenance_status?.toLowerCase() === "completed"
  ).length;

  const healthReports = vehicles.map((vehicle) => {
    const vehicleMaintenance = maintenance.filter(
      (item) => item.vehicle_id === vehicle.id
    );

    const vehicleAlerts = alerts.filter(
      (alert) =>
        alert.vehicle_id === vehicle.id &&
        alert.alert_status?.toLowerCase() === "pending"
    );

    const overdue = vehicleMaintenance.filter(
      (item) =>
        item.next_service_date &&
        new Date(item.next_service_date) < new Date() &&
        item.maintenance_status?.toLowerCase() !== "completed"
    ).length;

    const score = Math.max(
      60,
      100 - vehicleAlerts.length * 5 - overdue * 5
    );

    return {
      ...vehicle,
      healthScore: score,
      pending: vehicleAlerts.length + overdue,
    };
  });

  const pendingAlerts = alerts.filter(
    (alert) =>
      alert.alert_status?.toLowerCase() === "pending"
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <FaTools className="text-blue-500 animate-pulse" />

          <span className="text-sm font-medium">
            Loading maintenance data...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">

      {/* PAGE HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

        <div>

          <div className="flex items-center gap-3 mb-2">

            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <FaTools className="text-blue-400" />
            </div>

            <h1 className="text-2xl font-semibold text-white">
              Vehicle Maintenance
            </h1>

          </div>

          <p className="text-sm text-slate-400">
            Monitor servicing, maintenance schedules and vehicle
            maintenance history.
          </p>

        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
        >
          <FaPlus />
          Add Maintenance
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* VEHICLE HEALTH & MAINTENANCE ALERTS */}

      <section className="mb-8">

        <div className="flex items-center justify-between mb-4">

          <div>

            <h2 className="text-base font-semibold text-white">
              Fleet Vehicle Health Reports & Inspection Alerts
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Current vehicle health, pending maintenance and inspection alerts.
            </p>

          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FaBell className="text-amber-400" />
            {pendingAlerts.length} pending alerts
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          {healthReports.map((vehicle) => (

            <div
              key={vehicle.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5"
            >

              {/* VEHICLE + STATUS */}

              <div className="flex items-center justify-between mb-4">

                <span className="px-3 py-1 rounded-md bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-200">
                  🚚 {vehicle.vehicle_number}
                </span>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    vehicle.healthScore >= 90
                      ? "bg-emerald-500/10 text-emerald-400"
                      : vehicle.healthScore >= 75
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {vehicle.healthScore >= 90
                    ? "Excellent"
                    : vehicle.healthScore >= 75
                    ? "Good"
                    : "Attention"}
                </span>

              </div>

              {/* HEALTH SCORE */}

              <div className="flex items-center justify-between text-xs mb-2">

                <span className="text-slate-400">
                  Health Score
                </span>

                <span className="font-semibold text-emerald-400">
                  {vehicle.healthScore}%
                </span>

              </div>

              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">

                <div
                  className={`h-full rounded-full ${
                    vehicle.healthScore >= 90
                      ? "bg-emerald-500"
                      : vehicle.healthScore >= 75
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${vehicle.healthScore}%`,
                  }}
                />

              </div>

              {/* ALERT */}

              {vehicle.pending > 0 && (

                <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/10 px-3 py-2 text-xs text-red-400">

                  <FaExclamationTriangle className="mt-0.5 shrink-0" />

                  <span>
                    {vehicle.pending} maintenance task
                    {vehicle.pending > 1 ? "s" : ""} pending
                  </span>

                </div>

              )}

              {/* FOOTER */}

              <div className="flex items-center justify-between mt-4 text-xs text-slate-500">

                <span>
                  Type: {vehicle.vehicle_type || vehicle.type || "Vehicle"}
                </span>

                <span>
                  Pending: {vehicle.pending}
                </span>

              </div>

            </div>

          ))}

        </div>

        {healthReports.length === 0 && (

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-sm text-slate-500">
            No vehicles available for health reporting.
          </div>

        )}

      </section>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        {/* TOTAL */}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs uppercase tracking-wide text-slate-500">
                Total Records
              </p>

              <p className="text-2xl font-semibold text-white mt-2">
                {totalRecords}
              </p>

              <p className="text-xs text-slate-500 mt-1">
                Maintenance records
              </p>

            </div>

            <div className="w-11 h-11 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FaTools className="text-blue-400" />
            </div>

          </div>

        </div>

        {/* IN PROGRESS */}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs uppercase tracking-wide text-slate-500">
                In Progress
              </p>

              <p className="text-2xl font-semibold text-white mt-2">
                {inProgress}
              </p>

              <p className="text-xs text-slate-500 mt-1">
                Vehicles currently serviced
              </p>

            </div>

            <div className="w-11 h-11 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <FaClock className="text-amber-400" />
            </div>

          </div>

        </div>

        {/* COMPLETED */}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs uppercase tracking-wide text-slate-500">
                Completed
              </p>

              <p className="text-2xl font-semibold text-white mt-2">
                {completed}
              </p>

              <p className="text-xs text-slate-500 mt-1">
                Completed maintenance
              </p>

            </div>

            <div className="w-11 h-11 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <FaCheckCircle className="text-emerald-400" />
            </div>

          </div>

        </div>

      </div>

      {/* MAINTENANCE TABLE */}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

        {/* TABLE HEADER */}

        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">

          <div>

            <h2 className="text-base font-semibold text-white">
              Maintenance History
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Vehicle servicing and maintenance records
            </p>

          </div>

          <div className="text-xs text-slate-500">
            {maintenance.length} records
          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-slate-950">

              <tr>

                <th className="text-left px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                  ID
                </th>

                <th className="text-left px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Vehicle
                </th>

                <th className="text-left px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Category
                </th>

                <th className="text-left px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Service Date
                </th>

                <th className="text-left px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Cost
                </th>

                <th className="text-left px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="text-left px-6 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {maintenance.map((record) => (

                <tr
                  key={record.id}
                  className="border-t border-slate-800 hover:bg-slate-800/40 transition"
                >

                  <td className="px-6 py-4 text-sm text-slate-400">
                    #{record.id}
                  </td>

                  <td className="px-6 py-4">

                    <div className="font-medium text-white">
                      {getVehicleNumber(record.vehicle_id)}
                    </div>

                    <div className="text-xs text-slate-500 mt-1">
                      Vehicle ID: {record.vehicle_id}
                    </div>

                  </td>

                  <td className="px-6 py-4 text-sm text-slate-300">
                    {record.maintenance_category}
                  </td>

                  <td className="px-6 py-4">

                    <div className="flex items-center gap-2 text-sm text-slate-300">

                      <FaCalendarAlt className="text-slate-500 text-xs" />

                      {new Date(
                        record.service_date
                      ).toLocaleDateString()}

                    </div>

                  </td>

                  <td className="px-6 py-4 text-sm font-medium text-slate-200">
                    ₹{Number(record.service_cost).toLocaleString("en-IN")}
                  </td>

                  <td className="px-6 py-4">

                    <span
                      className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${getStatusClass(
                        record.maintenance_status
                      )}`}
                    >
                      {record.maintenance_status}
                    </span>

                  </td>

                  <td className="px-6 py-4">

                    <button
                      onClick={() => openEditModal(record)}
                      className="flex items-center gap-2 text-xs font-medium text-blue-400 hover:text-blue-300 transition"
                    >
                      <FaEdit />
                      Edit
                    </button>

                  </td>

                </tr>

              ))}

              {maintenance.length === 0 && (

                <tr>

                  <td
                    colSpan="7"
                    className="text-center py-16"
                  >

                    <FaTools className="mx-auto text-3xl text-slate-700 mb-3" />

                    <p className="text-sm text-slate-400">
                      No maintenance records found.
                    </p>

                    <p className="text-xs text-slate-600 mt-1">
                      Add a maintenance record to get started.
                    </p>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* MODAL */}

      {showModal && (

        <MaintenanceModal
          onClose={closeModal}
          onSaved={handleSaved}
          vehicles={vehicles}
          maintenanceToEdit={maintenanceToEdit}
        />

      )}

    </div>
  );
}

export default Maintenance;