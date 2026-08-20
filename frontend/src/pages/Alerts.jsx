import React, { useEffect, useMemo, useState } from "react";
import {
  FiBell,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFilter,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
  FiAlertTriangle,
} from "react-icons/fi";

import {
  getMaintenanceAlerts,
  getMaintenanceAlertById,
  createMaintenanceAlert,
  updateMaintenanceAlertStatus,
  deleteMaintenanceAlert,
} from "../services/maintenanceAlertService";

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedAlert, setSelectedAlert] = useState(null);

  const [formData, setFormData] = useState({
    vehicle_id: "",
    maintenance_id: "",
    alert_message: "",
    alert_type: "",
    alert_status: "Pending",
    generated_date: "",
    next_service_date: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --------------------------------------------------
  // FORMAT API ERROR SAFELY
  // --------------------------------------------------

  const getErrorMessage = (err, fallbackMessage) => {
    const detail = err?.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === "string") return item;
          return item?.msg || "Validation error";
        })
        .join(", ");
    }

    if (detail && typeof detail === "object") {
      return (
        detail.msg ||
        JSON.stringify(detail)
      );
    }

    return fallbackMessage;
  };

  // --------------------------------------------------
  // LOAD ALERTS
  // --------------------------------------------------

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMaintenanceAlerts();

      setAlerts(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      console.error("Error loading maintenance alerts:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to load maintenance alerts."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  // --------------------------------------------------
  // FILTER ALERTS
  // --------------------------------------------------

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const search = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !search ||
        String(alert.id || "")
          .toLowerCase()
          .includes(search) ||
        String(alert.vehicle_id || "")
          .toLowerCase()
          .includes(search) ||
        String(alert.maintenance_id || "")
          .toLowerCase()
          .includes(search) ||
        String(alert.alert_message || "")
          .toLowerCase()
          .includes(search) ||
        String(alert.alert_type || "")
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        String(alert.alert_status || "").toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [alerts, searchTerm, statusFilter]);

  // --------------------------------------------------
  // STATISTICS
  // --------------------------------------------------

  const totalAlerts = alerts.length;

  const pendingAlerts = alerts.filter(
    (alert) =>
      String(alert.alert_status || "").toLowerCase() === "pending"
  ).length;

  const sentAlerts = alerts.filter(
    (alert) =>
      String(alert.alert_status || "").toLowerCase() === "sent"
  ).length;

  const completedAlerts = alerts.filter(
    (alert) =>
      String(alert.alert_status || "").toLowerCase() === "completed"
  ).length;

  // --------------------------------------------------
  // CREATE ALERT
  // --------------------------------------------------

  const handleCreateAlert = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setSuccess("");

      const payload = {
        ...formData,
        vehicle_id: Number(formData.vehicle_id),
        maintenance_id: Number(formData.maintenance_id),
      };

      await createMaintenanceAlert(payload);

      setSuccess("Maintenance alert created successfully.");

      setShowCreateModal(false);

      setFormData({
        vehicle_id: "",
        maintenance_id: "",
        alert_message: "",
        alert_type: "",
        alert_status: "Pending",
        generated_date: "",
        next_service_date: "",
      });

      await loadAlerts();
    } catch (err) {
      console.error("Error creating alert:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to create maintenance alert."
        )
      );
    }
  };

  // --------------------------------------------------
  // UPDATE STATUS
  // --------------------------------------------------

  const handleStatusChange = async (id, status) => {
    if (!id) {
      setError("Unable to update alert: alert ID is missing.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      await updateMaintenanceAlertStatus(id, status);

      setSuccess("Alert status updated successfully.");

      await loadAlerts();
    } catch (err) {
      console.error("Error updating alert:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to update alert status."
        )
      );
    }
  };

  // --------------------------------------------------
  // DELETE ALERT
  // --------------------------------------------------

  const handleDelete = async (id) => {
    if (!id) {
      setError("Unable to delete alert: alert ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this maintenance alert?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteMaintenanceAlert(id);

      setSuccess("Maintenance alert deleted successfully.");

      await loadAlerts();
    } catch (err) {
      console.error("Error deleting alert:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to delete maintenance alert."
        )
      );
    }
  };

  // --------------------------------------------------
  // VIEW ALERT
  // --------------------------------------------------

  const handleView = async (id) => {
    if (!id) {
      setError("Unable to view alert: alert ID is missing.");
      return;
    }

    try {
      setError("");

      const data = await getMaintenanceAlertById(id);

      setSelectedAlert(data);
      setShowViewModal(true);
    } catch (err) {
      console.error("Error loading alert:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to load alert details."
        )
      );
    }
  };

  // --------------------------------------------------
  // STATUS STYLE
  // --------------------------------------------------

  const getStatusStyle = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

      case "sent":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";

      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/20";

      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  // --------------------------------------------------
  // DATE FORMATTER
  // --------------------------------------------------

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#0b1120] text-white p-6 md:p-8 overflow-x-hidden">

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-8">

        <div className="min-w-0">
          <div className="flex items-center gap-3">

            <div className="shrink-0 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <FiBell className="w-6 h-6 text-blue-400" />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold truncate">
                Maintenance Alerts
              </h1>

              <p className="text-gray-400 mt-1">
                Monitor and manage vehicle maintenance alerts
              </p>
            </div>

          </div>
        </div>

        <button
          onClick={() => {
            setError("");
            setSuccess("");
            setShowCreateModal(true);
          }}
          className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition font-medium whitespace-nowrap"
        >
          <FiPlus className="w-5 h-5" />
          Create Alert
        </button>

      </div>

      {/* SUCCESS MESSAGE */}
      {success && (
        <div className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-green-400">

          <div className="flex items-center gap-2 min-w-0">
            <FiCheckCircle className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>

          <button
            onClick={() => setSuccess("")}
            className="shrink-0"
          >
            <FiX className="w-4 h-4" />
          </button>

        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-400">

          <div className="flex items-start gap-2 min-w-0">
            <FiAlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />

            <span className="break-words">
              {error}
            </span>
          </div>

          <button
            onClick={() => setError("")}
            className="shrink-0"
          >
            <FiX className="w-4 h-4" />
          </button>

        </div>
      )}

      {/* STATISTICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        {/* TOTAL */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 min-w-0">

          <div className="flex items-center justify-between gap-4">

            <div className="min-w-0">
              <p className="text-gray-400 text-sm">
                Total Alerts
              </p>

              <p className="text-3xl font-bold mt-2">
                {totalAlerts}
              </p>
            </div>

            <div className="shrink-0 p-3 rounded-xl bg-blue-500/10">
              <FiBell className="w-6 h-6 text-blue-400" />
            </div>

          </div>

        </div>

        {/* PENDING */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 min-w-0">

          <div className="flex items-center justify-between gap-4">

            <div className="min-w-0">
              <p className="text-gray-400 text-sm">
                Pending
              </p>

              <p className="text-3xl font-bold mt-2 text-yellow-400">
                {pendingAlerts}
              </p>
            </div>

            <div className="shrink-0 p-3 rounded-xl bg-yellow-500/10">
              <FiClock className="w-6 h-6 text-yellow-400" />
            </div>

          </div>

        </div>

        {/* SENT */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 min-w-0">

          <div className="flex items-center justify-between gap-4">

            <div className="min-w-0">
              <p className="text-gray-400 text-sm">
                Sent
              </p>

              <p className="text-3xl font-bold mt-2 text-blue-400">
                {sentAlerts}
              </p>
            </div>

            <div className="shrink-0 p-3 rounded-xl bg-blue-500/10">
              <FiBell className="w-6 h-6 text-blue-400" />
            </div>

          </div>

        </div>

        {/* COMPLETED */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 min-w-0">

          <div className="flex items-center justify-between gap-4">

            <div className="min-w-0">
              <p className="text-gray-400 text-sm">
                Completed
              </p>

              <p className="text-3xl font-bold mt-2 text-green-400">
                {completedAlerts}
              </p>
            </div>

            <div className="shrink-0 p-3 rounded-xl bg-green-500/10">
              <FiCheckCircle className="w-6 h-6 text-green-400" />
            </div>

          </div>

        </div>

      </div>

      {/* FILTER BAR */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-4 mb-6">

        <div className="flex flex-col lg:flex-row gap-4">

          <div className="relative flex-1 min-w-0">

            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />

            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0b1120] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />

          </div>

          <div className="flex items-center gap-2 shrink-0">

            <FiFilter className="w-5 h-5 text-gray-500" />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0b1120] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 min-w-[150px]"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Sent">Sent</option>
              <option value="Completed">Completed</option>
            </select>

          </div>

        </div>

      </div>

      {/* ALERT TABLE */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden">

        <div className="px-6 py-5 border-b border-gray-800">

          <h2 className="text-lg font-semibold">
            Maintenance Alerts
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {filteredAlerts.length} alert
            {filteredAlerts.length !== 1 ? "s" : ""} found
          </p>

        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            Loading maintenance alerts...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">

            <FiBell className="w-12 h-12 mb-3 opacity-40" />

            <p className="text-lg">
              No maintenance alerts found
            </p>

            <p className="text-sm mt-1 text-center px-4">
              Alerts generated by the maintenance system will appear here.
            </p>

          </div>
        ) : (
          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[1100px] table-fixed">

              <colgroup>
                <col className="w-[25%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[13%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[12%]" />
                <col className="w-[9%]" />
              </colgroup>

              <thead className="bg-[#0d1525]">

                <tr className="text-left text-xs uppercase tracking-wider text-gray-500">

                  <th className="px-6 py-4">
                    Alert
                  </th>

                  <th className="px-6 py-4">
                    Vehicle
                  </th>

                  <th className="px-6 py-4">
                    Maintenance
                  </th>

                  <th className="px-6 py-4">
                    Type
                  </th>

                  <th className="px-6 py-4">
                    Generated
                  </th>

                  <th className="px-6 py-4">
                    Next Service
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-800">

                {filteredAlerts.map((alert) => (

                  <tr
                    key={`maintenance-alert-${alert.id}`}
                    className="hover:bg-white/[0.02] transition"
                  >

                    {/* ALERT */}
                    <td className="px-6 py-4 align-top">

                      <div className="font-medium text-white">
                        Alert #{alert.id}
                      </div>

                      <div className="text-sm text-gray-500 mt-1 break-words">
                        {alert.alert_message || "No message"}
                      </div>

                    </td>

                    {/* VEHICLE */}
                    <td className="px-6 py-4 align-top">
                      <span className="text-gray-300">
                        #{alert.vehicle_id}
                      </span>
                    </td>

                    {/* MAINTENANCE */}
                    <td className="px-6 py-4 align-top">
                      <span className="text-gray-300">
                        #{alert.maintenance_id}
                      </span>
                    </td>

                    {/* TYPE */}
                    <td className="px-6 py-4 align-top">

                      <span className="text-gray-400 break-words">
                        {alert.alert_type || "—"}
                      </span>

                    </td>

                    {/* GENERATED */}
                    <td className="px-6 py-4 align-top text-gray-400">
                      {formatDate(alert.generated_date)}
                    </td>

                    {/* NEXT SERVICE */}
                    <td className="px-6 py-4 align-top text-gray-400">
                      {formatDate(alert.next_service_date)}
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4 align-top">

                      <select
                        value={alert.alert_status || "Pending"}
                        onChange={(e) =>
                          handleStatusChange(
                            alert.id,
                            e.target.value
                          )
                        }
                        className={`w-full max-w-[145px] border rounded-lg px-3 py-2 text-sm bg-[#0b1120] focus:outline-none cursor-pointer ${getStatusStyle(
                          alert.alert_status
                        )}`}
                      >

                        <option
                          value="Pending"
                          className="bg-[#111827] text-yellow-400"
                        >
                          Pending
                        </option>

                        <option
                          value="Sent"
                          className="bg-[#111827] text-blue-400"
                        >
                          Sent
                        </option>

                        <option
                          value="Completed"
                          className="bg-[#111827] text-green-400"
                        >
                          Completed
                        </option>

                      </select>

                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 align-top">

                      <div className="flex items-center justify-end gap-1">

                        <button
                          onClick={() =>
                            handleView(alert.id)
                          }
                          title="View alert"
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(alert.id)
                          }
                          title="Delete alert"
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#111827] border border-gray-800 rounded-2xl shadow-2xl">

            <div className="sticky top-0 flex items-center justify-between px-6 py-5 border-b border-gray-800 bg-[#111827]">

              <div>

                <h2 className="text-xl font-semibold">
                  Create Maintenance Alert
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Create a new maintenance alert manually
                </p>

              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400"
              >
                <FiX className="w-5 h-5" />
              </button>

            </div>

            <form
              onSubmit={handleCreateAlert}
              className="p-6 space-y-5"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>

                  <label className="block text-sm text-gray-400 mb-2">
                    Vehicle ID
                  </label>

                  <input
                    type="number"
                    required
                    value={formData.vehicle_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vehicle_id: e.target.value,
                      })
                    }
                    className="w-full bg-[#0b1120] border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    placeholder="Enter vehicle ID"
                  />

                </div>

                <div>

                  <label className="block text-sm text-gray-400 mb-2">
                    Maintenance ID
                  </label>

                  <input
                    type="number"
                    required
                    value={formData.maintenance_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maintenance_id: e.target.value,
                      })
                    }
                    className="w-full bg-[#0b1120] border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    placeholder="Enter maintenance ID"
                  />

                </div>

              </div>

              <div>

                <label className="block text-sm text-gray-400 mb-2">
                  Alert Message
                </label>

                <textarea
                  required
                  rows={3}
                  value={formData.alert_message}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      alert_message: e.target.value,
                    })
                  }
                  className="w-full bg-[#0b1120] border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Enter alert message"
                />

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>

                  <label className="block text-sm text-gray-400 mb-2">
                    Alert Type
                  </label>

                  <input
                    type="text"
                    required
                    value={formData.alert_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alert_type: e.target.value,
                      })
                    }
                    className="w-full bg-[#0b1120] border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Service Due"
                  />

                </div>

                <div>

                  <label className="block text-sm text-gray-400 mb-2">
                    Alert Status
                  </label>

                  <select
                    value={formData.alert_status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alert_status: e.target.value,
                      })
                    }
                    className="w-full bg-[#0b1120] border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Sent">Sent</option>
                    <option value="Completed">Completed</option>
                  </select>

                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>

                  <label className="block text-sm text-gray-400 mb-2">
                    Generated Date
                  </label>

                  <input
                    type="date"
                    value={formData.generated_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        generated_date: e.target.value,
                      })
                    }
                    className="w-full bg-[#0b1120] border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                  />

                </div>

                <div>

                  <label className="block text-sm text-gray-400 mb-2">
                    Next Service Date
                  </label>

                  <input
                    type="date"
                    value={formData.next_service_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        next_service_date: e.target.value,
                      })
                    }
                    className="w-full bg-[#0b1120] border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                  />

                </div>

              </div>

              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-white/5 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition font-medium"
                >
                  Create Alert
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* VIEW MODAL */}
      {showViewModal && selectedAlert && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#111827] border border-gray-800 rounded-2xl shadow-2xl">

            <div className="sticky top-0 flex items-center justify-between px-6 py-5 border-b border-gray-800 bg-[#111827]">

              <div>

                <h2 className="text-xl font-semibold">
                  Alert Details
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Alert #{selectedAlert.id}
                </p>

              </div>

              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400"
              >
                <FiX className="w-5 h-5" />
              </button>

            </div>

            <div className="p-6 space-y-5">

              <div>

                <p className="text-sm text-gray-500">
                  Alert Message
                </p>

                <p className="text-gray-200 mt-1 break-words">
                  {selectedAlert.alert_message || "—"}
                </p>

              </div>

              <div className="grid grid-cols-2 gap-5">

                <div>

                  <p className="text-sm text-gray-500">
                    Vehicle ID
                  </p>

                  <p className="text-gray-200 mt-1">
                    #{selectedAlert.vehicle_id}
                  </p>

                </div>

                <div>

                  <p className="text-sm text-gray-500">
                    Maintenance ID
                  </p>

                  <p className="text-gray-200 mt-1">
                    #{selectedAlert.maintenance_id}
                  </p>

                </div>

                <div>

                  <p className="text-sm text-gray-500">
                    Alert Type
                  </p>

                  <p className="text-gray-200 mt-1 break-words">
                    {selectedAlert.alert_type || "—"}
                  </p>

                </div>

                <div>

                  <p className="text-sm text-gray-500">
                    Status
                  </p>

                  <span
                    className={`inline-block mt-1 px-3 py-1 rounded-lg border text-sm ${getStatusStyle(
                      selectedAlert.alert_status
                    )}`}
                  >
                    {selectedAlert.alert_status || "—"}
                  </span>

                </div>

                <div>

                  <p className="text-sm text-gray-500">
                    Generated Date
                  </p>

                  <p className="text-gray-200 mt-1">
                    {formatDate(selectedAlert.generated_date)}
                  </p>

                </div>

                <div>

                  <p className="text-sm text-gray-500">
                    Next Service
                  </p>

                  <p className="text-gray-200 mt-1">
                    {formatDate(selectedAlert.next_service_date)}
                  </p>

                </div>

              </div>

            </div>

            <div className="px-6 py-4 border-t border-gray-800 flex justify-end">

              <button
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-white/5 transition"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default Alerts;