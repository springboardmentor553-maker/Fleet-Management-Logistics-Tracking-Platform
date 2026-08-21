import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";

import {
  FaTruckMoving,
  FaCalendarAlt,
  FaRoute,
  FaCheckCircle,
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaMapMarkerAlt,
  FaUserTie,
  FaTruck,
  FaLocationArrow,
} from "react-icons/fa";

function Trips() {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [shipments, setShipments] = useState([]);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] =
    useState(false);

  // =====================================================
  // EMPTY TRIP
  // =====================================================

  const emptyTrip = {
    shipment_id: "",
    driver_id: "",
    vehicle_id: "",

    pickup_location: "",
    destination: "",

    pickup_latitude: "",
    pickup_longitude: "",

    destination_latitude: "",
    destination_longitude: "",

    scheduled_start_time: "",
    scheduled_end_time: "",

    trip_status: "Scheduled",
  };

  const [newTrip, setNewTrip] =
    useState(emptyTrip);

  const [editTrip, setEditTrip] = useState({
    id: "",
    ...emptyTrip,
  });

  // =====================================================
  // LOAD ALL DATA
  // =====================================================

  useEffect(() => {
    loadTrips();
    loadDrivers();
    loadVehicles();
    loadShipments();
  }, []);

  // =====================================================
  // LOAD TRIPS
  // =====================================================

  const loadTrips = async () => {
    try {
      const response = await api.get("/trips");

      setTrips(response.data);
    } catch (error) {
      console.error(
        "Load Trips Error:",
        error
      );

      alert("Unable to load trips.");
    }
  };

  // =====================================================
  // LOAD DRIVERS
  // =====================================================

  const loadDrivers = async () => {
    try {
      const response =
        await api.get("/drivers");

      setDrivers(response.data);
    } catch (error) {
      console.error(
        "Load Drivers Error:",
        error
      );
    }
  };

  // =====================================================
  // LOAD VEHICLES
  // =====================================================

  const loadVehicles = async () => {
    try {
      const response =
        await api.get("/vehicles");

      setVehicles(response.data);
    } catch (error) {
      console.error(
        "Load Vehicles Error:",
        error
      );
    }
  };

  // =====================================================
  // LOAD SHIPMENTS
  // =====================================================

  const loadShipments = async () => {
    try {
      const response =
        await api.get("/shipments");

      setShipments(response.data);
    } catch (error) {
      console.error(
        "Load Shipments Error:",
        error
      );
    }
  };

  // =====================================================
  // DELETE TRIP
  // =====================================================

  const deleteTrip = async (id) => {
    const confirmed = window.confirm(
      "Delete this trip?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/trips/${id}`);

      alert(
        "Trip deleted successfully."
      );

      await loadTrips();
    } catch (error) {
      console.error(
        "Delete Trip Error:",
        error
      );

      const detail =
        error?.response?.data?.detail;

      if (detail) {
        alert(detail);
      } else {
        alert(
          "Unable to delete trip."
        );
      }
    }
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const openEditModal = async (id) => {
    try {
      const response =
        await api.get(`/trips/${id}`);

      const data = response.data;

      setEditTrip({
        id: data.id,

        shipment_id:
          data.shipment_id ?? "",

        driver_id:
          data.driver_id ?? "",

        vehicle_id:
          data.vehicle_id ?? "",

        pickup_location:
          data.pickup_location ?? "",

        destination:
          data.destination ?? "",

        pickup_latitude:
          data.pickup_latitude ?? "",

        pickup_longitude:
          data.pickup_longitude ?? "",

        destination_latitude:
          data.destination_latitude ?? "",

        destination_longitude:
          data.destination_longitude ?? "",

        scheduled_start_time:
          data.scheduled_start_time
            ? data.scheduled_start_time.slice(
                0,
                16
              )
            : "",

        scheduled_end_time:
          data.scheduled_end_time
            ? data.scheduled_end_time.slice(
                0,
                16
              )
            : "",

        trip_status:
          data.trip_status ||
          "Scheduled",
      });

      setShowModal(true);
    } catch (error) {
      console.error(
        "Open Edit Trip Error:",
        error
      );

      alert(
        "Unable to load trip."
      );
    }
  };

  // =====================================================
  // EDIT CHANGE
  // =====================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setEditTrip((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // CREATE CHANGE
  // =====================================================

  const handleCreateChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setNewTrip((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // UPDATE TRIP
  // =====================================================

  const updateTrip = async () => {
    if (!editTrip.id) {
      alert("Trip ID is missing.");
      return;
    }

    try {
      await api.put(
        `/trips/${editTrip.id}`,
        editTrip
      );

      alert(
        "Trip updated successfully."
      );

      setShowModal(false);

      await loadTrips();
    } catch (error) {
      console.error(
        "Update Trip Error:",
        error
      );

      console.log(
        "Backend Response:",
        error?.response?.data
      );

      const detail =
        error?.response?.data?.detail;

      if (detail) {
        alert(
          typeof detail === "string"
            ? detail
            : JSON.stringify(detail)
        );
      } else {
        alert(
          "Unable to update trip."
        );
      }
    }
  };

  // =====================================================
// CREATE TRIP
// =====================================================

const createTrip = async () => {
  // -----------------------------------------
  // BASIC VALIDATION
  // -----------------------------------------

  if (!newTrip.shipment_id) {
    alert("Please select a shipment.");
    return;
  }

  if (!newTrip.driver_id) {
    alert("Please select a driver.");
    return;
  }

  if (!newTrip.vehicle_id) {
    alert("Please select a vehicle.");
    return;
  }

  if (!newTrip.pickup_location.trim()) {
    alert("Please enter pickup location.");
    return;
  }

  if (!newTrip.destination.trim()) {
    alert("Please enter destination.");
    return;
  }

  if (!newTrip.scheduled_start_time) {
    alert("Please select scheduled start time.");
    return;
  }

  if (!newTrip.scheduled_end_time) {
    alert("Please select scheduled end time.");
    return;
  }

  // -----------------------------------------
  // CREATE PAYLOAD
  // -----------------------------------------

  const payload = {
    shipment_id: Number(newTrip.shipment_id),

    driver_id: Number(newTrip.driver_id),

    vehicle_id: Number(newTrip.vehicle_id),

    pickup_location:
      newTrip.pickup_location.trim(),

    destination:
      newTrip.destination.trim(),

    // IMPORTANT:
    // Backend schema expects STRING coordinates
    pickup_latitude:
      newTrip.pickup_latitude
        ? String(newTrip.pickup_latitude)
        : null,

    pickup_longitude:
      newTrip.pickup_longitude
        ? String(newTrip.pickup_longitude)
        : null,

    destination_latitude:
      newTrip.destination_latitude
        ? String(newTrip.destination_latitude)
        : null,

    destination_longitude:
      newTrip.destination_longitude
        ? String(newTrip.destination_longitude)
        : null,

    scheduled_start_time:
      newTrip.scheduled_start_time,

    scheduled_end_time:
      newTrip.scheduled_end_time,

    trip_status:
      newTrip.trip_status || "Scheduled",
  };

  // -----------------------------------------
  // DEBUG
  // -----------------------------------------

  console.log(
    "========== CREATE TRIP =========="
  );

  console.log(
    "Payload:",
    payload
  );

  // -----------------------------------------
  // API REQUEST
  // -----------------------------------------

  try {
    const response = await api.post(
      "/trips",
      payload
    );

    console.log(
      "Create Trip Response:",
      response.data
    );

    alert(
      "Trip Created Successfully!"
    );

    // Close modal
    setShowCreateModal(false);

    // Reset form
    setNewTrip({
      shipment_id: "",
      driver_id: "",
      vehicle_id: "",

      pickup_location: "",
      destination: "",

      pickup_latitude: "",
      pickup_longitude: "",

      destination_latitude: "",
      destination_longitude: "",

      scheduled_start_time: "",
      scheduled_end_time: "",

      trip_status: "Scheduled",
    });

    // Reload trips
    await loadTrips();

  } catch (error) {

    console.error(
      "========== CREATE TRIP ERROR =========="
    );

    console.error(
      error
    );

    console.error(
      "Backend Response:",
      error?.response?.data
    );

    // -----------------------------------------
    // SHOW FASTAPI VALIDATION ERROR
    // -----------------------------------------

    const detail =
      error?.response?.data?.detail;

    if (Array.isArray(detail)) {

      const messages =
        detail.map((item) => {

          const field =
            item.loc
              ? item.loc.join(" → ")
              : "field";

          return `${field}: ${item.msg}`;

        });

      alert(
        "Validation Error:\n\n" +
        messages.join("\n")
      );

    } else if (typeof detail === "string") {

      alert(detail);

    } else {

      alert(
        "Unable to create trip. Please check the form."
      );
    }
  }
};

  // =====================================================
  // STATISTICS
  // =====================================================

  const scheduledTrips =
    trips.filter(
      (trip) =>
        trip.trip_status ===
        "Scheduled"
    ).length;

  const startedTrips =
    trips.filter(
      (trip) =>
        trip.trip_status ===
        "Started"
    ).length;

  const transitTrips =
    trips.filter(
      (trip) =>
        trip.trip_status ===
        "In Transit"
    ).length;

  const completedTrips =
    trips.filter(
      (trip) =>
        trip.trip_status ===
        "Completed"
    ).length;

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredTrips =
    trips.filter((trip) => {
      const searchText =
        (
          (trip.driver_name || "") +
          " " +
          (trip.vehicle_number || "") +
          " " +
          (trip.pickup_location || "") +
          " " +
          (trip.destination || "") +
          " " +
          (trip.trip_status || "")
        ).toLowerCase();

      return searchText.includes(
        search.toLowerCase()
      );
    });

  // =====================================================
  // STATUS STYLE
  // =====================================================

  const getStatusStyle = (
    status
  ) => {
    switch (status) {
      case "Completed":
        return {
          background: "#dcfce7",
          color: "#15803d",
          dot: "#22c55e",
        };

      case "In Transit":
        return {
          background: "#fef3c7",
          color: "#b45309",
          dot: "#f59e0b",
        };

      case "Started":
        return {
          background: "#ede9fe",
          color: "#6d28d9",
          dot: "#8b5cf6",
        };

      case "Scheduled":
      default:
        return {
          background: "#dbeafe",
          color: "#2563eb",
          dot: "#3b82f6",
        };
    }
  };

  // =====================================================
  // PROGRESS
  // =====================================================

  const getProgress = (
    status
  ) => {
    switch (status) {
      case "Completed":
        return 100;

      case "In Transit":
        return 70;

      case "Started":
        return 40;

      case "Scheduled":
      default:
        return 10;
    }
  };

  // =====================================================
  // CLOSE EDIT MODAL
  // =====================================================

  const closeEditModal = () => {
    setShowModal(false);
  };

  // =====================================================
  // CLOSE CREATE MODAL
  // =====================================================

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="trips-page"
      style={{
        padding: "40px 44px",
      }}
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="d-flex justify-content-between align-items-center mb-4">

        <div>

          <h2
            className="fw-bold mb-1"
            style={{
              color: "#172033",
              fontSize: "30px",
            }}
          >
            Trips Management
          </h2>

          <p className="text-muted mb-0">
            Monitor and manage your fleet
            trips and routes.
          </p>

        </div>

        <button
          type="button"
          className="btn"
          onClick={() =>
            setShowCreateModal(true)
          }
          style={{
            background: "#2563eb",
            color: "white",
            borderRadius: "10px",
            padding:
              "11px 20px",
            fontWeight: "600",
            boxShadow:
              "0 5px 15px rgba(37,99,235,0.25)",
          }}
        >

          <FaPlus className="me-2" />

          Create Trip

        </button>

      </div>


      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="row g-4 mb-4">

        {/* TOTAL */}

        <div className="col-lg-3 col-md-6">

          <div
            className="card border-0 h-100"
            style={{
              borderRadius: "16px",
              boxShadow:
                "0 6px 20px rgba(15,23,42,0.08)",
            }}
          >

            <div className="card-body d-flex align-items-center">

              <div
                style={{
                  width: "55px",
                  height: "55px",
                  borderRadius: "14px",
                  background:
                    "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  fontSize: "24px",
                  marginRight: "15px",
                }}
              >
                <FaTruckMoving />
              </div>

              <div>

                <small className="text-muted">
                  Total Trips
                </small>

                <h3 className="fw-bold mb-0">
                  {trips.length}
                </h3>

              </div>

            </div>

          </div>

        </div>


        {/* SCHEDULED */}

        <div className="col-lg-3 col-md-6">

          <div
            className="card border-0 h-100"
            style={{
              borderRadius: "16px",
              boxShadow:
                "0 6px 20px rgba(15,23,42,0.08)",
            }}
          >

            <div className="card-body d-flex align-items-center">

              <div
                style={{
                  width: "55px",
                  height: "55px",
                  borderRadius: "14px",
                  background:
                    "#dbeafe",
                  color: "#2563eb",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  fontSize: "24px",
                  marginRight: "15px",
                }}
              >
                <FaCalendarAlt />
              </div>

              <div>

                <small className="text-muted">
                  Scheduled
                </small>

                <h3 className="fw-bold mb-0">
                  {scheduledTrips}
                </h3>

              </div>

            </div>

          </div>

        </div>


        {/* IN TRANSIT */}

        <div className="col-lg-3 col-md-6">

          <div
            className="card border-0 h-100"
            style={{
              borderRadius: "16px",
              boxShadow:
                "0 6px 20px rgba(15,23,42,0.08)",
            }}
          >

            <div className="card-body d-flex align-items-center">

              <div
                style={{
                  width: "55px",
                  height: "55px",
                  borderRadius: "14px",
                  background:
                    "#fff7ed",
                  color: "#f59e0b",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  fontSize: "24px",
                  marginRight: "15px",
                }}
              >
                <FaRoute />
              </div>

              <div>

                <small className="text-muted">
                  In Transit
                </small>

                <h3 className="fw-bold mb-0">
                  {transitTrips}
                </h3>

              </div>

            </div>

          </div>

        </div>


        {/* COMPLETED */}

        <div className="col-lg-3 col-md-6">

          <div
            className="card border-0 h-100"
            style={{
              borderRadius: "16px",
              boxShadow:
                "0 6px 20px rgba(15,23,42,0.08)",
            }}
          >

            <div className="card-body d-flex align-items-center">

              <div
                style={{
                  width: "55px",
                  height: "55px",
                  borderRadius: "14px",
                  background:
                    "#dcfce7",
                  color: "#10b981",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  fontSize: "24px",
                  marginRight: "15px",
                }}
              >
                <FaCheckCircle />
              </div>

              <div>

                <small className="text-muted">
                  Completed
                </small>

                <h3 className="fw-bold mb-0">
                  {completedTrips}
                </h3>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          SEARCH
      ================================================= */}

      <div
        className="card border-0 mb-4"
        style={{
          borderRadius: "15px",
          boxShadow:
            "0 5px 18px rgba(15,23,42,0.07)",
        }}
      >

        <div className="card-body">

          <div
            className="position-relative"
            style={{
              maxWidth: "500px",
            }}
          >

            <FaSearch
              style={{
                position:
                  "absolute",
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
              placeholder="Search driver, vehicle, route or status..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              style={{
                paddingLeft:
                  "45px",
                height: "48px",
                borderRadius:
                  "10px",
                border:
                  "1px solid #e2e8f0",
                boxShadow: "none",
              }}
            />

          </div>

        </div>

      </div>


      {/* =================================================
          TRIPS TABLE
      ================================================= */}

      <div
        className="card border-0"
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow:
            "0 6px 22px rgba(15,23,42,0.08)",
        }}
      >

        <div className="table-responsive">

          <table className="table table-hover align-middle mb-0">

            <thead
              style={{
                background:
                  "#0f172a",
                color: "white",
              }}
            >

              <tr>

                <th
                  style={{
                    padding:
                      "17px 20px",
                  }}
                >
                  Trip
                </th>

                <th>
                  Driver
                </th>

                <th>
                  Vehicle
                </th>

                <th>
                  Route
                </th>

                <th>
                  Progress
                </th>

                <th>
                  Status
                </th>

                <th className="text-center">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredTrips.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    className="text-center py-5 text-muted"
                  >

                    <FaTruckMoving
                      style={{
                        fontSize:
                          "42px",
                        color:
                          "#cbd5e1",
                        marginBottom:
                          "10px",
                      }}
                    />

                    <div>
                      No Trips Found
                    </div>

                  </td>

                </tr>

              ) : (

                filteredTrips.map(
                  (trip) => {

                    const status =
                      getStatusStyle(
                        trip.trip_status
                      );

                    const progress =
                      getProgress(
                        trip.trip_status
                      );

                    return (
                      <tr
                        key={trip.id}
                      >

                        {/* TRIP */}

                        <td
                          style={{
                            padding:
                              "16px 20px",
                          }}
                        >

                          <div className="d-flex align-items-center">

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
                              <FaTruckMoving />
                            </div>

                            <div>

                              <div
                                className="fw-bold"
                                style={{
                                  color:
                                    "#172033",
                                }}
                              >
                                TRIP-
                                {String(
                                  trip.id
                                ).padStart(
                                  3,
                                  "0"
                                )}
                              </div>

                              <small className="text-muted">
                                Trip ID:{" "}
                                {trip.id}
                              </small>

                            </div>

                          </div>

                        </td>


                        {/* DRIVER */}

                        <td>

                          <div className="d-flex align-items-center">

                            <div
                              style={{
                                width:
                                  "34px",
                                height:
                                  "34px",
                                borderRadius:
                                  "50%",
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
                                marginRight:
                                  "9px",
                              }}
                            >
                              <FaUserTie />
                            </div>

                            <span>
                              {trip.driver_name ||
                                trip.driver?.name ||
                                "Not Assigned"}
                            </span>

                          </div>

                        </td>


                        {/* VEHICLE */}

                        <td>

                          <div className="d-flex align-items-center">

                            <FaTruck
                              className="me-2"
                              style={{
                                color:
                                  "#2563eb",
                              }}
                            />
                            {trip.vehicle?.license_plate ||
                              trip.vehicle_number ||
                              "Not Assigned"}

                            

                          </div>

                        </td>


                        {/* ROUTE */}

                        <td>

                          <div
                            style={{
                              minWidth:
                                "190px",
                            }}
                          >

                            <div className="d-flex align-items-center">

                              <FaMapMarkerAlt
                                style={{
                                  color:
                                    "#10b981",
                                  marginRight:
                                    "7px",
                                }}
                              />

                              <span>
                                {
                                  trip.pickup_location
                                }
                              </span>

                            </div>

                            <div
                              style={{
                                borderLeft:
                                  "2px solid #dbe3ef",
                                marginLeft:
                                  "5px",
                                paddingLeft:
                                  "13px",
                                fontSize:
                                  "11px",
                                color:
                                  "#94a3b8",
                                marginTop:
                                  "3px",
                                marginBottom:
                                  "3px",
                              }}
                            >
                              ↓
                            </div>

                            <div className="d-flex align-items-center">

                              <FaMapMarkerAlt
                                style={{
                                  color:
                                    "#ef4444",
                                  marginRight:
                                    "7px",
                                }}
                              />

                              <span>
                                {
                                  trip.destination
                                }
                              </span>

                            </div>

                          </div>

                        </td>


                        {/* PROGRESS */}

                        <td>

                          <div
                            style={{
                              minWidth:
                                "130px",
                            }}
                          >

                            <div className="d-flex justify-content-between mb-1">

                              <small className="text-muted">
                                Progress
                              </small>

                              <small
                                className="fw-bold"
                                style={{
                                  color:
                                    status.color,
                                }}
                              >
                                {progress}%
                              </small>

                            </div>

                            <div
                              style={{
                                height:
                                  "7px",
                                background:
                                  "#e2e8f0",
                                borderRadius:
                                  "10px",
                                overflow:
                                  "hidden",
                              }}
                            >

                              <div
                                style={{
                                  width:
                                    `${progress}%`,
                                  height:
                                    "100%",
                                  background:
                                    status.dot,
                                  borderRadius:
                                    "10px",
                                  transition:
                                    "width 0.4s ease",
                                }}
                              />

                            </div>

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
                              gap: "7px",
                              padding:
                                "7px 12px",
                              borderRadius:
                                "20px",
                              fontSize:
                                "12px",
                              fontWeight:
                                "700",
                              background:
                                status.background,
                              color:
                                status.color,
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

                            {trip.trip_status}

                          </span>

                        </td>


                        {/* ACTIONS */}

                        <td className="text-center">

                          <button
                            type="button"
                            className="btn btn-sm me-1"
                            onClick={() =>
                              navigate(
                                `/tracking/${trip.id}`
                              )
                            }
                            style={{
                              background:
                                "#dcfce7",
                              color:
                                "#15803d",
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

                            <FaLocationArrow
                              className="me-1"
                              style={{
                                fontSize:
                                  "12px",
                              }}
                            />

                            Track

                          </button>


                          <button
                            type="button"
                            className="btn btn-sm me-1"
                            onClick={() =>
                              openEditModal(
                                trip.id
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

                            <FaEdit className="me-1" />

                            Edit

                          </button>


                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() =>
                              deleteTrip(
                                trip.id
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
                              padding:
                                "7px 10px",
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


      {/* =================================================
          EDIT TRIP MODAL
      ================================================= */}

      {showModal && (

        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor:
              "rgba(15,23,42,0.55)",
            zIndex: 1050,
          }}
          onClick={closeEditModal}
        >

          <div
            className="modal-dialog modal-lg modal-dialog-scrollable"
            onClick={(event) =>
              event.stopPropagation()
            }
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

                <h5 className="modal-title fw-bold">

                  <FaEdit className="me-2" />

                  Edit Trip

                </h5>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={
                    closeEditModal
                  }
                  aria-label="Close"
                />

              </div>


              {/* BODY */}

              <div className="modal-body p-4">

                <div className="row">

                  {/* SHIPMENT */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Shipment
                    </label>

                    <select
                      className="form-select"
                      name="shipment_id"
                      value={
                        editTrip.shipment_id ||
                        ""
                      }
                      onChange={
                        handleChange
                      }
                    >

                      <option value="">
                        Select Shipment
                      </option>

                      {shipments.map(
                        (shipment) => (

                          <option
                            key={
                              shipment.id
                            }
                            value={
                              shipment.id
                            }
                          >
                            {
                              shipment.tracking_number
                            }
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  {/* DRIVER */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Driver
                    </label>

                    <select
                      className="form-select"
                      name="driver_id"
                      value={
                        editTrip.driver_id ||
                        ""
                      }
                      onChange={
                        handleChange
                      }
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

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Vehicle
                    </label>

                    <select
                      className="form-select"
                      name="vehicle_id"
                      value={
                        editTrip.vehicle_id ||
                        ""
                      }
                      onChange={
                        handleChange
                      }
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


                  {/* STATUS */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Status
                    </label>

                    <select
                      className="form-select"
                      name="trip_status"
                      value={
                        editTrip.trip_status
                      }
                      onChange={
                        handleChange
                      }
                    >

                      <option value="Scheduled">
                        Scheduled
                      </option>

                      <option value="Started">
                        Started
                      </option>

                      <option value="In Transit">
                        In Transit
                      </option>

                      <option value="Completed">
                        Completed
                      </option>

                    </select>

                  </div>


                  {/* PICKUP */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Pickup Location
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      name="pickup_location"
                      value={
                        editTrip.pickup_location ||
                        ""
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>


                  {/* DESTINATION */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Destination
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      name="destination"
                      value={
                        editTrip.destination ||
                        ""
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>


                  {/* PICKUP LATITUDE */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Pickup Latitude
                    </label>

                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      name="pickup_latitude"
                      value={
                        editTrip.pickup_latitude ||
                        ""
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>


                  {/* PICKUP LONGITUDE */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Pickup Longitude
                    </label>

                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      name="pickup_longitude"
                      value={
                        editTrip.pickup_longitude ||
                        ""
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>


                  {/* DESTINATION LATITUDE */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Destination Latitude
                    </label>

                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      name="destination_latitude"
                      value={
                        editTrip.destination_latitude ||
                        ""
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>


                  {/* DESTINATION LONGITUDE */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Destination Longitude
                    </label>

                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      name="destination_longitude"
                      value={
                        editTrip.destination_longitude ||
                        ""
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>


                  {/* START TIME */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Scheduled Start
                    </label>

                    <input
                      type="datetime-local"
                      className="form-control"
                      name="scheduled_start_time"
                      value={
                        editTrip.scheduled_start_time ||
                        ""
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>


                  {/* END TIME */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Scheduled End
                    </label>

                    <input
                      type="datetime-local"
                      className="form-control"
                      name="scheduled_end_time"
                      value={
                        editTrip.scheduled_end_time ||
                        ""
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                </div>

              </div>


              {/* FOOTER */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-light"
                  onClick={
                    closeEditModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={
                    updateTrip
                  }
                >

                  <FaEdit className="me-2" />

                  Update Trip

                </button>

              </div>

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          CREATE TRIP MODAL
      ================================================= */}

      {showCreateModal && (

        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor:
              "rgba(15,23,42,0.55)",
            zIndex: 1050,
          }}
          onClick={
            closeCreateModal
          }
        >

          <div
            className="modal-dialog modal-lg modal-dialog-scrollable"
            onClick={(event) =>
              event.stopPropagation()
            }
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

                <h5 className="modal-title fw-bold">

                  <FaTruckMoving className="me-2" />

                  Create Trip

                </h5>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={
                    closeCreateModal
                  }
                  aria-label="Close"
                />

              </div>


              {/* BODY */}

              <div className="modal-body p-4">

                <div className="row">

                  {/* SHIPMENT */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Shipment
                    </label>

                    <select
                      className="form-select"
                      name="shipment_id"
                      value={
                        newTrip.shipment_id
                      }
                      onChange={
                        handleCreateChange
                      }
                    >

                      <option value="">
                        Select Shipment
                      </option>

                      {shipments.map(
                        (shipment) => (

                          <option
                            key={
                              shipment.id
                            }
                            value={
                              shipment.id
                            }
                          >
                            {
                              shipment.tracking_number
                            }
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  {/* DRIVER */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Driver
                    </label>

                    <select
                      className="form-select"
                      name="driver_id"
                      value={
                        newTrip.driver_id
                      }
                      onChange={
                        handleCreateChange
                      }
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

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Vehicle
                    </label>

                    <select
                      className="form-select"
                      name="vehicle_id"
                      value={
                        newTrip.vehicle_id
                      }
                      onChange={
                        handleCreateChange
                      }
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


                  {/* STATUS */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Status
                    </label>

                    <select
                      className="form-select"
                      name="trip_status"
                      value={
                        newTrip.trip_status
                      }
                      onChange={
                        handleCreateChange
                      }
                    >

                      <option value="Scheduled">
                        Scheduled
                      </option>

                      <option value="Started">
                        Started
                      </option>

                      <option value="In Transit">
                        In Transit
                      </option>

                      <option value="Completed">
                        Completed
                      </option>

                    </select>

                  </div>


                  {/* PICKUP */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Pickup Location
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      name="pickup_location"
                      value={
                        newTrip.pickup_location
                      }
                      onChange={
                        handleCreateChange
                      }
                      placeholder="Enter pickup location"
                    />

                  </div>


                  {/* DESTINATION */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Destination
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      name="destination"
                      value={
                        newTrip.destination
                      }
                      onChange={
                        handleCreateChange
                      }
                      placeholder="Enter destination"
                    />

                  </div>


                  {/* PICKUP LATITUDE */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Pickup Latitude
                    </label>

                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      name="pickup_latitude"
                      value={
                        newTrip.pickup_latitude
                      }
                      onChange={
                        handleCreateChange
                      }
                      placeholder="Example: 17.3850"
                    />

                  </div>


                  {/* PICKUP LONGITUDE */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Pickup Longitude
                    </label>

                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      name="pickup_longitude"
                      value={
                        newTrip.pickup_longitude
                      }
                      onChange={
                        handleCreateChange
                      }
                      placeholder="Example: 78.4867"
                    />

                  </div>


                  {/* DESTINATION LATITUDE */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Destination Latitude
                    </label>

                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      name="destination_latitude"
                      value={
                        newTrip.destination_latitude
                      }
                      onChange={
                        handleCreateChange
                      }
                      placeholder="Example: 16.5062"
                    />

                  </div>


                  {/* DESTINATION LONGITUDE */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Destination Longitude
                    </label>

                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      name="destination_longitude"
                      value={
                        newTrip.destination_longitude
                      }
                      onChange={
                        handleCreateChange
                      }
                      placeholder="Example: 80.6480"
                    />

                  </div>


                  {/* START */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Scheduled Start
                    </label>

                    <input
                      type="datetime-local"
                      className="form-control"
                      name="scheduled_start_time"
                      value={
                        newTrip.scheduled_start_time
                      }
                      onChange={
                        handleCreateChange
                      }
                    />

                  </div>


                  {/* END */}

                  <div className="col-md-6 mb-3">

                    <label className="form-label fw-semibold">
                      Scheduled End
                    </label>

                    <input
                      type="datetime-local"
                      className="form-control"
                      name="scheduled_end_time"
                      value={
                        newTrip.scheduled_end_time
                      }
                      onChange={
                        handleCreateChange
                      }
                    />

                  </div>

                </div>

              </div>


              {/* FOOTER */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-light"
                  onClick={
                    closeCreateModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-success"
                  onClick={
                    createTrip
                  }
                >

                  <FaPlus className="me-2" />

                  Create Trip

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}

export default Trips;