import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function Maintenance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // GET USER ROLE
  // =========================================================

  const userRole =
    localStorage.getItem("role")
      ?.toLowerCase()
      .replace(/\s+/g, "_") || "";

  // Administrator and Fleet Manager can manage maintenance
  const canManageMaintenance =
    userRole === "administrator" ||
    userRole === "fleet_manager";

  // =========================================================
  // LOAD MAINTENANCE
  // =========================================================

  useEffect(() => {
    loadMaintenance();
  }, []);

  const loadMaintenance = async () => {
    try {
      setLoading(true);

      const res = await api.get("/maintenance/");

      setRecords(res.data);

    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to load maintenance records"
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // DELETE MAINTENANCE
  // =========================================================

  const deleteRecord = async (id) => {

    if (!window.confirm("Delete Maintenance Record?")) {
      return;
    }

    try {

      await api.delete(`/maintenance/${id}`);

      alert(
        "Maintenance Record Deleted Successfully"
      );

      loadMaintenance();

    } catch (err) {

      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to delete maintenance record"
      );
    }
  };

  // =========================================================
  // SUMMARY VALUES
  // =========================================================

  const totalRecords = records.length;

  const activeRecords = records.filter(
    (item) =>
      item.maintenance_status?.toLowerCase() ===
      "under maintenance"
  ).length;

  const completedRecords = records.filter(
    (item) =>
      item.maintenance_status?.toLowerCase() ===
      "completed"
  ).length;

  // Database field is service_cost
  const totalCost = records.reduce(
    (sum, item) =>
      sum + Number(item.service_cost || 0),
    0
  );

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <Layout>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">

        <div className="min-w-0">

          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            Maintenance
          </h1>

          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            Manage vehicle maintenance and service records
          </p>

        </div>

        {/* =================================================
            ADD BUTTON
            Only Administrator / Fleet Manager
        ================================================== */}

        {canManageMaintenance && (

          <Link
            to="/add-maintenance"
            className="w-full sm:w-auto text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-blue-900/30 hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-0.5 transition-all whitespace-nowrap"
          >
            + Add Maintenance
          </Link>

        )}

      </div>

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">

        <SummaryCard
          title="Total Records"
          value={totalRecords}
          icon="🔧"
          color="blue"
        />

        <SummaryCard
          title="Under Maintenance"
          value={activeRecords}
          icon="🛠️"
          color="orange"
        />

        <SummaryCard
          title="Completed"
          value={completedRecords}
          icon="✅"
          color="green"
        />

        <SummaryCard
          title="Total Cost"
          value={`₹ ${totalCost.toFixed(2)}`}
          icon="💰"
          color="cyan"
        />

      </div>

      {/* =====================================================
          MAINTENANCE TABLE
      ====================================================== */}

      <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden w-full">

        <div className="p-4 sm:p-6 border-b border-slate-800">

          <h2 className="text-xl font-bold text-white">
            Maintenance Records
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Vehicle service and maintenance history
          </p>

        </div>

        {/* ===================================================
            LOADING
        ==================================================== */}

        {loading ? (

          <div className="text-center py-12">

            <p className="text-blue-400">
              Loading maintenance records...
            </p>

          </div>

        ) : records.length === 0 ? (

          /* =================================================
             NO RECORDS
          ================================================== */

          <div className="text-center py-12">

            <div className="text-4xl mb-3">
              🔧
            </div>

            <p className="text-slate-500">
              No maintenance records found
            </p>

          </div>

        ) : (

          /* =================================================
             RESPONSIVE TABLE
          ================================================== */

          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[850px]">

              <thead className="bg-blue-600/20">

                <tr>

                  <th className="p-4 text-left text-blue-300 whitespace-nowrap">
                    ID
                  </th>

                  <th className="p-4 text-left text-blue-300 whitespace-nowrap">
                    Vehicle
                  </th>

                  <th className="p-4 text-left text-blue-300 whitespace-nowrap">
                    Category
                  </th>

                  <th className="p-4 text-left text-blue-300 whitespace-nowrap">
                    Status
                  </th>

                  <th className="p-4 text-left text-blue-300 whitespace-nowrap">
                    Cost
                  </th>

                  {canManageMaintenance && (

                    <th className="p-4 text-left text-blue-300 whitespace-nowrap">
                      Actions
                    </th>

                  )}

                </tr>

              </thead>

              <tbody>

                {records.map((item) => (

                  <tr
                    key={item.maintenance_id}
                    className="border-t border-slate-800 hover:bg-blue-500/5 transition"
                  >

                    {/* ID */}

                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      {item.maintenance_id}
                    </td>

                    {/* VEHICLE */}

                    <td className="p-4 whitespace-nowrap">

                      <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1 rounded-lg text-sm">
                        Vehicle #{item.vehicle_id}
                      </span>

                    </td>

                    {/* CATEGORY */}

                    <td className="p-4 text-slate-300 whitespace-nowrap">
                      {item.maintenance_category || "-"}
                    </td>

                    {/* STATUS */}

                    <td className="p-4 whitespace-nowrap">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          item.maintenance_status?.toLowerCase() ===
                          "completed"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : item.maintenance_status?.toLowerCase() ===
                              "under maintenance"
                            ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        }`}
                      >
                        {item.maintenance_status ||
                          "Unknown"}
                      </span>

                    </td>

                    {/* COST */}

                    <td className="p-4 text-cyan-300 font-semibold whitespace-nowrap">
                      ₹{" "}
                      {Number(
                        item.service_cost || 0
                      ).toFixed(2)}
                    </td>

                    {/* ACTIONS */}

                    {canManageMaintenance && (

                      <td className="p-4 whitespace-nowrap">

                        <div className="flex gap-2">

                          <Link
                            to={`/edit-maintenance/${item.maintenance_id}`}
                            className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() =>
                              deleteRecord(
                                item.maintenance_id
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

    blue: {
      border: "border-blue-400/20",
      text: "text-blue-400",
      bg: "bg-blue-500/10",
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

    cyan: {
      border: "border-cyan-400/20",
      text: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },

  };

  const style =
    styles[color] || styles.blue;

  return (

    <div
      className={`bg-slate-900/70 backdrop-blur-xl border ${style.border} rounded-2xl p-5 shadow-xl min-w-0`}
    >

      <div className="flex items-center justify-between gap-3">

        <div className="min-w-0">

          <p className="text-slate-400 text-sm">
            {title}
          </p>

          <p
            className={`text-2xl font-bold ${style.text} mt-2 break-words`}
          >
            {value}
          </p>

        </div>

        <div
          className={`w-12 h-12 flex-shrink-0 rounded-xl ${style.bg} flex items-center justify-center text-2xl`}
        >
          {icon}
        </div>

      </div>

    </div>

  );
}

export default Maintenance;