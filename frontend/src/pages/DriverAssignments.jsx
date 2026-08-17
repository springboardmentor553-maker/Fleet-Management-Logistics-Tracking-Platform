import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function DriverAssignments() {
  const [assignments, setAssignments] = useState([]);

  // ================= ROLE =================

  const userRole = localStorage.getItem("role") || "";

  const normalizedRole = userRole
    .toLowerCase()
    .replace(/\s+/g, "_");

  // Administrator / Fleet Manager / Dispatcher
  // can create, edit and delete assignments
  const canManageAssignments = [
    "administrator",
    "fleet_manager",
    "dispatcher",
  ].includes(normalizedRole);

  // ================= LOAD ASSIGNMENTS =================

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const res = await api.get("/driver-assignments/");

      setAssignments(res.data);
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to load driver assignments"
      );
    }
  };

  // ================= DELETE ASSIGNMENT =================

  const deleteAssignment = async (id) => {
    if (!window.confirm("Delete Assignment?")) return;

    try {
      await api.delete(`/driver-assignments/${id}`);

      alert("Assignment Removed");

      loadAssignments();
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to remove assignment"
      );
    }
  };

  // ================= SUMMARY =================

  const assignedCount = assignments.filter(
    (item) =>
      item.assignment_status?.toLowerCase() ===
      "assigned"
  ).length;

  const completedCount = assignments.filter(
    (item) =>
      item.assignment_status?.toLowerCase() ===
      "completed"
  ).length;

  // ================= UI =================

  return (
    <Layout>

      {/* ================= HEADER ================= */}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

        <div>

          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            Driver Assignments
          </h1>

          <p className="text-slate-400 mt-2">
            Manage driver, vehicle and trip assignments
          </p>

        </div>

        {/* ADD ASSIGNMENT
            ADMIN / FLEET MANAGER / DISPATCHER ONLY
        */}

        {canManageAssignments && (
          <Link
            to="/add-driver-assignment"
            className="w-fit bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-blue-900/30 hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-0.5 transition-all"
          >
            + Assign Driver
          </Link>
        )}

      </div>


      {/* ================= SUMMARY CARDS ================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        <SummaryCard
          title="Total Assignments"
          value={assignments.length}
          color="blue"
        />

        <SummaryCard
          title="Active Assignments"
          value={assignedCount}
          color="cyan"
        />

        <SummaryCard
          title="Completed"
          value={completedCount}
          color="green"
        />

      </div>


      {/* ================= ASSIGNMENT TABLE ================= */}

      <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">

        <div className="p-6 border-b border-slate-800">

          <h2 className="text-xl font-bold text-white">
            Assignment List
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Current driver and vehicle assignments
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px]">

            <thead className="bg-blue-600/20">

              <tr>

                <th className="p-4 text-left text-blue-300">
                  ID
                </th>

                <th className="p-4 text-left text-blue-300">
                  Driver
                </th>

                <th className="p-4 text-left text-blue-300">
                  Vehicle
                </th>

                <th className="p-4 text-left text-blue-300">
                  Trip
                </th>

                <th className="p-4 text-left text-blue-300">
                  Status
                </th>

                <th className="p-4 text-left text-blue-300">
                  Remarks
                </th>

                <th className="p-4 text-left text-blue-300">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {assignments.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    className="text-center p-10 text-slate-500"
                  >
                    No driver assignments found
                  </td>

                </tr>

              ) : (

                assignments.map((item) => (

                  <tr
                    key={item.assignment_id}
                    className="border-t border-slate-800 hover:bg-blue-500/5 transition"
                  >

                    {/* ID */}

                    <td className="p-4 text-slate-400">
                      {item.assignment_id}
                    </td>


                    {/* DRIVER */}

                    <td className="p-4">

                      <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3 py-1 rounded-lg text-sm">
                        Driver #{item.driver_id}
                      </span>

                    </td>


                    {/* VEHICLE */}

                    <td className="p-4">

                      <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1 rounded-lg text-sm">
                        Vehicle #{item.vehicle_id}
                      </span>

                    </td>


                    {/* TRIP */}

                    <td className="p-4">

                      <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-lg text-sm">
                        Trip #{item.trip_id}
                      </span>

                    </td>


                    {/* STATUS */}

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          item.assignment_status
                            ?.toLowerCase() ===
                          "assigned"
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                            : item.assignment_status
                                ?.toLowerCase() ===
                              "completed"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-slate-500/10 text-slate-300 border-slate-500/20"
                        }`}
                      >
                        {item.assignment_status ||
                          "Unknown"}
                      </span>

                    </td>


                    {/* REMARKS */}

                    <td className="p-4 text-slate-400 max-w-[200px]">
                      {item.remarks || "-"}
                    </td>


                    {/* ACTIONS */}

                    <td className="p-4">

                      <div className="flex gap-2">

                        {/* EDIT
                            ADMIN / FLEET MANAGER / DISPATCHER
                        */}

                        {canManageAssignments && (
                          <Link
                            to={`/edit-driver-assignment/${item.assignment_id}`}
                            className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition"
                          >
                            Edit
                          </Link>
                        )}


                        {/* DELETE
                            ADMIN / FLEET MANAGER / DISPATCHER
                        */}

                        {canManageAssignments && (
                          <button
                            onClick={() =>
                              deleteAssignment(
                                item.assignment_id
                              )
                            }
                            className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition"
                          >
                            Delete
                          </button>
                        )}

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </Layout>
  );
}


/* ================= SUMMARY CARD ================= */

function SummaryCard({
  title,
  value,
  color,
}) {

  const styles = {

    blue: {
      border: "border-blue-400/20",
      text: "text-blue-400",
    },

    cyan: {
      border: "border-cyan-400/20",
      text: "text-cyan-400",
    },

    green: {
      border: "border-green-400/20",
      text: "text-green-400",
    },

  };

  const style =
    styles[color] || styles.blue;

  return (

    <div
      className={`bg-slate-900/70 backdrop-blur-xl border ${style.border} rounded-2xl p-5 shadow-xl`}
    >

      <p className="text-slate-400 text-sm">
        {title}
      </p>

      <p
        className={`text-3xl font-bold ${style.text} mt-2`}
      >
        {value}
      </p>

    </div>

  );
}


export default DriverAssignments;