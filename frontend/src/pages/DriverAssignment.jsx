import { useEffect, useState } from "react";
import api from "../api/api";
import { toast } from "react-toastify";

import {
  FaEdit,
  FaTrash,
  FaUserCheck,
  FaPlus,
  FaSearch,
  FaUserTie,
  FaTruck,
  FaRoute,
  FaCheckCircle,
  FaClock,
  FaUsers,
  FaCalendarAlt,
  FaUserClock,
  FaSave,
} from "react-icons/fa";


function DriverAssignment() {

  // =========================================================
  // EMPTY ASSIGNMENT
  // =========================================================

  const emptyAssignment = {
    driver_id: "",
    vehicle_id: "",
    trip_id: "",
  };


  // =========================================================
  // STATES
  // =========================================================

  const [assignments, setAssignments] =
    useState([]);

  const [drivers, setDrivers] =
    useState([]);

  const [vehicles, setVehicles] =
    useState([]);

  const [trips, setTrips] =
    useState([]);

  const [assignment, setAssignment] =
    useState(emptyAssignment);

  const [editAssignment, setEditAssignment] =
    useState(emptyAssignment);

  const [editId, setEditId] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  // =========================================================
  // DRIVER ATTENDANCE
  // =========================================================

  const [attendance, setAttendance] =
    useState([]);

  const [attendanceDate, setAttendanceDate] =
    useState(
      new Date().toISOString().split("T")[0]
    );

  const [attendanceSearch, setAttendanceSearch] =
    useState("");

  const [attendanceForm, setAttendanceForm] =
    useState({
      driver_id: "",
      date: new Date().toISOString().split("T")[0],
      attendance_status: "Present",
      check_in_time: "",
      check_out_time: "",
    });

  const [editAttendanceId, setEditAttendanceId] =
    useState(null);

  const [attendanceSaving, setAttendanceSaving] =
    useState(false);


  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    loadData();
  }, []);


  const loadData = async () => {

    setLoading(true);

    await Promise.all([
      fetchAssignments(),
      fetchDrivers(),
      fetchVehicles(),
      fetchTrips(),
      fetchAttendance(),
    ]);

    setLoading(false);
  };


  // =========================================================
  // FETCH ASSIGNMENTS
  // =========================================================

  const fetchAssignments = async () => {

    try {

      const response =
        await api.get(
          "/driver-assignment/"
        );

      setAssignments(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {

      console.error(
        "Fetch Assignments Error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to load assignments"
      );

    }

  };


  // =========================================================
  // FETCH DRIVERS
  // =========================================================

  const fetchDrivers = async () => {

    try {

      const response =
        await api.get("/drivers");

      setDrivers(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {

      console.error(
        "Fetch Drivers Error:",
        error
      );

    }

  };


  // =========================================================
  // FETCH VEHICLES
  // =========================================================

  const fetchVehicles = async () => {

    try {

      const response =
        await api.get("/vehicles");

      setVehicles(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {

      console.error(
        "Fetch Vehicles Error:",
        error
      );

    }

  };


  // =========================================================
  // FETCH TRIPS
  // =========================================================

  const fetchTrips = async () => {

    try {

      const response =
        await api.get("/trips");

      setTrips(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {

      console.error(
        "Fetch Trips Error:",
        error
      );

    }

  };


  // =========================================================
  // FETCH DRIVER ATTENDANCE
  // =========================================================

  const fetchAttendance = async () => {

    try {

      const response =
        await api.get("/driver-attendance/");

      setAttendance(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {

      console.error(
        "Fetch Attendance Error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to load driver attendance"
      );

    }

  };


  // =========================================================
  // ATTENDANCE FORM CHANGE
  // =========================================================

  const handleAttendanceChange = (event) => {

    const {
      name,
      value,
    } = event.target;

    setAttendanceForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  };


  // =========================================================
  // ADD ATTENDANCE
  // =========================================================

  const addAttendance = async (event) => {

    event.preventDefault();

    if (!attendanceForm.driver_id) {
      toast.error("Please select a driver");
      return;
    }

    try {

      setAttendanceSaving(true);

      const payload = {
        driver_id: Number(attendanceForm.driver_id),
        date: attendanceForm.date,
        attendance_status:
          attendanceForm.attendance_status,
        check_in_time:
          attendanceForm.check_in_time || null,
        check_out_time:
          attendanceForm.check_out_time || null,
      };

      await api.post(
        "/driver-attendance/",
        payload
      );

      toast.success(
        "Attendance marked successfully"
      );

      setAttendanceForm({
        driver_id: "",
        date: attendanceDate,
        attendance_status: "Present",
        check_in_time: "",
        check_out_time: "",
      });

      await fetchAttendance();

      const closeButton =
        document.getElementById(
          "closeAttendanceModal"
        );

      if (closeButton) {
        closeButton.click();
      }

    } catch (error) {

      console.error(
        "Add Attendance Error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to mark attendance"
      );

    } finally {

      setAttendanceSaving(false);

    }

  };


  // =========================================================
  // OPEN ATTENDANCE EDIT
  // =========================================================

  const openAttendanceEdit = (record) => {

    setEditAttendanceId(record.id);

    setAttendanceForm({
      driver_id: record.driver_id ?? "",
      date: record.date ?? attendanceDate,
      attendance_status:
        record.attendance_status || "Present",
      check_in_time:
        record.check_in_time
          ? String(record.check_in_time).slice(0, 5)
          : "",
      check_out_time:
        record.check_out_time
          ? String(record.check_out_time).slice(0, 5)
          : "",
    });

  };


  // =========================================================
  // UPDATE ATTENDANCE
  // =========================================================

  const updateAttendance = async (event) => {

    event.preventDefault();

    if (!editAttendanceId) {
      toast.error("Attendance ID is missing");
      return;
    }

    try {

      setAttendanceSaving(true);

      const payload = {
        attendance_status:
          attendanceForm.attendance_status,
        check_in_time:
          attendanceForm.check_in_time || null,
        check_out_time:
          attendanceForm.check_out_time || null,
      };

      await api.put(
        `/driver-attendance/${editAttendanceId}`,
        payload
      );

      toast.success(
        "Attendance updated successfully"
      );

      setEditAttendanceId(null);

      await fetchAttendance();

      const closeButton =
        document.getElementById(
          "closeAttendanceEditModal"
        );

      if (closeButton) {
        closeButton.click();
      }

    } catch (error) {

      console.error(
        "Update Attendance Error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to update attendance"
      );

    } finally {

      setAttendanceSaving(false);

    }

  };


  // =========================================================
  // DELETE ATTENDANCE
  // =========================================================

  const deleteAttendance = async (id) => {

    if (
      !window.confirm(
        "Are you sure you want to delete this attendance record?"
      )
    ) {
      return;
    }

    try {

      await api.delete(
        `/driver-attendance/${id}`
      );

      toast.success(
        "Attendance deleted successfully"
      );

      await fetchAttendance();

    } catch (error) {

      console.error(
        "Delete Attendance Error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to delete attendance"
      );

    }

  };


  // =========================================================
  // DRIVER / VEHICLE HELPERS
  // =========================================================

  const getDriverName = (driverId) => {

    const driver = drivers.find(
      (item) =>
        Number(item.id) === Number(driverId)
    );

    return (
      driver?.name ||
      `Driver #${driverId}`
    );

  };


  const getVehicleNumber = (vehicleId) => {

    const vehicle = vehicles.find(
      (item) =>
        Number(item.id) === Number(vehicleId)
    );

    return (
      vehicle?.vehicle_number ||
      vehicle?.license_plate ||
      `Vehicle #${vehicleId}`
    );

  };


  // =========================================================
  // ATTENDANCE FILTER
  // =========================================================

  const filteredAttendance =
    attendance.filter((record) => {

      const matchesDate =
        !attendanceDate ||
        record.date === attendanceDate;

      const driverName =
        getDriverName(record.driver_id);

      const searchText = `
        ${driverName}
        ${record.driver_id || ""}
        ${record.attendance_status || ""}
        ${record.date || ""}
      `.toLowerCase();

      return (
        matchesDate &&
        searchText.includes(
          attendanceSearch.toLowerCase()
        )
      );

    });


  const attendancePresent =
    filteredAttendance.filter(
      (item) =>
        String(item.attendance_status)
          .toLowerCase() === "present"
    ).length;

  const attendanceAbsent =
    filteredAttendance.filter(
      (item) =>
        String(item.attendance_status)
          .toLowerCase() === "absent"
    ).length;

  const attendanceLate =
    filteredAttendance.filter(
      (item) =>
        String(item.attendance_status)
          .toLowerCase() === "late"
    ).length;

  const attendanceLeave =
    filteredAttendance.filter(
      (item) =>
        String(item.attendance_status)
          .toLowerCase() === "leave"
    ).length;


  // =========================================================
  // ATTENDANCE STATUS STYLE
  // =========================================================

  const getAttendanceStyle = (status) => {

    const value =
      String(status || "")
        .toLowerCase();

    if (value === "present") {
      return {
        background: "#dcfce7",
        color: "#15803d",
      };
    }

    if (value === "absent") {
      return {
        background: "#fee2e2",
        color: "#dc2626",
      };
    }

    if (value === "late") {
      return {
        background: "#fef3c7",
        color: "#b45309",
      };
    }

    if (value === "leave") {
      return {
        background: "#ede9fe",
        color: "#7c3aed",
      };
    }

    return {
      background: "#e2e8f0",
      color: "#475569",
    };

  };


  // =========================================================
  // ADD FORM CHANGE
  // =========================================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;

    setAssignment(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  };


  // =========================================================
  // EDIT FORM CHANGE
  // =========================================================

  const handleEditChange = (event) => {

    const {
      name,
      value,
    } = event.target;

    setEditAssignment(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  };


  // =========================================================
  // ADD ASSIGNMENT
  // =========================================================

  const addAssignment = async (event) => {

    event.preventDefault();

    if (
      !assignment.driver_id ||
      !assignment.vehicle_id ||
      !assignment.trip_id
    ) {

      toast.error(
        "Please select driver, vehicle and trip"
      );

      return;
    }


    try {

      setSaving(true);

      const payload = {
        driver_id:
          Number(assignment.driver_id),

        vehicle_id:
          Number(assignment.vehicle_id),

        trip_id:
          Number(assignment.trip_id),
      };


      await api.post(
        "/driver-assignment/",
        payload
      );


      toast.success(
        "Driver Assigned Successfully"
      );


      setAssignment(
        emptyAssignment
      );


      await fetchAssignments();


      const closeButton =
        document.getElementById(
          "closeAddAssignmentModal"
        );

      if (closeButton) {
        closeButton.click();
      }


    } catch (error) {

      console.error(
        "Add Assignment Error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Assignment Failed"
      );

    } finally {

      setSaving(false);

    }

  };


  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditModal = (item) => {

    setEditAssignment({

      driver_id:
        item.driver_id ?? "",

      vehicle_id:
        item.vehicle_id ?? "",

      trip_id:
        item.trip_id ?? "",

    });

    setEditId(item.id);

  };


  // =========================================================
  // UPDATE ASSIGNMENT
  // =========================================================

  const updateAssignment = async (event) => {

    event.preventDefault();


    if (!editId) {

      toast.error(
        "Assignment ID is missing"
      );

      return;
    }


    if (
      !editAssignment.driver_id ||
      !editAssignment.vehicle_id ||
      !editAssignment.trip_id
    ) {

      toast.error(
        "Please select driver, vehicle and trip"
      );

      return;
    }


    try {

      setSaving(true);


      const payload = {

        driver_id:
          Number(
            editAssignment.driver_id
          ),

        vehicle_id:
          Number(
            editAssignment.vehicle_id
          ),

        trip_id:
          Number(
            editAssignment.trip_id
          ),

      };


      await api.put(
        `/driver-assignment/${editId}`,
        payload
      );


      toast.success(
        "Assignment Updated Successfully"
      );


      await fetchAssignments();


      const closeButton =
        document.getElementById(
          "closeEditAssignmentModal"
        );

      if (closeButton) {
        closeButton.click();
      }


    } catch (error) {

      console.error(
        "Update Assignment Error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Update Failed"
      );

    } finally {

      setSaving(false);

    }

  };


  // =========================================================
  // DELETE ASSIGNMENT
  // =========================================================

  const deleteAssignment = async (id) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this assignment?"
      );


    if (!confirmed) {
      return;
    }


    try {

      await api.delete(
        `/driver-assignment/${id}`
      );


      toast.success(
        "Assignment Deleted Successfully"
      );


      await fetchAssignments();


    } catch (error) {

      console.error(
        "Delete Assignment Error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Delete Failed"
      );

    }

  };


  // =========================================================
  // SEARCH
  // =========================================================

  const filteredAssignments =
    assignments.filter((item) => {

      const searchText =
        `
        ${item.id || ""}
        ${item.driver_id || ""}
        ${item.vehicle_id || ""}
        ${item.trip_id || ""}
        ${item.status || ""}
        ${item.assigned_at || ""}
        `.toLowerCase();


      return searchText.includes(
        search.toLowerCase()
      );

    });


  // =========================================================
  // STATISTICS
  // =========================================================

  const totalAssignments =
    assignments.length;


  const activeAssignments =
    assignments.filter((item) => {

      const status =
        String(
          item.status || ""
        ).toLowerCase();


      return (
        status.includes("active") ||
        status.includes("assigned")
      );

    }).length;


  const completedAssignments =
    assignments.filter((item) => {

      const status =
        String(
          item.status || ""
        ).toLowerCase();


      return (
        status.includes("completed") ||
        status.includes("complete")
      );

    }).length;


  // =========================================================
  // LOADING UI
  // =========================================================

  if (loading) {

    return (

      <div
        className="container-fluid d-flex justify-content-center align-items-center"
        style={{
          minHeight: "70vh",
        }}
      >

        <div className="text-center">

          <div
            className="spinner-border text-primary mb-3"
            role="status"
          />

          <h6 className="text-muted">
            Loading Driver Assignments...
          </h6>

        </div>

      </div>

    );

  }


  // =========================================================
  // MAIN UI
  // =========================================================

  return (

    <div
      className="container-fluid"
      style={{
        padding: "30px",
      }}
    >


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        className="d-flex justify-content-between align-items-center mb-4"
      >

        <div>

          <h2
            className="fw-bold mb-1"
            style={{
              color: "#172033",
              fontSize: "30px",
            }}
          >

            <FaUserCheck
              className="me-2"
              style={{
                color: "#2563eb",
              }}
            />

            Driver Assignment

          </h2>


          <p className="text-muted mb-0">
            Assign drivers to vehicles and trips.
          </p>

        </div>


        <button
          type="button"
          className="btn"
          data-bs-toggle="modal"
          data-bs-target="#addAssignmentModal"
          style={{
            background: "#2563eb",
            color: "white",
            borderRadius: "10px",
            padding: "11px 20px",
            fontWeight: "600",
            boxShadow:
              "0 5px 15px rgba(37,99,235,0.25)",
          }}
        >

          <FaPlus className="me-2" />

          Assign Driver

        </button>

      </div>


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="row g-4 mb-4">


        {/* TOTAL */}

        <div className="col-lg-4 col-md-6">

          <div
            className="card border-0 h-100"
            style={{
              borderRadius: "16px",
              boxShadow:
                "0 6px 20px rgba(15,23,42,0.08)",
            }}
          >

            <div
              className="card-body p-4 d-flex align-items-center"
            >

              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "23px",
                  marginRight: "15px",
                }}
              >

                <FaUsers />

              </div>


              <div>

                <small className="text-muted">
                  TOTAL ASSIGNMENTS
                </small>

                <h3
                  className="fw-bold mb-0"
                  style={{
                    color: "#172033",
                  }}
                >
                  {totalAssignments}
                </h3>

              </div>

            </div>

          </div>

        </div>


        {/* ACTIVE */}

        <div className="col-lg-4 col-md-6">

          <div
            className="card border-0 h-100"
            style={{
              borderRadius: "16px",
              boxShadow:
                "0 6px 20px rgba(15,23,42,0.08)",
            }}
          >

            <div
              className="card-body p-4 d-flex align-items-center"
            >

              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "#ecfdf5",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "23px",
                  marginRight: "15px",
                }}
              >

                <FaCheckCircle />

              </div>


              <div>

                <small className="text-muted">
                  ACTIVE ASSIGNMENTS
                </small>

                <h3
                  className="fw-bold mb-0"
                  style={{
                    color: "#172033",
                  }}
                >
                  {activeAssignments}
                </h3>

              </div>

            </div>

          </div>

        </div>


        {/* COMPLETED */}

        <div className="col-lg-4 col-md-6">

          <div
            className="card border-0 h-100"
            style={{
              borderRadius: "16px",
              boxShadow:
                "0 6px 20px rgba(15,23,42,0.08)",
            }}
          >

            <div
              className="card-body p-4 d-flex align-items-center"
            >

              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "#f5f3ff",
                  color: "#8b5cf6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "23px",
                  marginRight: "15px",
                }}
              >

                <FaRoute />

              </div>


              <div>

                <small className="text-muted">
                  COMPLETED
                </small>

                <h3
                  className="fw-bold mb-0"
                  style={{
                    color: "#172033",
                  }}
                >
                  {completedAssignments}
                </h3>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div
        className="card border-0 mb-4"
        style={{
          borderRadius: "15px",
          boxShadow:
            "0 5px 18px rgba(15,23,42,0.07)",
        }}
      >

        <div className="card-body p-3">

          <div
            style={{
              position: "relative",
              maxWidth: "550px",
            }}
          >

            <FaSearch
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform:
                  "translateY(-50%)",
                color: "#94a3b8",
              }}
            />


            <input
              type="text"
              className="form-control"
              placeholder="Search driver, vehicle, trip or status..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              style={{
                height: "48px",
                paddingLeft: "45px",
                borderRadius: "10px",
                border:
                  "1px solid #e2e8f0",
              }}
            />

          </div>

        </div>

      </div>


      {/* =====================================================
          TABLE
      ===================================================== */}

      <div
        className="card border-0"
        style={{
          borderRadius: "16px",
          boxShadow:
            "0 6px 22px rgba(15,23,42,0.08)",
          overflow: "hidden",
        }}
      >

        <div
          className="card-header border-0"
          style={{
            background: "white",
            padding: "20px 24px",
          }}
        >

          <div className="d-flex align-items-center">

            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
              }}
            >

              <FaUserCheck />

            </div>


            <div>

              <h5
                className="fw-bold mb-0"
                style={{
                  color: "#172033",
                }}
              >
                Driver Assignments
              </h5>

              <small className="text-muted">
                Manage driver, vehicle and trip assignments
              </small>

            </div>

          </div>

        </div>


        <div className="table-responsive">

          <table
            className="table align-middle mb-0"
          >

            <thead
              style={{
                background: "#f8fafc",
              }}
            >

              <tr>

                <th
                  style={{
                    padding: "15px 20px",
                  }}
                >
                  ID
                </th>

                <th>
                  Driver
                </th>

                <th>
                  Vehicle
                </th>

                <th>
                  Trip
                </th>

                <th>
                  Assigned
                </th>

                <th>
                  Status
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredAssignments.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    className="text-center py-5"
                  >

                    <FaUserCheck
                      style={{
                        fontSize: "40px",
                        color: "#cbd5e1",
                      }}
                    />


                    <h6
                      className="mt-3"
                      style={{
                        color: "#64748b",
                      }}
                    >
                      No assignments found
                    </h6>


                    <small className="text-muted">
                      Create a driver assignment to see it here.
                    </small>

                  </td>

                </tr>

              ) : (

                filteredAssignments.map(
                  (item) => {

                    const status =
                      String(
                        item.status ||
                        "Assigned"
                      );


                    const statusLower =
                      status.toLowerCase();


                    const isCompleted =
                      statusLower.includes(
                        "complete"
                      );


                    const isActive =
                      statusLower.includes(
                        "active"
                      ) ||
                      statusLower.includes(
                        "assigned"
                      );


                    return (

                      <tr
                        key={item.id}
                      >


                        {/* ID */}

                        <td
                          style={{
                            padding:
                              "16px 20px",
                            fontWeight:
                              "700",
                            color:
                              "#64748b",
                          }}
                        >
                          #{item.id}
                        </td>


                        {/* DRIVER */}

                        <td>

                          <div className="d-flex align-items-center">

                            <div
                              style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "50%",
                                background: "#eff6ff",
                                color: "#2563eb",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: "10px",
                              }}
                            >

                              <FaUserTie />

                            </div>


                            <div>

                              <div
                                style={{
                                  fontWeight:
                                    "600",
                                  color:
                                    "#172033",
                                }}
                              >
                                {getDriverName(
                                  item.driver_id
                                )}
                              </div>

                              <small className="text-muted">
                                Assigned Driver
                              </small>

                            </div>

                          </div>

                        </td>


                        {/* VEHICLE */}

                        <td>

                          <div className="d-flex align-items-center">

                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "9px",
                                background: "#f1f5f9",
                                color: "#475569",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: "9px",
                              }}
                            >

                              <FaTruck />

                            </div>


                            <span
                              style={{
                                fontWeight:
                                  "600",
                              }}
                            >
                              {getVehicleNumber(
                                item.vehicle_id
                              )}
                            </span>

                          </div>

                        </td>


                        {/* TRIP */}

                        <td>

                          <span
                            style={{
                              background:
                                "#f5f3ff",
                              color:
                                "#7c3aed",
                              padding:
                                "7px 11px",
                              borderRadius:
                                "8px",
                              fontSize:
                                "13px",
                              fontWeight:
                                "600",
                            }}
                          >

                            <FaRoute className="me-1" />

                            Trip #
                            {item.trip_id}

                          </span>

                        </td>


                        {/* ASSIGNED DATE */}

                        <td>

                          <div
                            style={{
                              color:
                                "#64748b",
                              fontSize:
                                "13px",
                            }}
                          >

                            <FaClock className="me-1" />

                            {item.assigned_at ||
                              "-"}

                          </div>

                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            style={{
                              display:
                                "inline-flex",
                              alignItems:
                                "center",

                              background:
                                isCompleted
                                  ? "#dcfce7"
                                  : isActive
                                  ? "#dbeafe"
                                  : "#fef3c7",

                              color:
                                isCompleted
                                  ? "#15803d"
                                  : isActive
                                  ? "#1d4ed8"
                                  : "#b45309",

                              padding:
                                "6px 11px",

                              borderRadius:
                                "20px",

                              fontSize:
                                "12px",

                              fontWeight:
                                "700",
                            }}
                          >

                            <span
                              style={{
                                width:
                                  "6px",
                                height:
                                  "6px",
                                borderRadius:
                                  "50%",
                                background:
                                  "currentColor",
                                marginRight:
                                  "6px",
                              }}
                            />

                            {status}

                          </span>

                        </td>


                        {/* ACTIONS */}

                        <td>

                          <button
                            type="button"
                            className="btn btn-sm me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#editAssignmentModal"
                            onClick={() =>
                              openEditModal(
                                item
                              )
                            }
                            style={{
                              background:
                                "#fef3c7",
                              color:
                                "#b45309",
                              border:
                                "none",
                              borderRadius:
                                "8px",
                              fontWeight:
                                "600",
                            }}
                          >

                            <FaEdit className="me-1" />

                            Edit

                          </button>


                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() =>
                              deleteAssignment(
                                item.id
                              )
                            }
                            style={{
                              background:
                                "#fee2e2",
                              color:
                                "#dc2626",
                              border:
                                "none",
                              borderRadius:
                                "8px",
                              fontWeight:
                                "600",
                            }}
                          >

                            <FaTrash className="me-1" />

                            Delete

                          </button>

                        </td>

                      </tr>

                    );

                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* =====================================================
          DRIVER ATTENDANCE
      ===================================================== */}

      <div
        className="card border-0 mt-4"
        style={{
          borderRadius: "16px",
          boxShadow:
            "0 6px 22px rgba(15,23,42,0.08)",
          overflow: "hidden",
        }}
      >

        <div
          className="card-header border-0"
          style={{
            background: "white",
            padding: "20px 24px",
          }}
        >

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

            <div className="d-flex align-items-center">

              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#ecfdf5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "12px",
                }}
              >
                <FaUserClock />
              </div>

              <div>
                <h5
                  className="fw-bold mb-0"
                  style={{ color: "#172033" }}
                >
                  Driver Attendance
                </h5>

                <small className="text-muted">
                  Monitor daily driver attendance and working hours
                </small>
              </div>

            </div>

            <button
              type="button"
              className="btn"
              data-bs-toggle="modal"
              data-bs-target="#attendanceModal"
              onClick={() => {
                setEditAttendanceId(null);
                setAttendanceForm({
                  driver_id: "",
                  date: attendanceDate,
                  attendance_status: "Present",
                  check_in_time: "",
                  check_out_time: "",
                });
              }}
              style={{
                background: "#059669",
                color: "white",
                borderRadius: "10px",
                padding: "10px 16px",
                fontWeight: "600",
              }}
            >
              <FaPlus className="me-2" />
              Mark Attendance
            </button>

          </div>

        </div>


        {/* ATTENDANCE SUMMARY */}

        <div className="px-4 pb-3">

          <div className="row g-3">

            <div className="col-xl-3 col-md-6">
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #dcfce7",
                  borderRadius: "12px",
                  padding: "14px 16px",
                }}
              >
                <small className="text-muted">PRESENT</small>
                <div
                  className="fw-bold"
                  style={{
                    color: "#15803d",
                    fontSize: "22px",
                  }}
                >
                  {attendancePresent}
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6">
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fee2e2",
                  borderRadius: "12px",
                  padding: "14px 16px",
                }}
              >
                <small className="text-muted">ABSENT</small>
                <div
                  className="fw-bold"
                  style={{
                    color: "#dc2626",
                    fontSize: "22px",
                  }}
                >
                  {attendanceAbsent}
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6">
              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fef3c7",
                  borderRadius: "12px",
                  padding: "14px 16px",
                }}
              >
                <small className="text-muted">LATE</small>
                <div
                  className="fw-bold"
                  style={{
                    color: "#b45309",
                    fontSize: "22px",
                  }}
                >
                  {attendanceLate}
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6">
              <div
                style={{
                  background: "#f5f3ff",
                  border: "1px solid #ede9fe",
                  borderRadius: "12px",
                  padding: "14px 16px",
                }}
              >
                <small className="text-muted">LEAVE</small>
                <div
                  className="fw-bold"
                  style={{
                    color: "#7c3aed",
                    fontSize: "22px",
                  }}
                >
                  {attendanceLeave}
                </div>
              </div>
            </div>

          </div>

        </div>


        {/* FILTERS */}

        <div className="px-4 pb-3">

          <div className="row g-3">

            <div className="col-lg-4">

              <label
                className="form-label mb-1"
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#64748b",
                }}
              >
                ATTENDANCE DATE
              </label>

              <div style={{ position: "relative" }}>

                <FaCalendarAlt
                  style={{
                    position: "absolute",
                    left: "13px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />

                <input
                  type="date"
                  className="form-control"
                  value={attendanceDate}
                  onChange={(event) =>
                    setAttendanceDate(
                      event.target.value
                    )
                  }
                  style={{
                    height: "44px",
                    paddingLeft: "38px",
                    borderRadius: "9px",
                  }}
                />

              </div>

            </div>

            <div className="col-lg-8">

              <label
                className="form-label mb-1"
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#64748b",
                }}
              >
                SEARCH DRIVER
              </label>

              <div style={{ position: "relative" }}>

                <FaSearch
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />

                <input
                  type="text"
                  className="form-control"
                  placeholder="Search driver or attendance status..."
                  value={attendanceSearch}
                  onChange={(event) =>
                    setAttendanceSearch(
                      event.target.value
                    )
                  }
                  style={{
                    height: "44px",
                    paddingLeft: "40px",
                    borderRadius: "9px",
                  }}
                />

              </div>

            </div>

          </div>

        </div>


        {/* ATTENDANCE TABLE */}

        <div className="table-responsive">

          <table className="table align-middle mb-0">

            <thead style={{ background: "#f8fafc" }}>

              <tr>

                <th style={{ padding: "14px 20px" }}>
                  Driver
                </th>

                <th>Date</th>

                <th>Check In</th>

                <th>Check Out</th>

                <th>Status</th>

                <th>Actions</th>

              </tr>

            </thead>

            <tbody>

              {filteredAttendance.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="text-center py-5"
                  >

                    <FaUserClock
                      style={{
                        fontSize: "38px",
                        color: "#cbd5e1",
                      }}
                    />

                    <h6
                      className="mt-3"
                      style={{ color: "#64748b" }}
                    >
                      No attendance records
                    </h6>

                    <small className="text-muted">
                      No attendance has been recorded for the selected date.
                    </small>

                  </td>

                </tr>

              ) : (

                filteredAttendance.map(
                  (record) => {

                    const statusStyle =
                      getAttendanceStyle(
                        record.attendance_status
                      );

                    return (

                      <tr key={record.id}>

                        <td style={{ padding: "15px 20px" }}>

                          <div className="d-flex align-items-center">

                            <div
                              style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "50%",
                                background: "#ecfdf5",
                                color: "#059669",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: "10px",
                              }}
                            >
                              <FaUserTie />
                            </div>

                            <div>

                              <div
                                style={{
                                  fontWeight: "700",
                                  color: "#172033",
                                }}
                              >
                                {getDriverName(
                                  record.driver_id
                                )}
                              </div>

                              <small className="text-muted">
                                Driver ID #{record.driver_id}
                              </small>

                            </div>

                          </div>

                        </td>

                        <td>
                          <span
                            style={{
                              fontWeight: "600",
                              color: "#475569",
                            }}
                          >
                            {record.date || "-"}
                          </span>
                        </td>

                        <td>
                          {record.check_in_time ? (
                            <span
                              style={{
                                color: "#15803d",
                                fontWeight: "600",
                              }}
                            >
                              {String(
                                record.check_in_time
                              ).slice(0, 5)}
                            </span>
                          ) : (
                            <span className="text-muted">
                              —
                            </span>
                          )}
                        </td>

                        <td>
                          {record.check_out_time ? (
                            <span
                              style={{
                                color: "#475569",
                                fontWeight: "600",
                              }}
                            >
                              {String(
                                record.check_out_time
                              ).slice(0, 5)}
                            </span>
                          ) : (
                            <span className="text-muted">
                              —
                            </span>
                          )}
                        </td>

                        <td>

                          <span
                            style={{
                              ...statusStyle,
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "6px 11px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: "700",
                            }}
                          >

                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "currentColor",
                                marginRight: "6px",
                              }}
                            />

                            {record.attendance_status ||
                              "Unknown"}

                          </span>

                        </td>

                        <td>

                          <button
                            type="button"
                            className="btn btn-sm me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#attendanceEditModal"
                            onClick={() =>
                              openAttendanceEdit(
                                record
                              )
                            }
                            style={{
                              background: "#fef3c7",
                              color: "#b45309",
                              border: "none",
                              borderRadius: "8px",
                              fontWeight: "600",
                            }}
                          >
                            <FaEdit className="me-1" />
                            Edit
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() =>
                              deleteAttendance(
                                record.id
                              )
                            }
                            style={{
                              background: "#fee2e2",
                              color: "#dc2626",
                              border: "none",
                              borderRadius: "8px",
                              fontWeight: "600",
                            }}
                          >
                            <FaTrash className="me-1" />
                            Delete
                          </button>

                        </td>

                      </tr>

                    );

                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* =====================================================
          ADD ATTENDANCE MODAL
      ===================================================== */}

      <div
        className="modal fade"
        id="attendanceModal"
        tabIndex="-1"
        aria-hidden="true"
      >

        <div className="modal-dialog">

          <div
            className="modal-content border-0"
            style={{
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >

            <div
              className="modal-header"
              style={{
                background: "#059669",
                color: "white",
              }}
            >

              <h5 className="modal-title fw-bold">
                <FaUserClock className="me-2" />
                Mark Driver Attendance
              </h5>

              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              />

            </div>

            <form onSubmit={addAttendance}>

              <div className="modal-body p-4">

                <div className="mb-3">

                  <label className="form-label fw-semibold">
                    Driver
                  </label>

                  <select
                    className="form-select"
                    name="driver_id"
                    value={attendanceForm.driver_id}
                    onChange={handleAttendanceChange}
                    required
                  >

                    <option value="">
                      Select Driver
                    </option>

                    {drivers.map((driver) => (

                      <option
                        key={driver.id}
                        value={driver.id}
                      >
                        {driver.name}
                      </option>

                    ))}

                  </select>

                </div>

                <div className="mb-3">

                  <label className="form-label fw-semibold">
                    Date
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    name="date"
                    value={attendanceForm.date}
                    onChange={handleAttendanceChange}
                    required
                  />

                </div>

                <div className="mb-3">

                  <label className="form-label fw-semibold">
                    Attendance Status
                  </label>

                  <select
                    className="form-select"
                    name="attendance_status"
                    value={attendanceForm.attendance_status}
                    onChange={handleAttendanceChange}
                    required
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                    <option value="Leave">Leave</option>
                    <option value="Half Day">Half Day</option>
                  </select>

                </div>

                <div className="row g-3">

                  <div className="col-md-6">

                    <label className="form-label fw-semibold">
                      Check In
                    </label>

                    <input
                      type="time"
                      className="form-control"
                      name="check_in_time"
                      value={attendanceForm.check_in_time}
                      onChange={handleAttendanceChange}
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label fw-semibold">
                      Check Out
                    </label>

                    <input
                      type="time"
                      className="form-control"
                      name="check_out_time"
                      value={attendanceForm.check_out_time}
                      onChange={handleAttendanceChange}
                    />

                  </div>

                </div>

              </div>

              <div className="modal-footer">

                <button
                  id="closeAttendanceModal"
                  type="button"
                  className="btn btn-light"
                  data-bs-dismiss="modal"
                  disabled={attendanceSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn"
                  disabled={attendanceSaving}
                  style={{
                    background: "#059669",
                    color: "white",
                  }}
                >

                  {attendanceSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" />
                      Save Attendance
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      </div>


      {/* =====================================================
          EDIT ATTENDANCE MODAL
      ===================================================== */}

      <div
        className="modal fade"
        id="attendanceEditModal"
        tabIndex="-1"
        aria-hidden="true"
      >

        <div className="modal-dialog">

          <div
            className="modal-content border-0"
            style={{
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >

            <div
              className="modal-header"
              style={{
                background: "#2563eb",
                color: "white",
              }}
            >

              <h5 className="modal-title fw-bold">
                <FaEdit className="me-2" />
                Edit Driver Attendance
              </h5>

              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              />

            </div>

            <form onSubmit={updateAttendance}>

              <div className="modal-body p-4">

                <div className="mb-3">

                  <label className="form-label fw-semibold">
                    Driver
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={
                      editAttendanceId
                        ? getDriverName(
                            attendanceForm.driver_id
                          )
                        : ""
                    }
                    disabled
                  />

                </div>

                <div className="mb-3">

                  <label className="form-label fw-semibold">
                    Date
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    value={attendanceForm.date}
                    disabled
                  />

                </div>

                <div className="mb-3">

                  <label className="form-label fw-semibold">
                    Attendance Status
                  </label>

                  <select
                    className="form-select"
                    name="attendance_status"
                    value={attendanceForm.attendance_status}
                    onChange={handleAttendanceChange}
                    required
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                    <option value="Leave">Leave</option>
                    <option value="Half Day">Half Day</option>
                  </select>

                </div>

                <div className="row g-3">

                  <div className="col-md-6">

                    <label className="form-label fw-semibold">
                      Check In
                    </label>

                    <input
                      type="time"
                      className="form-control"
                      name="check_in_time"
                      value={attendanceForm.check_in_time}
                      onChange={handleAttendanceChange}
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label fw-semibold">
                      Check Out
                    </label>

                    <input
                      type="time"
                      className="form-control"
                      name="check_out_time"
                      value={attendanceForm.check_out_time}
                      onChange={handleAttendanceChange}
                    />

                  </div>

                </div>

              </div>

              <div className="modal-footer">

                <button
                  id="closeAttendanceEditModal"
                  type="button"
                  className="btn btn-light"
                  data-bs-dismiss="modal"
                  disabled={attendanceSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={attendanceSaving}
                >

                  {attendanceSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaEdit className="me-2" />
                      Update Attendance
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      </div>


      {/* =====================================================
          ADD ASSIGNMENT MODAL
      ===================================================== */}

      <div
        className="modal fade"
        id="addAssignmentModal"
        tabIndex="-1"
        aria-hidden="true"
      >

        <div className="modal-dialog">

          <div
            className="modal-content border-0"
            style={{
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >


            {/* HEADER */}

            <div
              className="modal-header"
              style={{
                background: "#2563eb",
                color: "white",
              }}
            >

              <h5
                className="modal-title fw-bold"
              >

                <FaUserCheck className="me-2" />

                Assign Driver

              </h5>


              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              />

            </div>


            {/* FORM */}

            <form
              onSubmit={
                addAssignment
              }
            >

              <div
                className="modal-body p-4"
              >


                {/* DRIVER */}

                <div className="mb-3">

                  <label
                    className="form-label fw-semibold"
                  >
                    Driver
                  </label>


                  <select
                    className="form-select"
                    name="driver_id"
                    value={
                      assignment.driver_id
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select Driver
                    </option>


                    {drivers.map(
                      (driver) => (

                        <option
                          key={
                            driver.id
                          }
                          value={
                            driver.id
                          }
                        >
                          {driver.name}
                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* VEHICLE */}

                <div className="mb-3">

                  <label
                    className="form-label fw-semibold"
                  >
                    Vehicle
                  </label>


                  <select
                    className="form-select"
                    name="vehicle_id"
                    value={
                      assignment.vehicle_id
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select Vehicle
                    </option>


                    {vehicles.map(
                      (vehicle) => (

                        <option
                          key={
                            vehicle.id
                          }
                          value={
                            vehicle.id
                          }
                        >
                          {getVehicleNumber(
                            vehicle.id
                          )}
                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* TRIP */}

                <div className="mb-3">

                  <label
                    className="form-label fw-semibold"
                  >
                    Trip
                  </label>


                  <select
                    className="form-select"
                    name="trip_id"
                    value={
                      assignment.trip_id
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select Trip
                    </option>


                    {trips.map(
                      (trip) => (

                        <option
                          key={
                            trip.id
                          }
                          value={
                            trip.id
                          }
                        >
                          Trip #{trip.id}
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>


              {/* FOOTER */}

              <div className="modal-footer">

                <button
                  id="closeAddAssignmentModal"
                  type="button"
                  className="btn btn-light"
                  data-bs-dismiss="modal"
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >

                  {saving ? (

                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                      />

                      Assigning...

                    </>

                  ) : (

                    <>
                      <FaUserCheck className="me-2" />

                      Assign Driver
                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      </div>


      {/* =====================================================
          EDIT ASSIGNMENT MODAL
      ===================================================== */}

      <div
        className="modal fade"
        id="editAssignmentModal"
        tabIndex="-1"
        aria-hidden="true"
      >

        <div className="modal-dialog">

          <div
            className="modal-content border-0"
            style={{
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >


            {/* HEADER */}

            <div
              className="modal-header"
              style={{
                background: "#2563eb",
                color: "white",
              }}
            >

              <h5
                className="modal-title fw-bold"
              >

                <FaEdit className="me-2" />

                Edit Assignment

              </h5>


              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              />

            </div>


            {/* FORM */}

            <form
              onSubmit={
                updateAssignment
              }
            >

              <div
                className="modal-body p-4"
              >


                {/* DRIVER */}

                <div className="mb-3">

                  <label
                    className="form-label fw-semibold"
                  >
                    Driver
                  </label>


                  <select
                    className="form-select"
                    name="driver_id"
                    value={
                      editAssignment.driver_id
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                  >

                    <option value="">
                      Select Driver
                    </option>


                    {drivers.map(
                      (driver) => (

                        <option
                          key={
                            driver.id
                          }
                          value={
                            driver.id
                          }
                        >
                          {driver.name}
                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* VEHICLE */}

                <div className="mb-3">

                  <label
                    className="form-label fw-semibold"
                  >
                    Vehicle
                  </label>


                  <select
                    className="form-select"
                    name="vehicle_id"
                    value={
                      editAssignment.vehicle_id
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                  >

                    <option value="">
                      Select Vehicle
                    </option>


                    {vehicles.map(
                      (vehicle) => (

                        <option
                          key={
                            vehicle.id
                          }
                          value={
                            vehicle.id
                          }
                        >
                          {getVehicleNumber(
                            vehicle.id
                          )}
                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* TRIP */}

                <div className="mb-3">

                  <label
                    className="form-label fw-semibold"
                  >
                    Trip
                  </label>


                  <select
                    className="form-select"
                    name="trip_id"
                    value={
                      editAssignment.trip_id
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                  >

                    <option value="">
                      Select Trip
                    </option>


                    {trips.map(
                      (trip) => (

                        <option
                          key={
                            trip.id
                          }
                          value={
                            trip.id
                          }
                        >
                          Trip #{trip.id}
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>


              {/* FOOTER */}

              <div className="modal-footer">

                <button
                  id="closeEditAssignmentModal"
                  type="button"
                  className="btn btn-light"
                  data-bs-dismiss="modal"
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={saving}
                >

                  {saving ? (

                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                      />

                      Updating...

                    </>

                  ) : (

                    <>
                      <FaEdit className="me-2" />

                      Update Assignment
                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      </div>

    </div>

  );

}


export default DriverAssignment;