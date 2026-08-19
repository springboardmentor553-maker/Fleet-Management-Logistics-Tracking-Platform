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

          <p className="text-teal-300 text-sm font-medium mb-2">
            FleetFlow • Operations Center
          </p>

          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
            Driver Assignments
          </h1>

          <p className="text-teal-100/70 mt-2">
            Manage driver, vehicle and trip assignments
          </p>

        </div>

        {/* ADD ASSIGNMENT */}

        {canManageAssignments && (
          <Link
            to="/add-driver-assignment"
            className="w-fit bg-gradient-to-r from-teal-400 to-cyan-400 text-[#03181b] px-5 py-3 rounded-xl font-semibold shadow-lg shadow-teal-900/30 hover:from-teal-300 hover:to-cyan-300 hover:-translate-y-0.5 transition-all"
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
          color="teal"
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

      <div className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* TABLE HEADER */}

        <div className="p-6 border-b border-teal-900/60">

          <h2 className="text-xl font-bold text-teal-50">
            Assignment Registry
          </h2>

          <p className="text-sm text-teal-200/50 mt-1">
            Current driver and vehicle assignments
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px]">

            {/* ================= TABLE HEAD ================= */}

            <thead className="bg-teal-500/10">

              <tr>

                <th className="p-4 text-left text-teal-300">
                  ID
                </th>

                <th className="p-4 text-left text-teal-300">
                  Driver
                </th>

                <th className="p-4 text-left text-teal-300">
                  Vehicle
                </th>

                <th className="p-4 text-left text-teal-300">
                  Trip
                </th>

                <th className="p-4 text-left text-teal-300">
                  Status
                </th>

                <th className="p-4 text-left text-teal-300">
                  Remarks
                </th>

                <th className="p-4 text-left text-teal-300">
                  Actions
                </th>

              </tr>

            </thead>


            {/* ================= TABLE BODY ================= */}

            <tbody>

              {assignments.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    className="text-center p-10 text-teal-200/50"
                  >
                    No driver assignments found
                  </td>

                </tr>

              ) : (

                assignments.map((item) => (

                  <tr
                    key={item.assignment_id}
                    className="border-t border-teal-900/60 hover:bg-teal-500/5 transition"
                  >

                    {/* ID */}

                    <td className="p-4 text-teal-100/70">
                      {item.assignment_id}
                    </td>


                    {/* DRIVER */}

                    <td className="p-4">

                      <span className="bg-teal-500/10 text-teal-300 border border-teal-400/20 px-3 py-1 rounded-lg text-sm">
                        Driver #{item.driver_id}
                      </span>

                    </td>


                    {/* VEHICLE */}

                    <td className="p-4">

                      <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 px-3 py-1 rounded-lg text-sm">
                        Vehicle #{item.vehicle_id}
                      </span>

                    </td>


                    {/* TRIP */}

                    <td className="p-4">

                      <span className="bg-teal-500/10 text-teal-300 border border-teal-400/20 px-3 py-1 rounded-lg text-sm">
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
                            ? "bg-cyan-500/10 text-cyan-300 border-cyan-400/20"
                            : item.assignment_status
                                ?.toLowerCase() ===
                              "completed"
                            ? "bg-teal-500/10 text-teal-300 border-teal-400/20"
                            : "bg-slate-500/10 text-slate-300 border-slate-500/20"
                        }`}
                      >
                        {item.assignment_status ||
                          "Unknown"}
                      </span>

                    </td>


                    {/* REMARKS */}

                    <td className="p-4 text-teal-100/70 max-w-[200px]">
                      {item.remarks || "-"}
                    </td>


                    {/* ACTIONS */}

                    <td className="p-4">

                      <div className="flex gap-2">

                        {/* EDIT */}

                        {canManageAssignments && (
                          <Link
                            to={`/edit-driver-assignment/${item.assignment_id}`}
                            className="bg-teal-500/10 text-teal-300 border border-teal-400/20 px-3 py-1.5 rounded-lg hover:bg-teal-500/20 transition"
                          >
                            Edit
                          </Link>
                        )}


                        {/* DELETE */}

                        {canManageAssignments && (
                          <button
                            onClick={() =>
                              deleteAssignment(
                                item.assignment_id
                              )
                            }
                            className="bg-rose-500/10 text-rose-300 border border-rose-400/20 px-3 py-1.5 rounded-lg hover:bg-rose-500/20 transition"
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

    teal: {
      border: "border-teal-400/20",
      text: "text-teal-300",
      icon: "📋",
    },

    cyan: {
      border: "border-cyan-400/20",
      text: "text-cyan-300",
      icon: "🔄",
    },

    green: {
      border: "border-teal-400/20",
      text: "text-teal-300",
      icon: "✓",
    },

  };

  const style =
    styles[color] || styles.teal;

  return (

    <div
      className={`bg-[#062126]/80 backdrop-blur-xl border ${style.border} rounded-2xl p-5 shadow-xl`}
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-teal-100/70 text-sm">
            {title}
          </p>

          <p
            className={`text-3xl font-bold ${style.text} mt-2`}
          >
            {value}
          </p>

        </div>

        <div className="w-11 h-11 rounded-xl bg-teal-500/10 flex items-center justify-center text-xl">
          {style.icon}
        </div>

      </div>

    </div>

  );
}


export default DriverAssignments;