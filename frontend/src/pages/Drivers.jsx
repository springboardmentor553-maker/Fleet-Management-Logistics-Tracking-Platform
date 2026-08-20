import { useEffect, useState } from "react";

import {
  FaUsers,
  FaUserCheck,
  FaUserClock,
  FaUserTie,
  FaPlus,
  FaEdit,
  FaTrash,
  FaChartBar,
  FaTruck,
  FaRoute,
  FaTimes,
  FaSyncAlt,
  FaCalendarCheck,
  FaClock,
} from "react-icons/fa";

import {
  getDrivers,
  getDriverPerformance,
} from "../services/driverService";

import {
  getDriverAssignments,
  createDriverAssignment,
  updateDriverAssignment,
  deleteDriverAssignment,
} from "../services/driverAssignmentService";

import { getVehicles } from "../services/vehicleService";
import { getTrips } from "../services/tripService";

import {
  getDriverAttendance,
  createDriverAttendance,
  updateDriverAttendance,
} from "../services/driverAttendanceService";


function Drivers() {
  // =====================================================
  // DATA
  // =====================================================

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState([]);

  // =====================================================
  // GENERAL STATE
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // PERFORMANCE
  // =====================================================

  const [selectedDriver, setSelectedDriver] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [performanceLoading, setPerformanceLoading] =
    useState(false);

  // =====================================================
  // ASSIGNMENT
  // =====================================================

  const [showAssignmentModal, setShowAssignmentModal] =
    useState(false);

  const [assignmentToEdit, setAssignmentToEdit] =
    useState(null);

  const [assignmentForm, setAssignmentForm] = useState({
    driver_id: "",
    vehicle_id: "",
    trip_id: "",
    assignment_status: "ASSIGNED",
    remarks: "",
  });

  // =====================================================
  // ATTENDANCE
  // =====================================================

  const [showAttendanceModal, setShowAttendanceModal] =
    useState(false);

  const [attendanceToEdit, setAttendanceToEdit] =
    useState(null);

  const [attendanceForm, setAttendanceForm] = useState({
    driver_id: "",
    date: new Date().toISOString().slice(0, 10),
    attendance_status: "Present",
    check_in_time: "",
    check_out_time: "",
  });


  // =====================================================
  // LOAD ALL DATA
  // =====================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        driverData,
        vehicleData,
        tripData,
        assignmentData,
        attendanceData,
      ] = await Promise.all([
        getDrivers(),
        getVehicles(),
        getTrips(),
        getDriverAssignments(),
        getDriverAttendance(),
      ]);

      setDrivers(driverData || []);
      setVehicles(vehicleData || []);
      setTrips(tripData || []);
      setAssignments(assignmentData || []);
      setAttendance(attendanceData || []);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load driver operations data."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);


  // =====================================================
  // PERFORMANCE
  // =====================================================

  const viewPerformance = async (driver) => {
    try {
      setSelectedDriver(driver);
      setPerformance(null);
      setPerformanceLoading(true);
      setError("");

      const data = await getDriverPerformance(driver.id);

      setPerformance(data);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load driver performance."
      );
    } finally {
      setPerformanceLoading(false);
    }
  };


  // =====================================================
  // ASSIGNMENT FUNCTIONS
  // =====================================================

  const openAddAssignment = () => {
    setAssignmentToEdit(null);

    setAssignmentForm({
      driver_id: "",
      vehicle_id: "",
      trip_id: "",
      assignment_status: "ASSIGNED",
      remarks: "",
    });

    setError("");
    setSuccess("");
    setShowAssignmentModal(true);
  };


  const openEditAssignment = (assignment) => {
    setAssignmentToEdit(assignment);

    setAssignmentForm({
      driver_id: assignment.driver_id || "",
      vehicle_id: assignment.vehicle_id || "",
      trip_id: assignment.trip_id || "",
      assignment_status:
        assignment.assignment_status || "ASSIGNED",
      remarks: assignment.remarks || "",
    });

    setError("");
    setSuccess("");
    setShowAssignmentModal(true);
  };


  const closeAssignmentModal = () => {
    setShowAssignmentModal(false);
    setAssignmentToEdit(null);
    setError("");
  };


  const handleAssignmentChange = (e) => {
    setAssignmentForm({
      ...assignmentForm,
      [e.target.name]: e.target.value,
    });

    setError("");
  };


  const handleAssignmentSubmit = async () => {
    if (!assignmentForm.driver_id) {
      setError("Please select a driver.");
      return;
    }

    if (!assignmentForm.vehicle_id) {
      setError("Please select a vehicle.");
      return;
    }

    if (!assignmentForm.trip_id) {
      setError("Please select a trip.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const data = {
        driver_id: Number(assignmentForm.driver_id),
        vehicle_id: Number(assignmentForm.vehicle_id),
        trip_id: Number(assignmentForm.trip_id),
        assignment_status:
          assignmentForm.assignment_status,
        remarks:
          assignmentForm.remarks.trim() || null,
      };

      if (assignmentToEdit) {
        await updateDriverAssignment(
          assignmentToEdit.id,
          {
            assignment_status:
              data.assignment_status,
            remarks: data.remarks,
          }
        );

        setSuccess(
          "Driver assignment updated successfully."
        );
      } else {
        await createDriverAssignment(data);

        setSuccess(
          "Driver assigned successfully."
        );
      }

      await loadData();

      setTimeout(() => {
        closeAssignmentModal();
        setSuccess("");
      }, 700);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to save driver assignment."
      );
    } finally {
      setSaving(false);
    }
  };


  const handleDeleteAssignment = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this driver assignment?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteDriverAssignment(id);

      setSuccess(
        "Driver assignment removed successfully."
      );

      await loadData();

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to remove driver assignment."
      );
    }
  };


  // =====================================================
  // ATTENDANCE FUNCTIONS
  // =====================================================

  const openAddAttendance = () => {
    setAttendanceToEdit(null);

    setAttendanceForm({
      driver_id: "",
      date: new Date().toISOString().slice(0, 10),
      attendance_status: "Present",
      check_in_time: "",
      check_out_time: "",
    });

    setError("");
    setSuccess("");
    setShowAttendanceModal(true);
  };


  const openEditAttendance = (record) => {
    setAttendanceToEdit(record);

    setAttendanceForm({
      driver_id: record.driver_id || "",
      date: record.date
        ? record.date.slice(0, 10)
        : new Date().toISOString().slice(0, 10),

      attendance_status:
        record.attendance_status || "Present",

      check_in_time: record.check_in_time
        ? record.check_in_time.slice(11, 16)
        : "",

      check_out_time: record.check_out_time
        ? record.check_out_time.slice(11, 16)
        : "",
    });

    setError("");
    setSuccess("");
    setShowAttendanceModal(true);
  };


  const closeAttendanceModal = () => {
    setShowAttendanceModal(false);
    setAttendanceToEdit(null);
    setError("");
  };


  const handleAttendanceChange = (e) => {
    setAttendanceForm({
      ...attendanceForm,
      [e.target.name]: e.target.value,
    });

    setError("");
  };


  const handleAttendanceSubmit = async () => {
    if (!attendanceForm.driver_id) {
      setError("Please select a driver.");
      return;
    }

    if (!attendanceForm.date) {
      setError("Please select an attendance date.");
      return;
    }

    if (!attendanceForm.attendance_status) {
      setError("Please select an attendance status.");
      return;
    }

    if (
      attendanceForm.attendance_status === "Present" &&
      !attendanceForm.check_in_time
    ) {
      setError(
        "Please enter the check-in time for a present driver."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const data = {
        driver_id: Number(attendanceForm.driver_id),

        date: `${attendanceForm.date}T00:00:00`,

        attendance_status:
          attendanceForm.attendance_status,

        check_in_time:
          attendanceForm.check_in_time
            ? `${attendanceForm.date}T${attendanceForm.check_in_time}:00`
            : null,

        check_out_time:
          attendanceForm.check_out_time
            ? `${attendanceForm.date}T${attendanceForm.check_out_time}:00`
            : null,
      };

      if (attendanceToEdit) {
        await updateDriverAttendance(
          attendanceToEdit.id,
          {
            date: data.date,
            attendance_status:
              data.attendance_status,
            check_in_time:
              data.check_in_time,
            check_out_time:
              data.check_out_time,
          }
        );

        setSuccess(
          "Attendance updated successfully."
        );
      } else {
        await createDriverAttendance(data);

        setSuccess(
          "Attendance recorded successfully."
        );
      }

      await loadData();

      setTimeout(() => {
        closeAttendanceModal();
        setSuccess("");
      }, 700);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to save attendance record."
      );
    } finally {
      setSaving(false);
    }
  };


  // =====================================================
  // HELPERS
  // =====================================================

  const getDriverName = (driverId) => {
    const driver = drivers.find(
      (item) => item.id === driverId
    );

    return driver
      ? driver.name
      : `Driver #${driverId}`;
  };


  const getVehicleNumber = (vehicleId) => {
    const vehicle = vehicles.find(
      (item) => item.id === vehicleId
    );

    return vehicle
      ? vehicle.vehicle_number
      : `Vehicle #${vehicleId}`;
  };


  const getTripLabel = (tripId) => {
    const trip = trips.find(
      (item) => item.id === tripId
    );

    if (!trip) {
      return `Trip #${tripId}`;
    }

    return `Trip #${trip.id} — ${trip.start_location} → ${trip.end_location}`;
  };


  const getStatusClass = (status) => {
    const normalized = status?.toLowerCase();

    if (normalized === "available") {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }

    if (normalized === "assigned") {
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }

    if (
      normalized === "on leave" ||
      normalized === "leave"
    ) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }

    if (
      normalized === "inactive" ||
      normalized === "unavailable"
    ) {
      return "bg-red-500/10 text-red-400 border-red-500/20";
    }

    return "bg-slate-700/50 text-slate-300 border-slate-600";
  };


  const getAttendanceStatusClass = (status) => {
    const normalized = status?.toLowerCase();

    if (normalized === "present") {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }

    if (normalized === "absent") {
      return "bg-red-500/10 text-red-400 border-red-500/20";
    }

    if (normalized === "leave") {
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }

    return "bg-slate-700/50 text-slate-300 border-slate-600";
  };


  const formatDate = (value) => {
    if (!value) return "—";

    return new Date(value).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  const formatTime = (value) => {
    if (!value) return "—";

    return new Date(value).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };


  // =====================================================
  // KPI CALCULATIONS
  // =====================================================

  const totalDrivers = drivers.length;

  const availableDrivers = drivers.filter(
    (driver) =>
      driver.status?.toLowerCase() === "available"
  ).length;

  const assignedDrivers = drivers.filter(
    (driver) =>
      driver.status?.toLowerCase() === "assigned"
  ).length;

  const otherDrivers =
    totalDrivers -
    availableDrivers -
    assignedDrivers;


  const presentAttendance = attendance.filter(
    (item) =>
      item.attendance_status?.toLowerCase() ===
      "present"
  ).length;

  const absentAttendance = attendance.filter(
    (item) =>
      item.attendance_status?.toLowerCase() ===
      "absent"
  ).length;

  const leaveAttendance = attendance.filter(
    (item) =>
      item.attendance_status?.toLowerCase() ===
      "leave"
  ).length;


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="animate-spin text-blue-500 text-2xl mx-auto mb-3" />

          <p className="text-slate-400">
            Loading driver operations...
          </p>
        </div>
      </div>
    );
  }


  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 -m-8 p-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400 mb-2">
            Fleet Operations
          </p>

          <h1 className="text-3xl font-bold text-white">
            Driver Operations
          </h1>

          <p className="text-slate-400 mt-2">
            Monitor driver availability, assignments,
            attendance and performance.
          </p>
        </div>


        <div className="flex items-center gap-3">

          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
          >
            <FaSyncAlt />
            Refresh
          </button>


          <button
            onClick={openAddAssignment}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            <FaPlus />
            Assign Driver
          </button>

        </div>

      </div>


      {/* =================================================
          GLOBAL ERROR
      ================================================= */}

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400">
          {error}
        </div>
      )}


      {/* =================================================
          GLOBAL SUCCESS
      ================================================= */}

      {success && (
        <div className="mb-6 px-4 py-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
          {success}
        </div>
      )}


      {/* =================================================
          DRIVER KPI CARDS
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-400">
                Total Drivers
              </p>

              <p className="text-3xl font-bold text-white mt-2">
                {totalDrivers}
              </p>
            </div>

            <div className="w-11 h-11 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FaUsers />
            </div>

          </div>
        </div>


        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-400">
                Available
              </p>

              <p className="text-3xl font-bold text-emerald-400 mt-2">
                {availableDrivers}
              </p>
            </div>

            <div className="w-11 h-11 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FaUserCheck />
            </div>

          </div>
        </div>


        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-400">
                Assigned
              </p>

              <p className="text-3xl font-bold text-blue-400 mt-2">
                {assignedDrivers}
              </p>
            </div>

            <div className="w-11 h-11 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FaUserTie />
            </div>

          </div>
        </div>


        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-400">
                Other Status
              </p>

              <p className="text-3xl font-bold text-amber-400 mt-2">
                {otherDrivers}
              </p>
            </div>

            <div className="w-11 h-11 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <FaUserClock />
            </div>

          </div>
        </div>

      </div>


      {/* =================================================
          DRIVER ROSTER + PERFORMANCE
      ================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

        {/* DRIVER ROSTER */}

        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold text-white">
                Driver Roster
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Current driver availability and operational status
              </p>
            </div>

            <FaUsers className="text-slate-500" />

          </div>


          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-950/70">

                <tr>

                  <th className="text-left px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                    Driver
                  </th>

                  <th className="text-left px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                    Phone
                  </th>

                  <th className="text-left px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                    License
                  </th>

                  <th className="text-left px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="text-right px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {drivers.map((driver) => (

                  <tr
                    key={driver.id}
                    className="border-t border-slate-800 hover:bg-slate-800/40"
                  >

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400">
                          <FaUserTie />
                        </div>

                        <div>

                          <p className="font-medium text-white">
                            {driver.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            Driver #{driver.id}
                          </p>

                        </div>

                      </div>

                    </td>


                    <td className="px-6 py-4 text-sm text-slate-300">
                      {driver.phone || "—"}
                    </td>


                    <td className="px-6 py-4 text-sm text-slate-300">
                      {driver.license_number || "—"}
                    </td>


                    <td className="px-6 py-4">

                      <span
                        className={`inline-flex px-2.5 py-1 rounded-md border text-xs font-medium ${getStatusClass(
                          driver.status
                        )}`}
                      >
                        {driver.status || "Unknown"}
                      </span>

                    </td>


                    <td className="px-6 py-4 text-right">

                      <button
                        onClick={() =>
                          viewPerformance(driver)
                        }
                        className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                      >
                        <FaChartBar />
                        Performance
                      </button>

                    </td>

                  </tr>

                ))}


                {drivers.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-10 text-slate-500"
                    >
                      No drivers found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </div>


        {/* PERFORMANCE */}

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

          <div className="px-6 py-5 border-b border-slate-800">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-lg font-semibold text-white">
                  Driver Performance
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Trip performance overview
                </p>

              </div>

              <FaChartBar className="text-slate-500" />

            </div>

          </div>


          <div className="p-6">

            {!selectedDriver && (
              <div className="py-12 text-center">

                <FaChartBar className="text-slate-700 text-3xl mx-auto mb-4" />

                <p className="text-slate-400 text-sm">
                  Select a driver to view performance.
                </p>

              </div>
            )}


            {selectedDriver &&
              performanceLoading && (
                <div className="py-12 text-center text-slate-400">
                  Loading performance...
                </div>
              )}


            {selectedDriver &&
              !performanceLoading &&
              performance && (

                <div>

                  <div className="mb-6">

                    <p className="text-sm text-slate-500">
                      Selected Driver
                    </p>

                    <h3 className="text-xl font-semibold text-white mt-1">
                      {selectedDriver.name}
                    </h3>

                    <span
                      className={`inline-flex mt-2 px-2.5 py-1 rounded-md border text-xs ${getStatusClass(
                        selectedDriver.status
                      )}`}
                    >
                      {selectedDriver.status}
                    </span>

                  </div>


                  <div className="space-y-3">

                    <div className="flex items-center justify-between bg-slate-950 rounded-lg p-4">

                      <div className="flex items-center gap-3">

                        <FaRoute className="text-blue-400" />

                        <span className="text-sm text-slate-400">
                          Total Trips
                        </span>

                      </div>

                      <span className="font-semibold text-white">
                        {performance.total_trips ?? 0}
                      </span>

                    </div>


                    <div className="flex items-center justify-between bg-slate-950 rounded-lg p-4">

                      <div className="flex items-center gap-3">

                        <FaUserCheck className="text-emerald-400" />

                        <span className="text-sm text-slate-400">
                          Completed
                        </span>

                      </div>

                      <span className="font-semibold text-emerald-400">
                        {performance.completed_trips ?? 0}
                      </span>

                    </div>


                    <div className="flex items-center justify-between bg-slate-950 rounded-lg p-4">

                      <div className="flex items-center gap-3">

                        <FaTruck className="text-blue-400" />

                        <span className="text-sm text-slate-400">
                          Active
                        </span>

                      </div>

                      <span className="font-semibold text-blue-400">
                        {performance.active_trips ?? 0}
                      </span>

                    </div>


                    <div className="flex items-center justify-between bg-slate-950 rounded-lg p-4">

                      <div className="flex items-center gap-3">

                        <FaTimes className="text-red-400" />

                        <span className="text-sm text-slate-400">
                          Cancelled
                        </span>

                      </div>

                      <span className="font-semibold text-red-400">
                        {performance.cancelled_trips ?? 0}
                      </span>

                    </div>

                  </div>

                </div>
              )}

          </div>

        </div>

      </div>


      {/* =================================================
          ATTENDANCE SUMMARY
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-400">
                Present
              </p>

              <p className="text-2xl font-bold text-emerald-400 mt-2">
                {presentAttendance}
              </p>

            </div>

            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FaCalendarCheck />
            </div>

          </div>

        </div>


        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-400">
                Absent
              </p>

              <p className="text-2xl font-bold text-red-400 mt-2">
                {absentAttendance}
              </p>

            </div>

            <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <FaTimes />
            </div>

          </div>

        </div>


        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-400">
                Leave
              </p>

              <p className="text-2xl font-bold text-amber-400 mt-2">
                {leaveAttendance}
              </p>

            </div>

            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <FaUserClock />
            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          ATTENDANCE TABLE
      ================================================= */}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-8">

        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">

          <div>

            <h2 className="text-lg font-semibold text-white">
              Driver Attendance
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Daily attendance, check-in and check-out records
            </p>

          </div>


          <button
            onClick={openAddAttendance}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            <FaPlus />
            Mark Attendance
          </button>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-slate-950/70">

              <tr>

                <th className="text-left px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                  Driver
                </th>

                <th className="text-left px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                  Date
                </th>

                <th className="text-left px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="text-left px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                  Check-In
                </th>

                <th className="text-left px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                  Check-Out
                </th>

                <th className="text-right px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {attendance.map((record) => (

                <tr
                  key={record.id}
                  className="border-t border-slate-800 hover:bg-slate-800/40"
                >

                  <td className="px-6 py-4">

                    <p className="font-medium text-white">
                      {getDriverName(record.driver_id)}
                    </p>

                    <p className="text-xs text-slate-500">
                      Driver #{record.driver_id}
                    </p>

                  </td>


                  <td className="px-6 py-4 text-sm text-slate-300">
                    {formatDate(record.date)}
                  </td>


                  <td className="px-6 py-4">

                    <span
                      className={`inline-flex px-2.5 py-1 rounded-md border text-xs font-medium ${getAttendanceStatusClass(
                        record.attendance_status
                      )}`}
                    >
                      {record.attendance_status}
                    </span>

                  </td>


                  <td className="px-6 py-4 text-sm text-slate-300">

                    <span className="inline-flex items-center gap-2">

                      <FaClock className="text-slate-500" />

                      {formatTime(
                        record.check_in_time
                      )}

                    </span>

                  </td>


                  <td className="px-6 py-4 text-sm text-slate-300">
                    {formatTime(
                      record.check_out_time
                    )}
                  </td>


                  <td className="px-6 py-4 text-right">

                    <button
                      onClick={() =>
                        openEditAttendance(record)
                      }
                      className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                      <FaEdit />
                      Edit
                    </button>

                  </td>

                </tr>

              ))}


              {attendance.length === 0 && (
                <tr>

                  <td
                    colSpan="6"
                    className="text-center py-12 text-slate-500"
                  >
                    No attendance records found.
                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* =================================================
          DRIVER ASSIGNMENTS
      ================================================= */}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">

          <div>

            <h2 className="text-lg font-semibold text-white">
              Driver Assignments
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Active and historical driver-to-trip assignments
            </p>

          </div>


          <button
            onClick={openAddAssignment}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            <FaPlus />
            New Assignment
          </button>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-slate-950/70">

              <tr>

                <th className="text-left px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                  Assignment
                </th>

                <th className="text-left px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                  Driver
                </th>

                <th className="text-left px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                  Vehicle
                </th>

                <th className="text-left px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                  Trip
                </th>

                <th className="text-left px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                  Assigned On
                </th>

                <th className="text-left px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="text-right px-6 py-3 text-xs uppercase tracking-wide text-slate-500">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {assignments.map((assignment) => (

                <tr
                  key={assignment.id}
                  className="border-t border-slate-800 hover:bg-slate-800/40"
                >

                  <td className="px-6 py-4 text-sm text-slate-300">
                    #{assignment.id}
                  </td>


                  <td className="px-6 py-4 font-medium text-white">
                    {getDriverName(
                      assignment.driver_id
                    )}
                  </td>


                  <td className="px-6 py-4 text-sm text-slate-300">
                    {getVehicleNumber(
                      assignment.vehicle_id
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate">
                    {getTripLabel(
                        assignment.trip_id
                        )}
                        </td>
                        
                        <td className="px-6 py-4 text-sm text-slate-300">
                            {formatDate(assignment.assignment_date)}
                            </td>
                            
                            
                            <td className="px-6 py-4">
                                
                                <span
                                className={`inline-flex px-2.5 py-1 rounded-md border text-xs font-medium ${getStatusClass(
                                    assignment.assignment_status
                                )}`}
                                >
                                    {assignment.assignment_status}
                                    </span>
                                    
                                    </td>


                  <td className="px-6 py-4">

                    <div className="flex justify-end items-center gap-4">

                      <button
                        onClick={() =>
                          openEditAssignment(
                            assignment
                          )
                        }
                        className="text-blue-400 hover:text-blue-300"
                        title="Edit assignment"
                      >
                        <FaEdit />
                      </button>


                      <button
                        onClick={() =>
                          handleDeleteAssignment(
                            assignment.id
                          )
                        }
                        className="text-red-400 hover:text-red-300"
                        title="Remove assignment"
                      >
                        <FaTrash />
                      </button>

                    </div>

                  </td>

                </tr>

              ))}


              {assignments.length === 0 && (
                <tr>

                  <td
                    colSpan="7"
                    className="text-center py-12 text-slate-500"
                  >
                    No driver assignments found.
                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* =================================================
          ATTENDANCE MODAL
      ================================================= */}

      {showAttendanceModal && (

        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">

          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">

            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">

              <div>

                <h2 className="text-xl font-semibold text-white">
                  {attendanceToEdit
                    ? "Update Driver Attendance"
                    : "Mark Driver Attendance"}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Record the driver's daily attendance and working hours.
                </p>

              </div>


              <button
                onClick={closeAttendanceModal}
                className="text-slate-400 hover:text-white"
              >
                <FaTimes size={20} />
              </button>

            </div>


            <div className="p-6">

              {error && (
                <div className="mb-5 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
                  {error}
                </div>
              )}


              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* DRIVER */}

                <div>

                  <label className="block text-sm text-slate-300 mb-2">
                    Driver
                  </label>

                  <select
                    name="driver_id"
                    value={attendanceForm.driver_id}
                    onChange={handleAttendanceChange}
                    disabled={!!attendanceToEdit}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500 disabled:opacity-60"
                  >

                    <option value="">
                      Select Driver
                    </option>

                    {drivers.map((driver) => (
                      <option
                        key={driver.id}
                        value={driver.id}
                      >
                        {driver.name} — {driver.status}
                      </option>
                    ))}

                  </select>

                </div>


                {/* DATE */}

                <div>

                  <label className="block text-sm text-slate-300 mb-2">
                    Attendance Date
                  </label>

                  <input
                    type="date"
                    name="date"
                    value={attendanceForm.date}
                    onChange={handleAttendanceChange}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  />

                </div>


                {/* STATUS */}

                <div>

                  <label className="block text-sm text-slate-300 mb-2">
                    Attendance Status
                  </label>

                  <select
                    name="attendance_status"
                    value={
                      attendanceForm.attendance_status
                    }
                    onChange={handleAttendanceChange}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  >

                    <option value="Present">
                      Present
                    </option>

                    <option value="Absent">
                      Absent
                    </option>

                    <option value="Leave">
                      Leave
                    </option>

                  </select>

                </div>


                {/* CHECK IN */}

                <div>

                  <label className="block text-sm text-slate-300 mb-2">
                    Check-In Time
                  </label>

                  <input
                    type="time"
                    name="check_in_time"
                    value={
                      attendanceForm.check_in_time
                    }
                    onChange={handleAttendanceChange}
                    disabled={
                      attendanceForm.attendance_status !==
                      "Present"
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  />

                </div>


                {/* CHECK OUT */}

                <div>

                  <label className="block text-sm text-slate-300 mb-2">
                    Check-Out Time
                  </label>

                  <input
                    type="time"
                    name="check_out_time"
                    value={
                      attendanceForm.check_out_time
                    }
                    onChange={handleAttendanceChange}
                    disabled={
                      attendanceForm.attendance_status !==
                      "Present"
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  />

                </div>

              </div>


              <div className="flex justify-end gap-3 mt-7">

                <button
                  onClick={closeAttendanceModal}
                  className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>


                <button
                  onClick={handleAttendanceSubmit}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : attendanceToEdit
                    ? "Update Attendance"
                    : "Save Attendance"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          ASSIGNMENT MODAL
      ================================================= */}

      {showAssignmentModal && (

        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">

          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">

            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">

              <div>

                <h2 className="text-xl font-semibold text-white">
                  {assignmentToEdit
                    ? "Update Driver Assignment"
                    : "Assign Driver"}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {assignmentToEdit
                    ? "Update assignment status or remarks."
                    : "Assign an available driver to a vehicle and trip."}
                </p>

              </div>


              <button
                onClick={closeAssignmentModal}
                className="text-slate-400 hover:text-white"
              >
                <FaTimes size={20} />
              </button>

            </div>


            <div className="p-6">

              {error && (
                <div className="mb-5 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
                  {error}
                </div>
              )}


              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* DRIVER */}

                <div>

                  <label className="block text-sm text-slate-300 mb-2">
                    Driver
                  </label>

                  <select
                    name="driver_id"
                    value={assignmentForm.driver_id}
                    onChange={handleAssignmentChange}
                    disabled={!!assignmentToEdit}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500 disabled:opacity-60"
                  >

                    <option value="">
                      Select Driver
                    </option>

                    {drivers.map((driver) => (
                      <option
                        key={driver.id}
                        value={driver.id}
                      >
                        {driver.name} — {driver.status}
                      </option>
                    ))}

                  </select>

                </div>


                {/* VEHICLE */}

                <div>

                  <label className="block text-sm text-slate-300 mb-2">
                    Vehicle
                  </label>

                  <select
                    name="vehicle_id"
                    value={assignmentForm.vehicle_id}
                    onChange={handleAssignmentChange}
                    disabled={!!assignmentToEdit}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500 disabled:opacity-60"
                  >

                    <option value="">
                      Select Vehicle
                    </option>

                    {vehicles.map((vehicle) => (
                      <option
                        key={vehicle.id}
                        value={vehicle.id}
                      >
                        {vehicle.vehicle_number} —{" "}
                        {vehicle.status}
                      </option>
                    ))}

                  </select>

                </div>


                {/* TRIP */}

                <div>

                  <label className="block text-sm text-slate-300 mb-2">
                    Trip
                  </label>

                  <select
                    name="trip_id"
                    value={assignmentForm.trip_id}
                    onChange={handleAssignmentChange}
                    disabled={!!assignmentToEdit}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500 disabled:opacity-60"
                  >

                    <option value="">
                      Select Trip
                    </option>

                    {trips.map((trip) => (
                      <option
                        key={trip.id}
                        value={trip.id}
                      >
                        Trip #{trip.id} —{" "}
                        {trip.start_location} →{" "}
                        {trip.end_location}
                      </option>
                    ))}

                  </select>

                </div>


                {/* STATUS */}

                <div>

                  <label className="block text-sm text-slate-300 mb-2">
                    Assignment Status
                  </label>

                  <select
                    name="assignment_status"
                    value={
                      assignmentForm.assignment_status
                    }
                    onChange={handleAssignmentChange}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  >

                    <option value="ASSIGNED">
                      ASSIGNED
                    </option>

                    <option value="COMPLETED">
                      COMPLETED
                    </option>

                    <option value="CANCELLED">
                      CANCELLED
                    </option>

                  </select>

                </div>


                {/* REMARKS */}

                <div className="md:col-span-2">

                  <label className="block text-sm text-slate-300 mb-2">
                    Remarks
                  </label>

                  <textarea
                    name="remarks"
                    value={assignmentForm.remarks}
                    onChange={handleAssignmentChange}
                    rows="3"
                    placeholder="Optional assignment remarks"
                    className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-600 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  />

                </div>

              </div>


              <div className="flex justify-end gap-3 mt-7">

                <button
                  onClick={closeAssignmentModal}
                  className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>


                <button
                  onClick={handleAssignmentSubmit}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : assignmentToEdit
                    ? "Update Assignment"
                    : "Assign Driver"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default Drivers;