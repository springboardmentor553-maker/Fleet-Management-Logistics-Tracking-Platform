import { useEffect, useState } from "react";

import api from "../api/api";
import { toast } from "react-toastify";

import {
  FaEdit,
  FaTrash,
  FaGasPump,
  FaPlus,
  FaSearch,
  FaCar,
  FaCalendarAlt,
  FaRupeeSign,
  FaTachometerAlt,
  FaChartLine,
  FaDatabase,
  FaMapMarkerAlt,
  FaUserTie,
} from "react-icons/fa";


function Fuel() {

  // =====================================================
  // EMPTY FORM
  // =====================================================

  const emptyFuel = {
    vehicle_id: "",
    driver_id: "",
    fuel_date: "",
    fuel_quantity: "",
    fuel_cost: "",
    odometer_reading: "",
    fuel_station: "",
    remarks: "",
  };


  // =====================================================
  // STATES
  // =====================================================

  const [fuelLogs, setFuelLogs] =
    useState([]);

  const [vehicles, setVehicles] =
    useState([]);

  const [drivers, setDrivers] =
    useState([]);

  const [fuel, setFuel] =
    useState(emptyFuel);

  const [editFuel, setEditFuel] =
    useState(emptyFuel);

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
      fetchFuel(),
      fetchVehicles(),
      fetchDrivers(),
    ]);

    setLoading(false);
  };


  // =====================================================
  // FETCH FUEL
  // =====================================================

  const fetchFuel = async () => {

    try {

      const res =
        await api.get("/fuel");

      setFuelLogs(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (err) {

      console.error(
        "Fuel fetch error:",
        err
      );

      toast.error(
        "Failed to load fuel records"
      );

    }

  };


  // =====================================================
  // FETCH VEHICLES
  // =====================================================

  const fetchVehicles = async () => {

    try {

      const res =
        await api.get("/vehicles");

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
  // FETCH DRIVERS
  // =====================================================

  const fetchDrivers = async () => {

    try {

      const res =
        await api.get("/drivers");

      setDrivers(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (err) {

      console.error(
        "Driver fetch error:",
        err
      );

      toast.error(
        "Failed to load drivers"
      );

    }

  };


  // =====================================================
  // ADD FORM CHANGE
  // =====================================================

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setFuel(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  };


  // =====================================================
  // EDIT FORM CHANGE
  // =====================================================

  const handleEditChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setEditFuel(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  };


  // =====================================================
  // ADD FUEL
  // =====================================================

  const addFuel = async (e) => {

    e.preventDefault();

    try {

      setSaving(true);


      const payload = {

        vehicle_id:
          Number(
            fuel.vehicle_id
          ),

        driver_id:
          Number(
            fuel.driver_id
          ),

        fuel_date:
          fuel.fuel_date,

        fuel_quantity:
          Number(
            fuel.fuel_quantity
          ),

        fuel_cost:
          Number(
            fuel.fuel_cost
          ),

        odometer_reading:
          Number(
            fuel.odometer_reading
          ),

        fuel_station:
          fuel.fuel_station.trim(),

        remarks:
          fuel.remarks?.trim() ||
          null,
      };


      console.log(
        "Fuel payload:",
        payload
      );


      await api.post(
        "/fuel/",
        payload
      );


      toast.success(
        "Fuel Log Added Successfully"
      );


      setFuel(
        emptyFuel
      );


      await fetchFuel();


      document
        .getElementById(
          "closeAddFuel"
        )
        ?.click();


    } catch (err) {

      console.error(
        "Fuel Add Error:",
        err.response?.data ||
        err
      );


      toast.error(
        err.response?.data?.detail ||
        "Failed to Add Fuel Log"
      );


    } finally {

      setSaving(false);

    }

  };


  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const openEditModal = (item) => {

    setEditFuel({

      vehicle_id:
        item.vehicle_id ??
        "",

      driver_id:
        item.driver_id ??
        "",

      fuel_date:
        item.fuel_date ??
        "",

      fuel_quantity:
        item.fuel_quantity ??
        "",

      fuel_cost:
        item.fuel_cost ??
        "",

      odometer_reading:
        item.odometer_reading ??
        "",

      fuel_station:
        item.fuel_station ??
        "",

      remarks:
        item.remarks ??
        "",
    });


    setEditId(
      item.id
    );

  };


  // =====================================================
  // UPDATE FUEL
  // =====================================================

  const updateFuel = async (e) => {

    e.preventDefault();


    if (!editId) {

      toast.error(
        "Fuel record ID is missing"
      );

      return;
    }


    try {

      setUpdating(true);


      const payload = {

        vehicle_id:
          Number(
            editFuel.vehicle_id
          ),

        driver_id:
          Number(
            editFuel.driver_id
          ),

        fuel_date:
          editFuel.fuel_date,

        fuel_quantity:
          Number(
            editFuel.fuel_quantity
          ),

        fuel_cost:
          Number(
            editFuel.fuel_cost
          ),

        odometer_reading:
          Number(
            editFuel.odometer_reading
          ),

        fuel_station:
          editFuel.fuel_station.trim(),

        remarks:
          editFuel.remarks?.trim() ||
          null,
      };


      console.log(
        "Fuel update payload:",
        payload
      );


      await api.put(
        `/fuel/${editId}`,
        payload
      );


      toast.success(
        "Fuel Log Updated Successfully"
      );


      await fetchFuel();


      document
        .getElementById(
          "closeEditFuel"
        )
        ?.click();


    } catch (err) {

      console.error(
        "Fuel Update Error:",
        err.response?.data ||
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
  // DELETE FUEL
  // =====================================================

  const deleteFuel = async (id) => {

    if (
      !window.confirm(
        "Delete this Fuel Log?"
      )
    ) {

      return;
    }


    try {

      setDeletingId(
        id
      );


      await api.delete(
        `/fuel/${id}`
      );


      toast.success(
        "Fuel Log Deleted"
      );


      await fetchFuel();


    } catch (err) {

      console.error(
        "Fuel Delete Error:",
        err
      );


      toast.error(
        err.response?.data?.detail ||
        "Delete Failed"
      );


    } finally {

      setDeletingId(
        null
      );

    }

  };


  // =====================================================
  // CALCULATIONS
  // =====================================================

  const totalFuel =
    fuelLogs.reduce(
      (sum, item) =>
        sum +
        Number(
          item.fuel_quantity ||
          0
        ),
      0
    );


  const totalCost =
    fuelLogs.reduce(
      (sum, item) =>
        sum +
        Number(
          item.fuel_cost ||
          0
        ),
      0
    );


  const averageFuel =
    fuelLogs.length > 0
      ? totalFuel /
        fuelLogs.length
      : 0;


  // =====================================================
  // SEARCH
  // =====================================================

  const filteredLogs =
    fuelLogs.filter(
      (f) => {

        const vehicle =
          vehicles.find(
            (v) =>
              Number(v.id) ===
              Number(
                f.vehicle_id
              )
          );


        const driver =
          drivers.find(
            (d) =>
              Number(d.id) ===
              Number(
                f.driver_id
              )
          );


        const vehicleNumber =
          vehicle?.vehicle_number ||
          "";


        const driverName =
          driver?.name ||
          "";


        const searchText =
          `${vehicleNumber}
          ${driverName}
          ${f.fuel_station || ""}
          ${f.fuel_date || ""}
          ${f.fuel_quantity || ""}
          ${f.fuel_cost || ""}`
            .toLowerCase();


        return searchText.includes(
          search
            .toLowerCase()
            .trim()
        );

      }
    );


  // =====================================================
  // MAIN UI
  // =====================================================

  return (

    <main
      className="fuel-page"
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

              <FaGasPump
                className="me-2"
                style={{
                  color:
                    "#f59e0b",
                }}
              />

              Fuel Management

            </h2>


            <p
              className="text-muted mb-0"
            >
              Monitor fuel consumption,
              costs and vehicle fuel records.
            </p>

          </div>


          <button
            type="button"
            className="btn"
            data-bs-toggle="modal"
            data-bs-target="#addFuelModal"
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

            Add Fuel Log

          </button>

        </div>


        {/* =================================================
            STATISTICS
        ================================================= */}

        <div
          className="row g-4 mb-4"
        >


          {/* TOTAL FUEL */}

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
                      "#fff7ed",

                    color:
                      "#f97316",

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

                  <FaGasPump />

                </div>


                <div>

                  <small
                    className="text-muted"
                  >
                    Total Fuel
                  </small>


                  <h3
                    className="fw-bold mb-0"
                  >

                    {totalFuel.toFixed(
                      1
                    )}

                    <small
                      className="ms-1"
                      style={{
                        fontSize:
                          "14px",

                        color:
                          "#64748b",
                      }}
                    >
                      L
                    </small>

                  </h3>

                </div>

              </div>

            </div>

          </div>


          {/* TOTAL COST */}

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

                  <FaRupeeSign />

                </div>


                <div>

                  <small
                    className="text-muted"
                  >
                    Total Fuel Cost
                  </small>


                  <h3
                    className="fw-bold mb-0"
                  >

                    ₹
                    {totalCost.toLocaleString(
                      "en-IN"
                    )}

                  </h3>

                </div>

              </div>

            </div>

          </div>


          {/* AVERAGE */}

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

                  <FaChartLine />

                </div>


                <div>

                  <small
                    className="text-muted"
                  >
                    Avg. Fuel per Log
                  </small>


                  <h3
                    className="fw-bold mb-0"
                  >

                    {averageFuel.toFixed(
                      1
                    )}

                    <small
                      className="ms-1"
                      style={{
                        fontSize:
                          "14px",

                        color:
                          "#64748b",
                      }}
                    >
                      L
                    </small>

                  </h3>

                </div>

              </div>

            </div>

          </div>


          {/* TOTAL LOGS */}

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

                  <FaDatabase />

                </div>


                <div>

                  <small
                    className="text-muted"
                  >
                    Fuel Logs
                  </small>


                  <h3
                    className="fw-bold mb-0"
                  >
                    {fuelLogs.length}
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
                placeholder="Search vehicle, driver, fuel station or date..."
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
                    Fuel Log
                  </th>

                  <th>
                    Vehicle
                  </th>

                  <th>
                    Driver
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Quantity
                  </th>

                  <th>
                    Cost
                  </th>

                  <th>
                    Odometer
                  </th>

                  <th>
                    Fuel Station
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
                      colSpan="9"
                      className="text-center py-5"
                    >

                      <div
                        className="spinner-border text-primary"
                        role="status"
                      />

                      <div
                        className="text-muted mt-2"
                      >
                        Loading fuel records...
                      </div>

                    </td>

                  </tr>

                ) : filteredLogs.length === 0 ? (

                  <tr>

                    <td
                      colSpan="9"
                      className="text-center py-5"
                    >

                      <FaGasPump
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
                        No fuel records found.
                      </div>

                    </td>

                  </tr>

                ) : (

                  filteredLogs.map(
                    (f) => {

                      const vehicle =
                        vehicles.find(
                          (v) =>
                            Number(
                              v.id
                            ) ===
                            Number(
                              f.vehicle_id
                            )
                        );


                      const driver =
                        drivers.find(
                          (d) =>
                            Number(
                              d.id
                            ) ===
                            Number(
                              f.driver_id
                            )
                        );


                      return (

                        <tr
                          key={
                            f.id
                          }
                        >


                          {/* FUEL LOG */}

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
                                    "#fff7ed",

                                  color:
                                    "#f97316",

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

                                <FaGasPump />

                              </div>


                              <div>

                                <div
                                  className="fw-bold"
                                  style={{
                                    color:
                                      "#172033",
                                  }}
                                >

                                  FUEL-
                                  {String(
                                    f.id
                                  ).padStart(
                                    3,
                                    "0"
                                  )}

                                </div>


                                <small
                                  className="text-muted"
                                >
                                  Fuel Record
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

                                <FaCar />

                              </div>


                              <span
                                className="fw-semibold"
                              >

                                {vehicle?.vehicle_number ||
                                  `Vehicle #${f.vehicle_id}`}

                              </span>

                            </div>

                          </td>


                          {/* DRIVER */}

                          <td>

                            <div
                              className="d-flex align-items-center"
                            >

                              <FaUserTie
                                className="me-2"
                                style={{
                                  color:
                                    "#64748b",
                                }}
                              />


                              <span
                                className="fw-semibold"
                              >
                                {driver?.name ||
                                  `Driver #${f.driver_id}`}
                              </span>

                            </div>

                          </td>


                          {/* DATE */}

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

                              {f.fuel_date ||
                                "N/A"}

                            </div>

                          </td>


                          {/* QUANTITY */}

                          <td>

                            <span
                              style={{
                                background:
                                  "#fff7ed",

                                color:
                                  "#c2410c",

                                padding:
                                  "7px 11px",

                                borderRadius:
                                  "8px",

                                fontSize:
                                  "12px",

                                fontWeight:
                                  "700",
                              }}
                            >

                              {Number(
                                f.fuel_quantity ||
                                  0
                              ).toFixed(
                                2
                              )}

                              {" "}L

                            </span>

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

                              ₹{" "}

                              {Number(
                                f.fuel_cost ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}

                            </span>

                          </td>


                          {/* ODOMETER */}

                          <td>

                            <div
                              className="d-flex align-items-center"
                            >

                              <FaTachometerAlt
                                className="me-2"
                                style={{
                                  color:
                                    "#64748b",
                                }}
                              />

                              {Number(
                                f.odometer_reading ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}

                              <small
                                className="ms-1 text-muted"
                              >
                                km
                              </small>

                            </div>

                          </td>


                          {/* STATION */}

                          <td>

                            <div
                              className="d-flex align-items-center"
                            >

                              <FaMapMarkerAlt
                                className="me-2"
                                style={{
                                  color:
                                    "#ef4444",
                                }}
                              />

                              <span
                                className="fw-semibold"
                                style={{
                                  color:
                                    "#475569",
                                }}
                              >

                                {f.fuel_station ||
                                  "N/A"}

                              </span>

                            </div>

                          </td>


                          {/* ACTIONS */}

                          <td
                            className="text-center"
                          >

                            <button
                              type="button"
                              className="btn btn-sm me-1"
                              data-bs-toggle="modal"
                              data-bs-target="#editFuelModal"
                              onClick={() =>
                                openEditModal(
                                  f
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
                                deleteFuel(
                                  f.id
                                )
                              }
                              disabled={
                                deletingId ===
                                f.id
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

                              <FaTrash
                                className="me-1"
                              />

                              {deletingId ===
                              f.id
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
            ADD FUEL MODAL
        ================================================= */}

        <div
          className="modal fade"
          id="addFuelModal"
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


              {/* MODAL HEADER */}

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

                  <FaGasPump
                    className="me-2"
                  />

                  Add Fuel Log

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
                  addFuel
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
                          fuel.vehicle_id
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


                    {/* DRIVER */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Driver
                      </label>


                      <select
                        className="form-select"
                        name="driver_id"
                        value={
                          fuel.driver_id
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

                              {
                                driver.name
                              }

                            </option>

                          )
                        )}

                      </select>

                    </div>


                    {/* DATE */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Fuel Date
                      </label>


                      <input
                        type="date"
                        className="form-control"
                        name="fuel_date"
                        value={
                          fuel.fuel_date
                        }
                        onChange={
                          handleChange
                        }
                        required
                      />

                    </div>


                    {/* QUANTITY */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Fuel Quantity
                        (Liters)
                      </label>


                      <div
                        className="input-group"
                      >

                        <span
                          className="input-group-text"
                        >
                          ⛽
                        </span>


                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control"
                          name="fuel_quantity"
                          value={
                            fuel.fuel_quantity
                          }
                          onChange={
                            handleChange
                          }
                          required
                        />


                        <span
                          className="input-group-text"
                        >
                          L
                        </span>

                      </div>

                    </div>


                    {/* COST */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Fuel Cost
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
                          name="fuel_cost"
                          value={
                            fuel.fuel_cost
                          }
                          onChange={
                            handleChange
                          }
                          required
                        />

                      </div>

                    </div>


                    {/* ODOMETER */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Odometer Reading
                      </label>


                      <div
                        className="input-group"
                      >

                        <span
                          className="input-group-text"
                        >

                          <FaTachometerAlt />

                        </span>


                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control"
                          name="odometer_reading"
                          value={
                            fuel.odometer_reading
                          }
                          onChange={
                            handleChange
                          }
                          required
                        />


                        <span
                          className="input-group-text"
                        >
                          km
                        </span>

                      </div>

                    </div>


                    {/* FUEL STATION */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Fuel Station
                      </label>


                      <div
                        className="input-group"
                      >

                        <span
                          className="input-group-text"
                        >

                          <FaMapMarkerAlt />

                        </span>


                        <input
                          type="text"
                          className="form-control"
                          name="fuel_station"
                          value={
                            fuel.fuel_station
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="Enter fuel station"
                          required
                        />

                      </div>

                    </div>


                    {/* REMARKS */}

                    <div
                      className="col-md-12 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Remarks
                      </label>


                      <textarea
                        className="form-control"
                        name="remarks"
                        rows="3"
                        value={
                          fuel.remarks
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter remarks..."
                      />

                    </div>

                  </div>

                </div>


                {/* FOOTER */}

                <div
                  className="modal-footer"
                >

                  <button
                    id="closeAddFuel"
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
                      : "Save Fuel Log"}

                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>


        {/* =================================================
            EDIT FUEL MODAL
        ================================================= */}

        <div
          className="modal fade"
          id="editFuelModal"
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

                  Edit Fuel Log

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
                  updateFuel
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
                          editFuel.vehicle_id ||
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


                    {/* DRIVER */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Driver
                      </label>


                      <select
                        className="form-select"
                        name="driver_id"
                        value={
                          editFuel.driver_id ||
                          ""
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

                              {
                                driver.name
                              }

                            </option>

                          )
                        )}

                      </select>

                    </div>


                    {/* DATE */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Fuel Date
                      </label>


                      <input
                        type="date"
                        className="form-control"
                        name="fuel_date"
                        value={
                          editFuel.fuel_date ||
                          ""
                        }
                        onChange={
                          handleEditChange
                        }
                        required
                      />

                    </div>


                    {/* QUANTITY */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Fuel Quantity
                        (Liters)
                      </label>


                      <div
                        className="input-group"
                      >

                        <span
                          className="input-group-text"
                        >
                          ⛽
                        </span>


                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control"
                          name="fuel_quantity"
                          value={
                            editFuel.fuel_quantity ||
                            ""
                          }
                          onChange={
                            handleEditChange
                          }
                          required
                        />


                        <span
                          className="input-group-text"
                        >
                          L
                        </span>

                      </div>

                    </div>


                    {/* COST */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Fuel Cost
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
                          name="fuel_cost"
                          value={
                            editFuel.fuel_cost ||
                            ""
                          }
                          onChange={
                            handleEditChange
                          }
                          required
                        />

                      </div>

                    </div>


                    {/* ODOMETER */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Odometer Reading
                      </label>


                      <div
                        className="input-group"
                      >

                        <span
                          className="input-group-text"
                        >

                          <FaTachometerAlt />

                        </span>


                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control"
                          name="odometer_reading"
                          value={
                            editFuel.odometer_reading ||
                            ""
                          }
                          onChange={
                            handleEditChange
                          }
                          required
                        />


                        <span
                          className="input-group-text"
                        >
                          km
                        </span>

                      </div>

                    </div>


                    {/* STATION */}

                    <div
                      className="col-md-6 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Fuel Station
                      </label>


                      <div
                        className="input-group"
                      >

                        <span
                          className="input-group-text"
                        >

                          <FaMapMarkerAlt />

                        </span>


                        <input
                          type="text"
                          className="form-control"
                          name="fuel_station"
                          value={
                            editFuel.fuel_station ||
                            ""
                          }
                          onChange={
                            handleEditChange
                          }
                          placeholder="Enter fuel station"
                          required
                        />

                      </div>

                    </div>


                    {/* REMARKS */}

                    <div
                      className="col-md-12 mb-3"
                    >

                      <label
                        className="form-label fw-semibold"
                      >
                        Remarks
                      </label>


                      <textarea
                        className="form-control"
                        name="remarks"
                        rows="3"
                        value={
                          editFuel.remarks ||
                          ""
                        }
                        onChange={
                          handleEditChange
                        }
                        placeholder="Enter remarks..."
                      />

                    </div>

                  </div>

                </div>


                {/* FOOTER */}

                <div
                  className="modal-footer"
                >

                  <button
                    id="closeEditFuel"
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
                      : "Update Fuel Log"}

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


export default Fuel;