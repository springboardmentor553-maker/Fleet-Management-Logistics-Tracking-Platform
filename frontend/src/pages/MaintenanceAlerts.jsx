import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function MaintenanceAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // GET USER ROLE
  // =====================================================

  const getUserRole = () => {
    const role = localStorage.getItem("role");

    if (role) {
      return role.toLowerCase().replace(/\s+/g, "_");
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (user?.role) {
        return user.role.toLowerCase().replace(/\s+/g, "_");
      }
    } catch (err) {
      console.log("User role read error:", err);
    }

    return "";
  };

  const userRole = getUserRole();

  // Only Administrator and Fleet Manager can modify alerts
  const canManageAlerts =
    userRole === "administrator" ||
    userRole === "fleet_manager";

  // =====================================================
  // LOAD ALERTS
  // =====================================================

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);

      const res = await api.get("/maintenance-alerts/");

      setAlerts(res.data);
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to load maintenance alerts"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // DELETE ALERT
  // =====================================================

  const deleteAlert = async (id) => {
    if (!window.confirm("Delete Alert?")) {
      return;
    }

    try {
      await api.delete(`/maintenance-alerts/${id}`);

      alert("Alert Deleted Successfully");

      loadAlerts();
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to delete alert"
      );
    }
  };

  // =====================================================
  // ACTIVE ALERTS
  // =====================================================

  const activeAlerts = alerts.filter(
    (alert) =>
      alert.alert_status?.toLowerCase() === "active" ||
      alert.alert_status?.toLowerCase() === "pending"
  ).length;

  // =====================================================
  // RESOLVED ALERTS
  // =====================================================

  const resolvedAlerts = alerts.filter(
    (alert) =>
      alert.alert_status?.toLowerCase() === "resolved" ||
      alert.alert_status?.toLowerCase() === "completed"
  ).length;

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <Layout>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

        <div>

          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
            Maintenance Alerts
          </h1>

          <p className="text-slate-400 mt-2">
            Monitor vehicle maintenance notifications and alerts
          </p>

        </div>


        {/* ADD ALERT */}

        {canManageAlerts && (

          <Link
            to="/add-maintenance-alert"
            className="w-fit bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-cyan-900/30 hover:from-cyan-400 hover:to-teal-400 hover:-translate-y-0.5 transition-all"
          >
            + Add Alert
          </Link>

        )}

      </div>


      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        <SummaryCard
          title="Total Alerts"
          value={alerts.length}
          icon="🔔"
          color="cyan"
        />

        <SummaryCard
          title="Active Alerts"
          value={activeAlerts}
          icon="⚠️"
          color="orange"
        />

        <SummaryCard
          title="Resolved Alerts"
          value={resolvedAlerts}
          icon="✅"
          color="green"
        />

      </div>


      {/* =================================================
          ALERT BANNER
      ================================================= */}

      {activeAlerts > 0 && (

        <div className="mb-8 bg-orange-500/10 border border-orange-400/20 rounded-2xl p-5">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-2xl">
              ⚠️
            </div>

            <div>

              <h2 className="text-lg font-bold text-orange-400">
                Maintenance Attention Required
              </h2>

              <p className="text-slate-400 text-sm mt-1">
                {activeAlerts} vehicle maintenance alert
                {activeAlerts !== 1 ? "s" : ""} require
                attention.
              </p>

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          ALERT TABLE
      ================================================= */}

      <div className="bg-slate-900/75 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-2xl overflow-hidden">

        {/* TABLE HEADER */}

        <div className="p-6 border-b border-slate-800">

          <h2 className="text-xl font-bold text-white">
            Alert Records
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Vehicle maintenance alert history
          </p>

        </div>


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="text-center py-12">

            <p className="text-cyan-400">
              Loading maintenance alerts...
            </p>

          </div>

        ) : alerts.length === 0 ? (

          /* =================================================
             NO RECORDS
          ================================================= */

          <div className="text-center py-12">

            <div className="text-4xl mb-3">
              🔔
            </div>

            <p className="text-slate-500">
              No maintenance alerts found
            </p>

          </div>

        ) : (

          /* =================================================
             RESPONSIVE TABLE
          ================================================= */

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px]">

              {/* TABLE HEAD */}

              <thead className="bg-cyan-500/10">

                <tr>

                  <th className="p-4 text-left text-cyan-300">
                    ID
                  </th>

                  <th className="p-4 text-left text-cyan-300">
                    Vehicle
                  </th>

                  <th className="p-4 text-left text-cyan-300">
                    Maintenance
                  </th>

                  <th className="p-4 text-left text-cyan-300">
                    Alert Type
                  </th>

                  <th className="p-4 text-left text-cyan-300">
                    Status
                  </th>

                  {canManageAlerts && (

                    <th className="p-4 text-left text-cyan-300">
                      Actions
                    </th>

                  )}

                </tr>

              </thead>


              {/* TABLE BODY */}

              <tbody>

                {alerts.map((alert) => (

                  <tr
                    key={alert.alert_id}
                    className="border-t border-slate-800 hover:bg-cyan-500/5 transition"
                  >

                    {/* ID */}

                    <td className="p-4 text-slate-400">
                      {alert.alert_id}
                    </td>


                    {/* VEHICLE */}

                    <td className="p-4">

                      <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-3 py-1 rounded-lg text-sm">
                        Vehicle #{alert.vehicle_id}
                      </span>

                    </td>


                    {/* MAINTENANCE */}

                    <td className="p-4">

                      <span className="text-slate-300">
                        #{alert.maintenance_id}
                      </span>

                    </td>


                    {/* ALERT TYPE */}

                    <td className="p-4">

                      <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3 py-1 rounded-lg text-sm">
                        {alert.alert_type || "-"}
                      </span>

                    </td>


                    {/* STATUS */}

                    <td className="p-4">

                      <StatusBadge
                        status={alert.alert_status}
                      />

                    </td>


                    {/* ACTIONS */}

                    {canManageAlerts && (

                      <td className="p-4">

                        <div className="flex gap-2">

                          {/* EDIT */}

                          <Link
                            to={`/edit-maintenance-alert/${alert.alert_id}`}
                            className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition"
                          >
                            Edit
                          </Link>


                          {/* DELETE */}

                          <button
                            onClick={() =>
                              deleteAlert(
                                alert.alert_id
                              )
                            }
                            className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    )}

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </Layout>
  );
}


/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  title,
  value,
  icon,
  color,
}) {

  const styles = {

    cyan: {
      border: "border-cyan-400/20",
      text: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },

    orange: {
      border: "border-orange-400/20",
      text: "text-orange-400",
      bg: "bg-orange-500/10",
    },

    green: {
      border: "border-green-400/20",
      text: "text-green-400",
      bg: "bg-green-500/10",
    },

  };

  const style =
    styles[color] || styles.cyan;

  return (

    <div
      className={`bg-slate-900/70 backdrop-blur-xl border ${style.border} rounded-2xl p-5 shadow-xl`}
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-slate-400 text-sm">
            {title}
          </p>

          <p
            className={`text-3xl font-bold ${style.text} mt-2`}
          >
            {value}
          </p>

        </div>

        <div
          className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center text-2xl`}
        >
          {icon}
        </div>

      </div>

    </div>

  );
}


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {

  const normalizedStatus =
    status?.toLowerCase();

  let style =
    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

  if (
    normalizedStatus === "active" ||
    normalizedStatus === "pending"
  ) {
    style =
      "bg-orange-500/10 text-orange-400 border-orange-500/20";
  }

  if (
    normalizedStatus === "resolved" ||
    normalizedStatus === "completed"
  ) {
    style =
      "bg-green-500/10 text-green-400 border-green-500/20";
  }

  return (

    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${style}`}
    >
      {status || "Unknown"}
    </span>

  );
}

export default MaintenanceAlerts;