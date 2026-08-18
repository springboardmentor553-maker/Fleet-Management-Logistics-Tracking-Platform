import { useEffect, useState } from "react";

import api from "../api/api";
import { toast } from "react-toastify";

import {
  FaEdit,
  FaTrash,
  FaTools,
  FaPlus,
  FaSearch,
  FaCar,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaRupeeSign,
  FaBuilding,
} from "react-icons/fa";


function Maintenance() {

  // =====================================================
  // EMPTY FORM
  // =====================================================

  const emptyMaintenance = {
    vehicle_id: "",
    maintenance_category: "",
    service_date: "",
    next_service_date: "",
    service_cost: "",
    service_provider: "",
    maintenance_status: "",
    notes: "",
  };


  // =====================================================
  // STATES
  // =====================================================

  const [records, setRecords] =
    useState([]);

  const [alerts, setAlerts] =
    useState([]);

  const [vehicles, setVehicles] =
    useState([]);

  const [maintenance, setMaintenance] =
    useState(
      emptyMaintenance
    );

  const [editMaintenance, setEditMaintenance] =
    useState(
      emptyMaintenance
    );

  const [editId, setEditId] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [updating, setUpdating] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);


  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {

    loadAllData();

  }, []);


  const loadAllData = async () => {

    setLoading(true);

    await Promise.all([
      fetchMaintenance(),
      fetchVehicles(),
      fetchAlerts(),
    ]);

    setLoading(false);

  };


  // =====================================================
  // FETCH MAINTENANCE
  // =====================================================

  const fetchMaintenance = async () => {

    try {

      const res =
        await api.get(
          "/maintenance"
        );

      setRecords(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (err) {

      console.error(
        "Maintenance fetch error:",
        err
      );

      toast.error(
        "Failed to load maintenance records"
      );

    }

  };


  // =====================================================
  // FETCH VEHICLES
  // =====================================================

  const fetchVehicles = async () => {

    try {

      const res =
        await api.get(
          "/vehicles"
        );

      setVehicles(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (err) {

      console.error(
        "Vehicle fetch error:",
        err
      );

      toast.error(
        "Failed to load vehicles"
      );

    }

  };


  // =====================================================
  // FETCH ALERTS
  // =====================================================

  const fetchAlerts = async () => {

    try {

      const res =
        await api.get(
          "/maintenance-alerts"
        );

      setAlerts(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (err) {

      console.error(
        "Alert fetch error:",
        err
      );

      setAlerts([]);

    }

  };


  // =====================================================
  // HANDLE ADD FORM
  // =====================================================

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setMaintenance(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  };


  // =====================================================
  // HANDLE EDIT FORM
  // =====================================================

  const handleEditChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setEditMaintenance(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  };


  // =====================================================
  // ADD MAINTENANCE
  // =====================================================

  const addMaintenance = async (e) => {

    e.preventDefault();

    try {

      setSaving(true);

      await api.post(
        "/maintenance",
        {
          ...maintenance,

          vehicle_id:
            Number(
              maintenance.vehicle_id
            ),

          service_cost:
            Number(
              maintenance.service_cost
            ),
        }
      );


      toast.success(
        "Maintenance Added Successfully"
      );


      setMaintenance(
        emptyMaintenance
      );


      await fetchMaintenance();
      await fetchAlerts();


      document
        .getElementById(
          "closeAddMaintenance"
        )
        ?.click();

    } catch (err) {

      console.error(
        "Add maintenance error:",
        err
      );

      toast.error(
        err.response?.data?.detail ||
        "Failed to Add Maintenance"
      );

    } finally {

      setSaving(false);

    }

  };


  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const openEditModal = (item) => {

    setEditMaintenance({

      vehicle_id:
        item.vehicle_id ??
        "",

      maintenance_category:
        item.maintenance_category ??
        "",

      service_date:
        item.service_date ??
        "",

      next_service_date:
        item.next_service_date ??
        "",

      service_cost:
        item.service_cost ??
        "",

      service_provider:
        item.service_provider ??
        "",

      maintenance_status:
        item.maintenance_status ??
        "",

      notes:
        item.notes ??
        "",
    });


    setEditId(
      item.id
    );

  };


  // =====================================================
  // UPDATE MAINTENANCE
  // =====================================================

  const updateMaintenance = async (e) => {

    e.preventDefault();

    if (!editId) {

      toast.error(
        "Maintenance record ID is missing."
      );

      return;

    }


    try {

      setUpdating(true);

      await api.put(
        `/maintenance/${editId}`,
        {
          ...editMaintenance,

          vehicle_id:
            Number(
              editMaintenance.vehicle_id
            ),

          service_cost:
            Number(
              editMaintenance.service_cost
            ),
        }
      );


      toast.success(
        "Maintenance Updated Successfully"
      );


      await fetchMaintenance();
      await fetchAlerts();


      document
        .getElementById(
          "closeEditMaintenance"
        )
        ?.click();

    } catch (err) {

      console.error(
        "Update maintenance error:",
        err
      );

      toast.error(
        err.response?.data?.detail ||
        "Update Failed"
      );

    } finally {

      setUpdating(false);

    }

  };


  // =====================================================
  // DELETE
  // =====================================================

  const deleteMaintenance = async (
    id
  ) => {

    if (
      !window.confirm(
        "Delete this Maintenance Record?"
      )
    ) {

      return;

    }


    try {

      setDeletingId(id);

      await api.delete(
        `/maintenance/${id}`
      );


      toast.success(
        "Maintenance Deleted"
      );


      await fetchMaintenance();
      await fetchAlerts();

    } catch (err) {

      console.error(
        "Delete maintenance error:",
        err
      );

      toast.error(
        err.response?.data?.detail ||
        "Delete Failed"
      );

    } finally {

      setDeletingId(null);

    }

  };


  // =====================================================
  // STATUS COUNTS
  // =====================================================

  const pendingCount =
    records.filter(
      (m) =>
        m.maintenance_status ===
        "Pending"
    ).length;


  const progressCount =
    records.filter(
      (m) =>
        m.maintenance_status ===
        "In Progress"
    ).length;


  const completedCount =
    records.filter(
      (m) =>
        m.maintenance_status ===
        "Completed"
    ).length;


  // =====================================================
  // SEARCH
  // =====================================================

  const filteredRecords =
    records.filter(
      (m) => {

        const vehicle =
          vehicles.find(
            (v) =>
              Number(v.id) ===
              Number(m.vehicle_id)
          );


        const vehicleNumber =
          vehicle?.vehicle_number ||
          "";


        const searchText =
          `${vehicleNumber}
          ${m.maintenance_category || ""}
          ${m.service_provider || ""}
          ${m.maintenance_status || ""}`
            .toLowerCase();


        return searchText.includes(
          search
            .toLowerCase()
            .trim()
        );

      }
    );


  // =====================================================
  // STATUS STYLE
  // =====================================================

  const getStatusStyle = (
    status
  ) => {

    switch (status) {

      case "Completed":

        return {
          background:
            "#dcfce7",

          color:
            "#15803d",

          dot:
            "#22c55e",
        };


      case "In Progress":

        return {
          background:
            "#ede9fe",

          color:
            "#7c3aed",

          dot:
            "#8b5cf6",
        };


      case "Scheduled":

        return {
          background:
            "#dbeafe",

          color:
            "#1d4ed8",

          dot:
            "#3b82f6",
        };


      case "Pending":
      default:

        return {
          background:
            "#fef3c7",

          color:
            "#b45309",

          dot:
            "#f59e0b",
        };

    }

  };


  // =====================================================
  // MAIN UI
  // =====================================================

  // =====================================================
// ALERT PRIORITY
// =====================================================

const getAlertPriority = (alert) => {
  const status = String(
    alert.alert_status || ""
  ).toLowerCase();

  const message = String(
    alert.alert_message || ""
  ).toLowerCase();

  if (
    status === "resolved" ||
    status === "completed"
  ) {
    return {
      label: "Resolved",
      color: "#16a34a",
      background: "#dcfce7",
      border: "#22c55e",
      icon: <FaCheckCircle />,
    };
  }

  if (
    message.includes("overdue") ||
    message.includes("over due")
  ) {
    return {
      label: "Critical",
      color: "#dc2626",
      background: "#fee2e2",
      border: "#ef4444",
      icon: <FaExclamationTriangle />,
    };
  }

  return {
    label: "Upcoming",
    color: "#d97706",
    background: "#fef3c7",
    border: "#f59e0b",
    icon: <FaClock />,
  };
};


// =====================================================
// GET VEHICLE NUMBER
// =====================================================

const getVehicleNumber = (vehicleId) => {
  const vehicle = vehicles.find(
    (v) =>
      Number(v.id) === Number(vehicleId)
  );

  return (
    vehicle?.vehicle_number ||
    vehicle?.license_plate ||
    `Vehicle ${vehicleId}`
  );
};


  return (

    <main
      className="maintenance-page"
      style={{
        minHeight:
          "100vh",

        background:
          "#f4f7fb",
      }}
    >

      <div
        className="container-fluid"
        style={{
          padding:
            "30px",
        }}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="d-flex justify-content-between align-items-center mb-4"
        >

          <div>

            <h2
              className="fw-bold mb-1"
              style={{
                color:
                  "#172033",

                fontSize:
                  "30px",
              }}
            >

              <FaTools
                className="me-2"
                style={{
                  color:
                    "#2563eb",
                }}
              />

              Maintenance Management

            </h2>


            <p
              className="text-muted mb-0"
            >
              Monitor vehicle maintenance,
              service schedules and alerts.
            </p>

          </div>


          <button
            type="button"
            className="btn"
            data-bs-toggle="modal"
            data-bs-target="#addMaintenanceModal"
            style={{
              background:
                "#2563eb",

              color:
                "white",

              borderRadius:
                "10px",

              padding:
                "11px 20px",

              fontWeight:
                "600",

              boxShadow:
                "0 5px 15px rgba(37,99,235,0.25)",
            }}
          >

            <FaPlus
              className="me-2"
            />

            Add Maintenance

          </button>

        </div>


        {/* =================================================
            STATISTICS
        ================================================= */}

        <div
          className="row g-4 mb-4"
        >

          {/* TOTAL */}

          <div
            className="col-lg-3 col-md-6"
          >

            <div
              className="card border-0 h-100"
              style={{
                borderRadius:
                  "16px",

                boxShadow:
                  "0 6px 20px rgba(15,23,42,0.08)",
              }}
            >

              <div
                className="card-body d-flex align-items-center"
              >

                <div
                  style={{
                    width:
                      "55px",

                    height:
                      "55px",

                    borderRadius:
                      "14px",

                    background:
                      "#eff6ff",

                    color:
                      "#2563eb",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    fontSize:
                      "23px",

                    marginRight:
                      "15px",
                  }}
                >

                  <FaTools />

                </div>


                <div>

                  <small
                    className="text-muted"
                  >
                    Total Records
                  </small>

                  <h3
                    className="fw-bold mb-0"
                  >
                    {records.length}
                  </h3>

                </div>

              </div>

            </div>

          </div>


          {/* PENDING */}

          <div
            className="col-lg-3 col-md-6"
          >

            <div
              className="card border-0 h-100"
              style={{
                borderRadius:
                  "16px",

                boxShadow:
                  "0 6px 20px rgba(15,23,42,0.08)",
              }}
            >

              <div
                className="card-body d-flex align-items-center"
              >

                <div
                  style={{
                    width:
                      "55px",

                    height:
                      "55px",

                    borderRadius:
                      "14px",

                    background:
                      "#fef3c7",

                    color:
                      "#d97706",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    fontSize:
                      "23px",

                    marginRight:
                      "15px",
                  }}
                >

                  <FaClock />

                </div>


                <div>

                  <small
                    className="text-muted"
                  >
                    Pending
                  </small>

                  <h3
                    className="fw-bold mb-0"
                  >
                    {pendingCount}
                  </h3>

                </div>

              </div>

            </div>

          </div>


          {/* IN PROGRESS */}

          <div
            className="col-lg-3 col-md-6"
          >

            <div
              className="card border-0 h-100"
              style={{
                borderRadius:
                  "16px",

                boxShadow:
                  "0 6px 20px rgba(15,23,42,0.08)",
              }}
            >

              <div
                className="card-body d-flex align-items-center"
              >

                <div
                  style={{
                    width:
                      "55px",

                    height:
                      "55px",

                    borderRadius:
                      "14px",

                    background:
                      "#ede9fe",

                    color:
                      "#7c3aed",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    fontSize:
                      "23px",

                    marginRight:
                      "15px",
                  }}
                >

                  <FaTools />

                </div>


                <div>

                  <small
                    className="text-muted"
                  >
                    In Progress
                  </small>

                  <h3
                    className="fw-bold mb-0"
                  >
                    {progressCount}
                  </h3>

                </div>

              </div>

            </div>

          </div>


          {/* COMPLETED */}

          <div
            className="col-lg-3 col-md-6"
          >

            <div
              className="card border-0 h-100"
              style={{
                borderRadius:
                  "16px",

                boxShadow:
                  "0 6px 20px rgba(15,23,42,0.08)",
              }}
            >

              <div
                className="card-body d-flex align-items-center"
              >

                <div
                  style={{
                    width:
                      "55px",

                    height:
                      "55px",

                    borderRadius:
                      "14px",

                    background:
                      "#dcfce7",

                    color:
                      "#16a34a",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    fontSize:
                      "23px",

                    marginRight:
                      "15px",
                  }}
                >

                  <FaCheckCircle />

                </div>


                <div>

                  <small
                    className="text-muted"
                  >
                    Completed
                  </small>

                  <h3
                    className="fw-bold mb-0"
                  >
                    {completedCount}
                  </h3>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
    PROFESSIONAL ALERT SECTION
================================================= */}

<div className="mb-4">

  {/* ALERT HEADER */}

  <div
    className="d-flex justify-content-between align-items-center mb-3"
  >

    <div>

      <div className="d-flex align-items-center gap-2">

        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "#fee2e2",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
          }}
        >
          <FaExclamationTriangle />
        </div>

        <div>

          <h4
            className="fw-bold mb-0"
            style={{
              color: "#172033",
            }}
          >
            Maintenance Alerts
          </h4>

          <small className="text-muted">
            Vehicles requiring immediate or upcoming attention
          </small>

        </div>

      </div>

    </div>


    {/* ALERT COUNT */}

    <div
      style={{
        background:
          alerts.length > 0
            ? "#fee2e2"
            : "#dcfce7",

        color:
          alerts.length > 0
            ? "#dc2626"
            : "#15803d",

        padding: "8px 16px",

        borderRadius: "20px",

        fontSize: "13px",

        fontWeight: "700",

        display: "flex",

        alignItems: "center",

        gap: "7px",
      }}
    >

      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background:
            alerts.length > 0
              ? "#ef4444"
              : "#22c55e",
        }}
      />

      {alerts.length} Alerts

    </div>

  </div>


  {/* NO ALERTS */}

  {alerts.length === 0 ? (

    <div
      className="card border-0"
      style={{
        borderRadius: "16px",
        boxShadow:
          "0 6px 22px rgba(15,23,42,0.07)",
      }}
    >

      <div
        className="card-body text-center py-5"
      >

        <div
          style={{
            width: "65px",
            height: "65px",
            borderRadius: "50%",
            background: "#dcfce7",
            color: "#16a34a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            fontSize: "28px",
          }}
        >
          <FaCheckCircle />
        </div>

        <h5 className="fw-bold mt-3 mb-1">
          Fleet is Up to Date
        </h5>

        <p className="text-muted mb-0">
          No vehicles currently require maintenance attention.
        </p>

      </div>

    </div>

  ) : (

    <div className="row g-3">

      {alerts.map((alert) => {

        const vehicleNumber =
          getVehicleNumber(
            alert.vehicle_id
          );

        const priority =
          getAlertPriority(alert);


        return (

          <div
            className="col-xl-4 col-lg-6"
            key={alert.id}
          >

            <div
              className="card border-0 h-100"
              style={{
                borderRadius: "16px",

                borderLeft:
                  `5px solid ${priority.border}`,

                boxShadow:
                  "0 6px 22px rgba(15,23,42,0.08)",

                transition:
                  "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >

              <div className="card-body p-4">


                {/* TOP ROW */}

                <div
                  className="d-flex justify-content-between align-items-start mb-3"
                >

                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "13px",
                      background:
                        priority.background,
                      color:
                        priority.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    {priority.icon}
                  </div>


                  <span
                    style={{
                      background:
                        priority.background,

                      color:
                        priority.color,

                      padding:
                        "6px 11px",

                      borderRadius:
                        "20px",

                      fontSize:
                        "11px",

                      fontWeight:
                        "700",

                      textTransform:
                        "uppercase",

                      letterSpacing:
                        "0.3px",
                    }}
                  >
                    {priority.label}
                  </span>

                </div>


                {/* ALERT TITLE */}

                <h5
                  className="fw-bold mb-1"
                  style={{
                    color: "#172033",
                  }}
                >
                  {alert.alert_type ||
                    "Maintenance Required"}
                </h5>


                {/* VEHICLE NUMBER */}

                <div
                  className="d-flex align-items-center gap-2 mb-3"
                  style={{
                    color: "#2563eb",
                    fontWeight: "700",
                    fontSize: "14px",
                  }}
                >

                  <FaCar />

                  {vehicleNumber}

                </div>


                {/* MESSAGE */}

                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: "10px",
                    padding: "12px",
                    marginBottom: "15px",
                    color: "#475569",
                    fontSize: "13px",
                    lineHeight: "1.5",
                  }}
                >

                  {alert.alert_message ||
                    `${vehicleNumber} requires maintenance attention.`}

                </div>


                {/* NEXT SERVICE */}

                <div
                  className="d-flex align-items-center justify-content-between"
                  style={{
                    borderTop:
                      "1px solid #e2e8f0",

                    paddingTop:
                      "13px",
                  }}
                >

                  <div>

                    <small
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "11px",
                        marginBottom: "3px",
                      }}
                    >
                      NEXT SERVICE
                    </small>

                    <div
                      className="d-flex align-items-center gap-2"
                      style={{
                        color: "#334155",
                        fontWeight: "600",
                        fontSize: "13px",
                      }}
                    >

                      <FaCalendarAlt
                        style={{
                          color:
                            priority.color,
                        }}
                      />

                      {alert.next_service_date ||
                        "Not scheduled"}

                    </div>

                  </div>


                  {/* STATUS */}

                  <div
                    style={{
                      textAlign: "right",
                    }}
                  >

                    <small
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "11px",
                        marginBottom: "3px",
                      }}
                    >
                      STATUS
                    </small>

                    <span
                      style={{
                        color:
                          priority.color,
                        fontWeight: "700",
                        fontSize: "12px",
                      }}
                    >
                      {alert.alert_status ||
                        "Pending"}
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        );

      })}

    </div>

  )}

</div>


        {/* =================================================
            SEARCH
        ================================================= */}

        <div
          className="card border-0 mb-4"
          style={{
            borderRadius:
              "15px",

            boxShadow:
              "0 5px 18px rgba(15,23,42,0.07)",
          }}
        >

          <div
            className="card-body"
          >

            <div
              className="position-relative"
              style={{
                maxWidth:
                  "520px",
              }}
            >

              <FaSearch
                style={{
                  position:
                    "absolute",

                  left:
                    "16px",

                  top:
                    "50%",

                  transform:
                    "translateY(-50%)",

                  color:
                    "#94a3b8",

                  zIndex:
                    2,
                }}
              />


              <input
                type="text"
                className="form-control"
                placeholder="Search vehicle, category, provider or status..."
                value={
                  search
                }
                onChange={
                  (e) =>
                    setSearch(
                      e.target.value
                    )
                }
                style={{
                  height:
                    "48px",

                  paddingLeft:
                    "45px",

                  borderRadius:
                    "10px",

                  border:
                    "1px solid #e2e8f0",
                }}
              />

            </div>

          </div>

        </div>


        {/* =================================================
            TABLE
        ================================================= */}

        <div
          className="card border-0"
          style={{
            borderRadius:
              "16px",

            overflow:
              "hidden",

            boxShadow:
              "0 6px 22px rgba(15,23,42,0.08)",
          }}
        >

          <div
            className="table-responsive"
          >

            <table
              className="table table-hover align-middle mb-0"
            >

              <thead
                style={{
                  background:
                    "#0f172a",

                  color:
                    "white",
                }}
              >

                <tr>

                  <th
                    style={{
                      padding:
                        "17px 20px",
                    }}
                  >
                    Maintenance
                  </th>

                  <th>
                    Vehicle
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Service Date
                  </th>

                  <th>
                    Next Service
                  </th>

                  <th>
                    Cost
                  </th>

                  <th>
                    Status
                  </th>

                  <th
                    className="text-center"
                  >
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan="8"
                      className="text-center py-5"
                    >

                      <div
                        className="spinner-border text-primary"
                        role="status"
                      />

                      <div
                        className="text-muted mt-2"
                      >
                        Loading maintenance
                        records...
                      </div>

                    </td>

                  </tr>

                ) : filteredRecords.length ===
                  0 ? (

                  <tr>

                    <td
                      colSpan="8"
                      className="text-center py-5"
                    >

                      <FaTools
                        style={{
                          fontSize:
                            "42px",

                          color:
                            "#cbd5e1",
                        }}
                      />


                      <div
                        className="text-muted mt-2"
                      >
                        No maintenance
                        records found.
                      </div>

                    </td>

                  </tr>

                ) : (

                  filteredRecords.map(
                    (m) => {

                      const vehicle =
                        vehicles.find(
                          (v) =>
                            Number(
                              v.id
                            ) ===
                            Number(
                              m.vehicle_id
                            )
                        );


                      const status =
                        getStatusStyle(
                          m.maintenance_status
                        );


                      return (

                        <tr
                          key={
                            m.id
                          }
                        >

                          {/* MAINTENANCE */}

                          <td
                            style={{
                              padding:
                                "16px 20px",
                            }}
                          >

                            <div
                              className="d-flex align-items-center"
                            >

                              <div
                                style={{
                                  width:
                                    "45px",

                                  height:
                                    "45px",

                                  borderRadius:
                                    "12px",

                                  background:
                                    "#eff6ff",

                                  color:
                                    "#2563eb",

                                  display:
                                    "flex",

                                  alignItems:
                                    "center",

                                  justifyContent:
                                    "center",

                                  fontSize:
                                    "19px",

                                  marginRight:
                                    "12px",
                                }}
                              >

                                <FaTools />

                              </div>


                              <div>

                                <div
                                  className="fw-bold"
                                  style={{
                                    color:
                                      "#172033",
                                  }}
                                >

                                  MAINT-
                                  {String(
                                    m.id
                                  ).padStart(
                                    3,
                                    "0"
                                  )}

                                </div>


                                <small
                                  className="text-muted"
                                >
                                  Record ID:{" "}
                                  {m.id}
                                </small>

                              </div>

                            </div>

                          </td>


                          {/* VEHICLE */}

                          <td>

                            <div
                              className="d-flex align-items-center"
                            >

                              <div
                                style={{
                                  width:
                                    "36px",

                                  height:
                                    "36px",

                                  borderRadius:
                                    "10px",

                                  background:
                                    "#f1f5f9",

                                  color:
                                    "#475569",

                                  display:
                                    "flex",

                                  alignItems:
                                    "center",

                                  justifyContent:
                                    "center",

                                  marginRight:
                                    "9px",
                                }}
                              >

                                <FaCar />

                              </div>


                              <span
                                className="fw-semibold"
                              >
                                {vehicle?.vehicle_number ||
                                  "N/A"}
                              </span>

                            </div>

                          </td>


                          {/* CATEGORY */}

                          <td>

                            <span
                              style={{
                                background:
                                  "#f1f5f9",

                                color:
                                  "#475569",

                                padding:
                                  "7px 11px",

                                borderRadius:
                                  "8px",

                                fontSize:
                                  "12px",

                                fontWeight:
                                  "600",
                              }}
                            >

                              {m.maintenance_category ||
                                "N/A"}

                            </span>

                          </td>


                          {/* SERVICE DATE */}

                          <td>

                            <div
                              className="d-flex align-items-center"
                            >

                              <FaCalendarAlt
                                className="me-2"
                                style={{
                                  color:
                                    "#64748b",
                                }}
                              />

                              {m.service_date ||
                                "N/A"}

                            </div>

                          </td>


                          {/* NEXT SERVICE */}

                          <td>

                            <div
                              className="d-flex align-items-center"
                              style={{
                                color:
                                  "#475569",
                              }}
                            >

                              <FaClock
                                className="me-2"
                                style={{
                                  color:
                                    "#f59e0b",
                                }}
                              />

                              {m.next_service_date ||
                                "N/A"}

                            </div>

                          </td>


                          {/* COST */}

                          <td>

                            <span
                              className="fw-bold"
                              style={{
                                color:
                                  "#15803d",
                              }}
                            >

                              <FaRupeeSign
                                style={{
                                  fontSize:
                                    "12px",
                                }}
                              />

                              {Number(
                                m.service_cost ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}

                            </span>

                          </td>


                          {/* STATUS */}

                          <td>

                            <span
                              style={{
                                display:
                                  "inline-flex",

                                alignItems:
                                  "center",

                                gap:
                                  "7px",

                                padding:
                                  "7px 12px",

                                borderRadius:
                                  "20px",

                                background:
                                  status.background,

                                color:
                                  status.color,

                                fontSize:
                                  "12px",

                                fontWeight:
                                  "700",

                                whiteSpace:
                                  "nowrap",
                              }}
                            >

                              <span
                                style={{
                                  width:
                                    "7px",

                                  height:
                                    "7px",

                                  borderRadius:
                                    "50%",

                                  background:
                                    status.dot,
                                }}
                              />

                              {m.maintenance_status ||
                                "N/A"}

                            </span>

                          </td>


                          {/* ACTIONS */}

                          <td
                            className="text-center"
                          >

                            <button
                              type="button"
                              className="btn btn-sm me-1"
                              data-bs-toggle="modal"
                              data-bs-target="#editMaintenanceModal"
                              onClick={() =>
                                openEditModal(
                                  m
                                )
                              }
                              style={{
                                background:
                                  "#fef3c7",

                                color:
                                  "#d97706",

                                border:
                                  "none",

                                borderRadius:
                                  "8px",

                                padding:
                                  "7px 10px",

                                fontWeight:
                                  "600",
                              }}
                            >

                              <FaEdit
                                className="me-1"
                              />

                              Edit

                            </button>


                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() =>
                                deleteMaintenance(
                                  m.id
                                )
                              }
                              disabled={
                                deletingId ===
                                m.id
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

                                padding:
                                  "7px 10px",

                                fontWeight:
                                  "600",

                                opacity:
                                  deletingId ===
                                  m.id
                                    ? 0.6
                                    : 1,
                              }}
                            >

                              <FaTrash
                                className="me-1"
                              />

                              {deletingId ===
                              m.id
                                ? "Deleting..."
                                : "Delete"}

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


        {/* =================================================
            ADD MAINTENANCE MODAL
        ================================================= */}

        <div
          className="modal fade"
          id="addMaintenanceModal"
          tabIndex="-1"
          aria-hidden="true"
        >

          <div
            className="modal-dialog modal-lg modal-dialog-scrollable"
          >

            <div
              className="modal-content border-0"
              style={{
                borderRadius:
                  "16px",

                overflow:
                  "hidden",
              }}
            >

              {/* HEADER */}

              <div
                className="modal-header"
                style={{
                  background:
                    "#2563eb",

                  color:
                    "white",
                }}
              >

                <h5
                  className="modal-title fw-bold"
                >

                  <FaPlus
                    className="me-2"
                  />

                  Add Maintenance Record

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
                  addMaintenance
                }
              >

                <div
                  className="modal-body p-4"
                >

                  <div
                    className="row"
                  >

                    {/* VEHICLE */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Vehicle
                      </label>


                      <select
                        className="form-select"
                        name="vehicle_id"
                        value={
                          maintenance.vehicle_id
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

                              {
                                vehicle.vehicle_number
                              }

                            </option>

                          )
                        )}

                      </select>

                    </div>


                    {/* CATEGORY */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Maintenance Category
                      </label>


                      <select
                        className="form-select"
                        name="maintenance_category"
                        value={
                          maintenance.maintenance_category
                        }
                        onChange={
                          handleChange
                        }
                        required
                      >

                        <option value="">
                          Select Category
                        </option>

                        <option value="Oil Change">
                          Oil Change
                        </option>

                        <option value="Brake Service">
                          Brake Service
                        </option>

                        <option value="Tyre Replacement">
                          Tyre Replacement
                        </option>

                        <option value="Engine Service">
                          Engine Service
                        </option>

                        <option value="General Inspection">
                          General Inspection
                        </option>

                      </select>

                    </div>


                    {/* SERVICE DATE */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Service Date
                      </label>


                      <input
                        type="date"
                        className="form-control"
                        name="service_date"
                        value={
                          maintenance.service_date
                        }
                        onChange={
                          handleChange
                        }
                        required
                      />

                    </div>


                    {/* NEXT SERVICE */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Next Service Date
                      </label>


                      <input
                        type="date"
                        className="form-control"
                        name="next_service_date"
                        value={
                          maintenance.next_service_date
                        }
                        onChange={
                          handleChange
                        }
                        required
                      />

                    </div>


                    {/* COST */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Service Cost
                      </label>


                      <div
                        className="input-group"
                      >

                        <span
                          className="input-group-text"
                        >
                          ₹
                        </span>


                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control"
                          name="service_cost"
                          value={
                            maintenance.service_cost
                          }
                          onChange={
                            handleChange
                          }
                          required
                        />

                      </div>

                    </div>


                    {/* PROVIDER */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Service Provider
                      </label>


                      <div
                        className="input-group"
                      >

                        <span
                          className="input-group-text"
                        >
                          <FaBuilding />
                        </span>


                        <input
                          type="text"
                          className="form-control"
                          name="service_provider"
                          value={
                            maintenance.service_provider
                          }
                          onChange={
                            handleChange
                          }
                          required
                        />

                      </div>

                    </div>


                    {/* STATUS */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Status
                      </label>


                      <select
                        className="form-select"
                        name="maintenance_status"
                        value={
                          maintenance.maintenance_status
                        }
                        onChange={
                          handleChange
                        }
                        required
                      >

                        <option value="">
                          Select Status
                        </option>

                        <option value="Pending">
                          Pending
                        </option>

                        <option value="Scheduled">
                          Scheduled
                        </option>

                        <option value="In Progress">
                          In Progress
                        </option>

                        <option value="Completed">
                          Completed
                        </option>

                      </select>

                    </div>


                    {/* NOTES */}

                    <div
                      className="col-md-12 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Notes
                      </label>


                      <textarea
                        rows="3"
                        className="form-control"
                        name="notes"
                        value={
                          maintenance.notes
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Add maintenance notes..."
                      />

                    </div>

                  </div>

                </div>


                {/* FOOTER */}

                <div
                  className="modal-footer"
                >

                  <button
                    id="closeAddMaintenance"
                    type="button"
                    className="btn btn-light"
                    data-bs-dismiss="modal"
                    disabled={
                      saving
                    }
                  >
                    Cancel
                  </button>


                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      saving
                    }
                  >

                    <FaPlus
                      className="me-2"
                    />

                    {saving
                      ? "Saving..."
                      : "Save Maintenance"}

                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>


        {/* =================================================
            EDIT MAINTENANCE MODAL
        ================================================= */}

        <div
          className="modal fade"
          id="editMaintenanceModal"
          tabIndex="-1"
          aria-hidden="true"
        >

          <div
            className="modal-dialog modal-lg modal-dialog-scrollable"
          >

            <div
              className="modal-content border-0"
              style={{
                borderRadius:
                  "16px",

                overflow:
                  "hidden",
              }}
            >

              {/* HEADER */}

              <div
                className="modal-header"
                style={{
                  background:
                    "#0f172a",

                  color:
                    "white",
                }}
              >

                <h5
                  className="modal-title fw-bold"
                >

                  <FaEdit
                    className="me-2"
                  />

                  Edit Maintenance Record

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
                  updateMaintenance
                }
              >

                <div
                  className="modal-body p-4"
                >

                  <div
                    className="row"
                  >

                    {/* VEHICLE */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Vehicle
                      </label>


                      <select
                        className="form-select"
                        name="vehicle_id"
                        value={
                          editMaintenance.vehicle_id ||
                          ""
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

                              {
                                vehicle.vehicle_number
                              }

                            </option>

                          )
                        )}

                      </select>

                    </div>


                    {/* CATEGORY */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Maintenance Category
                      </label>


                      <select
                        className="form-select"
                        name="maintenance_category"
                        value={
                          editMaintenance.maintenance_category ||
                          ""
                        }
                        onChange={
                          handleEditChange
                        }
                        required
                      >

                        <option value="">
                          Select Category
                        </option>

                        <option value="Oil Change">
                          Oil Change
                        </option>

                        <option value="Brake Service">
                          Brake Service
                        </option>

                        <option value="Tyre Replacement">
                          Tyre Replacement
                        </option>

                        <option value="Engine Service">
                          Engine Service
                        </option>

                        <option value="General Inspection">
                          General Inspection
                        </option>

                      </select>

                    </div>


                    {/* SERVICE DATE */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Service Date
                      </label>


                      <input
                        type="date"
                        className="form-control"
                        name="service_date"
                        value={
                          editMaintenance.service_date ||
                          ""
                        }
                        onChange={
                          handleEditChange
                        }
                        required
                      />

                    </div>


                    {/* NEXT SERVICE */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Next Service Date
                      </label>


                      <input
                        type="date"
                        className="form-control"
                        name="next_service_date"
                        value={
                          editMaintenance.next_service_date ||
                          ""
                        }
                        onChange={
                          handleEditChange
                        }
                        required
                      />

                    </div>


                    {/* COST */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Service Cost
                      </label>


                      <div
                        className="input-group"
                      >

                        <span
                          className="input-group-text"
                        >
                          ₹
                        </span>


                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control"
                          name="service_cost"
                          value={
                            editMaintenance.service_cost ||
                            ""
                          }
                          onChange={
                            handleEditChange
                          }
                          required
                        />

                      </div>

                    </div>


                    {/* PROVIDER */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Service Provider
                      </label>


                      <div
                        className="input-group"
                      >

                        <span
                          className="input-group-text"
                        >
                          <FaBuilding />
                        </span>


                        <input
                          type="text"
                          className="form-control"
                          name="service_provider"
                          value={
                            editMaintenance.service_provider ||
                            ""
                          }
                          onChange={
                            handleEditChange
                          }
                          required
                        />

                      </div>

                    </div>


                    {/* STATUS */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Status
                      </label>


                      <select
                        className="form-select"
                        name="maintenance_status"
                        value={
                          editMaintenance.maintenance_status ||
                          ""
                        }
                        onChange={
                          handleEditChange
                        }
                        required
                      >

                        <option value="">
                          Select Status
                        </option>

                        <option value="Pending">
                          Pending
                        </option>

                        <option value="Scheduled">
                          Scheduled
                        </option>

                        <option value="In Progress">
                          In Progress
                        </option>

                        <option value="Completed">
                          Completed
                        </option>

                      </select>

                    </div>


                    {/* NOTES */}

                    <div
                      className="col-md-12 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Notes
                      </label>


                      <textarea
                        rows="3"
                        className="form-control"
                        name="notes"
                        value={
                          editMaintenance.notes ||
                          ""
                        }
                        onChange={
                          handleEditChange
                        }
                        placeholder="Add maintenance notes..."
                      />

                    </div>

                  </div>

                </div>


                {/* FOOTER */}

                <div
                  className="modal-footer"
                >

                  <button
                    id="closeEditMaintenance"
                    type="button"
                    className="btn btn-light"
                    data-bs-dismiss="modal"
                    disabled={
                      updating
                    }
                  >
                    Cancel
                  </button>


                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={
                      updating
                    }
                  >

                    <FaEdit
                      className="me-2"
                    />

                    {updating
                      ? "Updating..."
                      : "Update Maintenance"}

                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}


export default Maintenance;