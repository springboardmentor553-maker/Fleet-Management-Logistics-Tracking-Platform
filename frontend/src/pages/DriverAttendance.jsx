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

  // Only Administrator and Fleet Manager can manage attendance
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

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

        <div>

          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            Driver Attendance
          </h1>

          <p className="text-slate-400 mt-2">
            Monitor driver attendance and working hours
          </p>

        </div>

        {/* =================================================
            ADD BUTTON
            Only Administrator / Fleet Manager
        ================================================== */}

        {canManageAttendance && (
          <Link
            to="/add-driver-attendance"
            className="w-fit bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-blue-900/30 hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-0.5 transition-all"
          >
            + Add Attendance
          </Link>
        )}

      </div>


      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

        <SummaryCard
          title="Total Records"
          value={attendance.length}
          color="blue"
        />

        <SummaryCard
          title="Present"
          value={presentCount}
          color="green"
        />

        <SummaryCard
          title="Absent"
          value={absentCount}
          color="red"
        />

        <SummaryCard
          title="Leave"
          value={leaveCount}
          color="yellow"
        />

      </div>


      {/* =====================================================
          ATTENDANCE TABLE
      ====================================================== */}

      <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">

        <div className="p-6 border-b border-slate-800">

          <h2 className="text-xl font-bold text-white">
            Attendance Records
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Driver attendance and check-in/check-out details
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full min-w-[850px]">

            {/* =================================================
                TABLE HEADER
            ================================================== */}

            <thead className="bg-blue-600/20">

              <tr>

                <th className="p-4 text-left text-blue-300">
                  ID
                </th>

                <th className="p-4 text-left text-blue-300">
                  Driver
                </th>

                <th className="p-4 text-left text-blue-300">
                  Date
                </th>

                <th className="p-4 text-left text-blue-300">
                  Status
                </th>

                <th className="p-4 text-left text-blue-300">
                  Check In
                </th>

                <th className="p-4 text-left text-blue-300">
                  Check Out
                </th>

                {/* Actions only for Admin / Fleet Manager */}

                {canManageAttendance && (
                  <th className="p-4 text-left text-blue-300">
                    Actions
                  </th>
                )}

              </tr>

            </thead>


            {/* =================================================
                TABLE BODY
            ================================================== */}

            <tbody>

              {attendance.length === 0 ? (

                <tr>

                  <td
                    colSpan={canManageAttendance ? 7 : 6}
                    className="text-center p-10 text-slate-500"
                  >
                    No attendance records found
                  </td>

                </tr>

              ) : (

                attendance.map((item) => (

                  <tr
                    key={item.attendance_id}
                    className="border-t border-slate-800 hover:bg-blue-500/5 transition"
                  >

                    {/* =================================================
                        ID
                    ================================================== */}

                    <td className="p-4 text-slate-400">
                      {item.attendance_id}
                    </td>


                    {/* =================================================
                        DRIVER
                    ================================================== */}

                    <td className="p-4">

                      <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3 py-1 rounded-lg text-sm">
                        Driver #{item.driver_id}
                      </span>

                    </td>


                    {/* =================================================
                        DATE
                    ================================================== */}

                    <td className="p-4 text-slate-300">
                      {item.date}
                    </td>


                    {/* =================================================
                        STATUS
                    ================================================== */}

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          item.attendance_status?.toLowerCase() ===
                          "present"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : item.attendance_status?.toLowerCase() ===
                              "absent"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : item.attendance_status?.toLowerCase() ===
                              "leave"
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            : "bg-slate-500/10 text-slate-300 border-slate-500/20"
                        }`}
                      >
                        {item.attendance_status || "Unknown"}
                      </span>

                    </td>


                    {/* =================================================
                        CHECK IN
                    ================================================== */}

                    <td className="p-4 text-slate-400">
                      {item.check_in_time || "-"}
                    </td>


                    {/* =================================================
                        CHECK OUT
                    ================================================== */}

                    <td className="p-4 text-slate-400">
                      {item.check_out_time || "-"}
                    </td>


                    {/* =================================================
                        ACTIONS
                        Only Administrator / Fleet Manager
                    ================================================== */}

                    {canManageAttendance && (

                      <td className="p-4">

                        <div className="flex gap-2">

                          <Link
                            to={`/edit-driver-attendance/${item.attendance_id}`}
                            className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() =>
                              deleteAttendance(
                                item.attendance_id
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

    blue: {
      border: "border-blue-400/20",
      text: "text-blue-400",
    },

    green: {
      border: "border-green-400/20",
      text: "text-green-400",
    },

    red: {
      border: "border-red-400/20",
      text: "text-red-400",
    },

    yellow: {
      border: "border-yellow-400/20",
      text: "text-yellow-400",
    },

  };

  const style = styles[color] || styles.blue;

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


export default DriverAttendance;