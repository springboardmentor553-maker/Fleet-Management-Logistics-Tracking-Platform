import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function DriverAttendance() {
  const [attendance, setAttendance] = useState([]);

  // =========================================================
  // USER ROLE
  // =========================================================

  const userRole =
    localStorage.getItem("role")
      ?.toLowerCase()
      .replace(/\s+/g, "_") || "";

  const canManageAttendance =
    userRole === "administrator" ||
    userRole === "fleet_manager";

  // =========================================================
  // LOAD ATTENDANCE
  // =========================================================

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const res = await api.get("/driver-attendance/");
      setAttendance(res.data);
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to load attendance"
      );
    }
  };

  // =========================================================
  // DELETE ATTENDANCE
  // =========================================================

  const deleteAttendance = async (id) => {
    if (!window.confirm("Delete Attendance?")) return;

    try {
      await api.delete(`/driver-attendance/${id}`);

      alert("Attendance Deleted Successfully");

      loadAttendance();
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to delete attendance"
      );
    }
  };

  // =========================================================
  // SUMMARY COUNTS
  // =========================================================

  const presentCount = attendance.filter(
    (item) =>
      item.attendance_status?.toLowerCase() === "present"
  ).length;

  const absentCount = attendance.filter(
    (item) =>
      item.attendance_status?.toLowerCase() === "absent"
  ).length;

  const leaveCount = attendance.filter(
    (item) =>
      item.attendance_status?.toLowerCase() === "leave"
  ).length;

  return (
    <Layout>

      {/* ================= HEADER ================= */}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

        <div>

          <p className="text-teal-300 text-sm font-medium mb-2">
            FleetFlow • People Center
          </p>

          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
            Driver Attendance
          </h1>

          <p className="text-teal-100/70 mt-2">
            Monitor driver attendance and working hours
          </p>

        </div>

        {/* ADD ATTENDANCE */}

        {canManageAttendance && (
          <Link
            to="/add-driver-attendance"
            className="w-fit bg-gradient-to-r from-teal-400 to-cyan-400 text-[#03181b] px-5 py-3 rounded-xl font-semibold shadow-lg shadow-teal-900/30 hover:from-teal-300 hover:to-cyan-300 hover:-translate-y-0.5 transition-all"
          >
            + Add Attendance
          </Link>
        )}

      </div>


      {/* ================= SUMMARY CARDS ================= */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

        <SummaryCard
          title="Total Records"
          value={attendance.length}
          color="teal"
        />

        <SummaryCard
          title="Present"
          value={presentCount}
          color="cyan"
        />

        <SummaryCard
          title="Absent"
          value={absentCount}
          color="rose"
        />

        <SummaryCard
          title="Leave"
          value={leaveCount}
          color="amber"
        />

      </div>


      {/* ================= ATTENDANCE TABLE ================= */}

      <div className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* TABLE HEADER */}

        <div className="p-6 border-b border-teal-900/60">

          <h2 className="text-xl font-bold text-teal-50">
            Attendance Records
          </h2>

          <p className="text-sm text-teal-200/50 mt-1">
            Driver attendance and check-in/check-out details
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full min-w-[850px]">

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
                  Date
                </th>

                <th className="p-4 text-left text-teal-300">
                  Status
                </th>

                <th className="p-4 text-left text-teal-300">
                  Check In
                </th>

                <th className="p-4 text-left text-teal-300">
                  Check Out
                </th>

                {canManageAttendance && (
                  <th className="p-4 text-left text-teal-300">
                    Actions
                  </th>
                )}

              </tr>

            </thead>


            {/* ================= TABLE BODY ================= */}

            <tbody>

              {attendance.length === 0 ? (

                <tr>

                  <td
                    colSpan={canManageAttendance ? 7 : 6}
                    className="text-center p-10 text-teal-200/50"
                  >
                    No attendance records found
                  </td>

                </tr>

              ) : (

                attendance.map((item) => (

                  <tr
                    key={item.attendance_id}
                    className="border-t border-teal-900/60 hover:bg-teal-500/5 transition"
                  >

                    {/* ID */}

                    <td className="p-4 text-teal-100/70">
                      {item.attendance_id}
                    </td>


                    {/* DRIVER */}

                    <td className="p-4">

                      <span className="bg-teal-500/10 text-teal-300 border border-teal-400/20 px-3 py-1 rounded-lg text-sm">
                        Driver #{item.driver_id}
                      </span>

                    </td>


                    {/* DATE */}

                    <td className="p-4 text-teal-100/70">
                      {item.date}
                    </td>


                    {/* STATUS */}

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          item.attendance_status
                            ?.toLowerCase() === "present"
                            ? "bg-cyan-500/10 text-cyan-300 border-cyan-400/20"
                            : item.attendance_status
                                ?.toLowerCase() === "absent"
                            ? "bg-rose-500/10 text-rose-300 border-rose-400/20"
                            : item.attendance_status
                                ?.toLowerCase() === "leave"
                            ? "bg-amber-500/10 text-amber-300 border-amber-400/20"
                            : "bg-slate-500/10 text-slate-300 border-slate-500/20"
                        }`}
                      >
                        {item.attendance_status || "Unknown"}
                      </span>

                    </td>


                    {/* CHECK IN */}

                    <td className="p-4 text-teal-100/70">
                      {item.check_in_time || "-"}
                    </td>


                    {/* CHECK OUT */}

                    <td className="p-4 text-teal-100/70">
                      {item.check_out_time || "-"}
                    </td>


                    {/* ACTIONS */}

                    {canManageAttendance && (

                      <td className="p-4">

                        <div className="flex gap-2">

                          <Link
                            to={`/edit-driver-attendance/${item.attendance_id}`}
                            className="bg-teal-500/10 text-teal-300 border border-teal-400/20 px-3 py-1.5 rounded-lg hover:bg-teal-500/20 transition"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() =>
                              deleteAttendance(
                                item.attendance_id
                              )
                            }
                            className="bg-rose-500/10 text-rose-300 border border-rose-400/20 px-3 py-1.5 rounded-lg hover:bg-rose-500/20 transition"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    )}

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


/* =========================================================
   SUMMARY CARD
========================================================= */

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
      icon: "✓",
    },

    rose: {
      border: "border-rose-400/20",
      text: "text-rose-300",
      icon: "!",
    },

    amber: {
      border: "border-amber-400/20",
      text: "text-amber-300",
      icon: "◷",
    },

  };

  const style = styles[color] || styles.teal;

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


export default DriverAttendance;