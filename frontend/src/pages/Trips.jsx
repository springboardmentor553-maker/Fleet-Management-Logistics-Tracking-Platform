import { useEffect, useMemo, useState } from "react";

import {
  FaRoute,
  FaPlus,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaTruck,
  FaUserTie,
  FaBox,
  FaMapMarkerAlt,
  FaTrash,
  FaPlay,
} from "react-icons/fa";

import {
  getTrips,
  createTrip,
  updateTrip,
  deleteTrip,
} from "../services/tripService";

import { getShipments } from "../services/shipmentService";
import { getDrivers } from "../services/driverService";
import { getVehicles } from "../services/vehicleService";


function Trips() {
  const [trips, setTrips] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [error, setError] = useState("");


  // ==========================================
  // FORM
  // ==========================================

  const [form, setForm] = useState({
    shipment_id: "",
    driver_id: "",
    vehicle_id: "",
    start_time: "",
  });


  // ==========================================
  // ERROR MESSAGE
  // ==========================================

  const getErrorMessage = (
    error,
    defaultMessage
  ) => {
    const detail =
      error?.response?.data?.detail;

    if (Array.isArray(detail)) {
      return detail
        .map(
          (item) =>
            item?.msg ||
            JSON.stringify(item)
        )
        .join("\n");
    }

    if (
      typeof detail === "object" &&
      detail !== null
    ) {
      return (
        detail.msg ||
        JSON.stringify(detail)
      );
    }

    if (typeof detail === "string") {
      return detail;
    }

    return defaultMessage;
  };


  // ==========================================
  // LOAD DATA
  // ==========================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        tripData,
        shipmentData,
        driverData,
        vehicleData,
      ] = await Promise.all([
        getTrips(),
        getShipments(),
        getDrivers(),
        getVehicles(),
      ]);

      setTrips(tripData || []);
      setShipments(shipmentData || []);
      setDrivers(driverData || []);
      setVehicles(vehicleData || []);

    } catch (err) {
      console.error(
        "Failed to load trip data:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Failed to load trip management data."
        )
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);


  // ==========================================
  // LOOKUPS
  // ==========================================

  const shipmentById = useMemo(() => {
    return shipments.reduce(
      (map, shipment) => {
        map[shipment.id] = shipment;
        return map;
      },
      {}
    );
  }, [shipments]);


  const driverById = useMemo(() => {
    return drivers.reduce(
      (map, driver) => {
        map[driver.id] = driver;
        return map;
      },
      {}
    );
  }, [drivers]);


  const vehicleById = useMemo(() => {
    return vehicles.reduce(
      (map, vehicle) => {
        map[vehicle.id] = vehicle;
        return map;
      },
      {}
    );
  }, [vehicles]);


  // ==========================================
  // AVAILABLE SHIPMENTS
  // ==========================================

  const availableShipments =
    useMemo(() => {
      const assignedShipmentIds =
        new Set(
          trips.map(
            (trip) => trip.shipment_id
          )
        );

      return shipments.filter(
        (shipment) =>
          !assignedShipmentIds.has(
            shipment.id
          ) &&
          ![
            "Delivered",
            "Cancelled",
            "DELIVERED",
            "CANCELLED",
          ].includes(shipment.status)
      );
    }, [shipments, trips]);


  // ==========================================
  // AVAILABLE VEHICLES
  // ==========================================

  const availableVehicles =
    useMemo(() => {
      const activeVehicleIds =
        new Set(
          trips
            .filter(
              (trip) =>
                trip.status?.toUpperCase() ===
                "ONGOING"
            )
            .map(
              (trip) => trip.vehicle_id
            )
        );

      return vehicles.filter(
        (vehicle) =>
          vehicle.status?.toLowerCase() !==
            "maintenance" &&
          !activeVehicleIds.has(
            vehicle.id
          )
      );
    }, [vehicles, trips]);


  // ==========================================
  // AVAILABLE DRIVERS
  // ==========================================

  const availableDrivers =
    useMemo(() => {
      const activeDriverIds =
        new Set(
          trips
            .filter(
              (trip) =>
                trip.status?.toUpperCase() ===
                "ONGOING"
            )
            .map(
              (trip) => trip.driver_id
            )
        );

      return drivers.filter(
        (driver) =>
          !activeDriverIds.has(
            driver.id
          )
      );
    }, [drivers, trips]);


  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleShipmentChange = (
    event
  ) => {
    const shipmentId =
      event.target.value;

    setForm((previous) => ({
      ...previous,
      shipment_id: shipmentId,
    }));
  };


  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // ==========================================
  // CREATE TRIP
  // ==========================================

  const handleCreateTrip = async (
    event
  ) => {
    event.preventDefault();

    if (
      !form.shipment_id ||
      !form.driver_id ||
      !form.vehicle_id
    ) {
      alert(
        "Please select shipment, driver and vehicle."
      );

      return;
    }

    const shipment =
      shipmentById[form.shipment_id];

    if (!shipment) {
      alert("Selected shipment not found.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const tripData = {
        shipment_id: Number(
          form.shipment_id
        ),

        driver_id: Number(
          form.driver_id
        ),

        vehicle_id: Number(
          form.vehicle_id
        ),

        start_location:
          shipment.pickup_location,

        end_location:
          shipment.delivery_location,

        start_time:
          form.start_time
            ? new Date(
                form.start_time
              ).toISOString()
            : new Date().toISOString(),

        end_time: null,

        distance: null,

        status: "ONGOING",
      };

      const newTrip =
        await createTrip(tripData);

      try {
        await updateTrip(
          newTrip.id,
          {
            ...newTrip,
            status: "ONGOING",
            end_time: null,
          }
        );
      } catch (updateError) {
        console.warn(
          "Trip created, but status update failed.",
          updateError
        );
      }

      setShowCreateForm(false);

      setForm({
        shipment_id: "",
        driver_id: "",
        vehicle_id: "",
        start_time: "",
      });

      await loadData();

      alert(
        "Trip created successfully."
      );

    } catch (err) {
      console.error(
        "Failed to create trip:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Failed to create trip."
        )
      );
    } finally {
      setSaving(false);
    }
  };


  // ==========================================
  // UPDATE STATUS
  // ==========================================

  const handleStatusChange = async (
    trip,
    newStatus
  ) => {
    try {
      setError("");

      const updatedTrip = {
        shipment_id:
          trip.shipment_id,

        driver_id:
          trip.driver_id,

        vehicle_id:
          trip.vehicle_id,

        start_location:
          trip.start_location,

        end_location:
          trip.end_location,

        pickup_latitude:
          trip.pickup_latitude,

        pickup_longitude:
          trip.pickup_longitude,

        destination_latitude:
          trip.destination_latitude,

        destination_longitude:
          trip.destination_longitude,

        start_time:
          trip.start_time,

        end_time:
          newStatus === "COMPLETED"
            ? new Date().toISOString()
            : newStatus === "ONGOING"
            ? null
            : trip.end_time,

        distance:
          trip.distance,

        status: newStatus,
      };

      await updateTrip(
        trip.id,
        updatedTrip
      );

      await loadData();

    } catch (err) {
      console.error(
        "Failed to update trip:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Failed to update trip status."
        )
      );
    }
  };


  // ==========================================
  // DELETE TRIP
  // ==========================================

  const handleDelete = async (
    tripId
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this trip?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteTrip(tripId);

      await loadData();

    } catch (err) {
      console.error(
        "Failed to delete trip:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Failed to delete trip."
        )
      );
    }
  };


  // ==========================================
  // STATUS COUNTS
  // ==========================================

  const totalTrips =
    trips.length;

  const ongoingTrips =
    trips.filter(
      (trip) =>
        trip.status?.toUpperCase() ===
        "ONGOING"
    ).length;

  const completedTrips =
    trips.filter(
      (trip) =>
        trip.status?.toUpperCase() ===
        "COMPLETED"
    ).length;

  const cancelledTrips =
    trips.filter(
      (trip) =>
        trip.status?.toUpperCase() ===
        "CANCELLED"
    ).length;


  // ==========================================
  // STATUS BADGE
  // ==========================================

  const getStatusBadge = (
    status
  ) => {
    const normalized =
      status?.toUpperCase();

    if (
      normalized === "COMPLETED"
    ) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }

    if (
      normalized === "CANCELLED"
    ) {
      return "bg-red-500/10 text-red-400 border-red-500/20";
    }

    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="w-full min-h-screen overflow-x-hidden bg-slate-950 text-white flex items-center justify-center p-6">
        <p className="text-slate-400">
          Loading trips...
        </p>
      </div>
    );
  }


  return (
    <div className="w-full min-h-screen max-w-full overflow-x-hidden bg-slate-950 text-slate-100">

      {/* ======================================
          PAGE CONTENT
      ====================================== */}

      <div className="w-full max-w-full px-4 sm:px-6 py-6">

        {/* HEADER */}

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-8">

          <div className="min-w-0">

            <div className="flex items-center gap-3 mb-2">

              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <FaRoute />
              </div>

              <span className="text-sm font-medium uppercase tracking-wider text-blue-400">
                Fleet Operations
              </span>

            </div>

            <h1 className="text-3xl font-bold text-white">
              Trip Management
            </h1>

            <p className="mt-2 text-slate-400">
              Schedule, monitor and manage fleet trips.
            </p>

          </div>


          <button
            type="button"
            onClick={() =>
              setShowCreateForm(
                !showCreateForm
              )
            }
            className="w-full md:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 transition"
          >
            <FaPlus size={13} />

            {showCreateForm
              ? "Close Form"
              : "Create Trip"}

          </button>

        </div>


        {/* ERROR */}

        {error && (
          <div className="w-full mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 whitespace-pre-line break-words">
            {error}
          </div>
        )}


        {/* ======================================
            SUMMARY CARDS
        ====================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

          {/* TOTAL */}

          <div className="min-w-0 bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div className="min-w-0">

                <p className="text-sm text-slate-400">
                  Total Trips
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {totalTrips}
                </p>

              </div>

              <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <FaRoute />
              </div>

            </div>

          </div>


          {/* ONGOING */}

          <div className="min-w-0 bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div className="min-w-0">

                <p className="text-sm text-slate-400">
                  Ongoing
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {ongoingTrips}
                </p>

              </div>

              <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <FaClock />
              </div>

            </div>

          </div>


          {/* COMPLETED */}

          <div className="min-w-0 bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div className="min-w-0">

                <p className="text-sm text-slate-400">
                  Completed
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {completedTrips}
                </p>

              </div>

              <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FaCheckCircle />
              </div>

            </div>

          </div>


          {/* CANCELLED */}

          <div className="min-w-0 bg-slate-900 border border-slate-800 rounded-xl p-5">

            <div className="flex items-center justify-between">

              <div className="min-w-0">

                <p className="text-sm text-slate-400">
                  Cancelled
                </p>

                <p className="text-3xl font-bold text-white mt-2">
                  {cancelledTrips}
                </p>

              </div>

              <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                <FaTimesCircle />
              </div>

            </div>

          </div>

        </div>


        {/* ======================================
            CREATE FORM
        ====================================== */}

        {showCreateForm && (
          <div className="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 mb-8">

            <div className="mb-6">

              <h2 className="text-lg font-semibold text-white">
                Create New Trip
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Assign a shipment, driver and vehicle to create a trip.
              </p>

            </div>


            <form
              onSubmit={handleCreateTrip}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >

              {/* SHIPMENT */}

              <div className="min-w-0">

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Shipment
                </label>

                <select
                  name="shipment_id"
                  value={form.shipment_id}
                  onChange={
                    handleShipmentChange
                  }
                  className="w-full min-w-0 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                  required
                >

                  <option value="">
                    Select shipment
                  </option>

                  {availableShipments.map(
                    (shipment) => (
                      <option
                        key={shipment.id}
                        value={shipment.id}
                      >
                        #{shipment.tracking_number} —{" "}
                        {shipment.pickup_location} →{" "}
                        {shipment.delivery_location}
                      </option>
                    )
                  )}

                </select>

                {availableShipments.length ===
                  0 && (
                  <p className="text-xs text-amber-400 mt-2">
                    No unassigned shipments are available.
                  </p>
                )}

              </div>


              {/* DRIVER */}

              <div className="min-w-0">

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Driver
                </label>

                <select
                  name="driver_id"
                  value={form.driver_id}
                  onChange={handleChange}
                  className="w-full min-w-0 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                  required
                >

                  <option value="">
                    Select driver
                  </option>

                  {availableDrivers.map(
                    (driver) => (
                      <option
                        key={driver.id}
                        value={driver.id}
                      >
                        {driver.name}
                      </option>
                    )
                  )}

                </select>

              </div>


              {/* VEHICLE */}

              <div className="min-w-0">

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Vehicle
                </label>

                <select
                  name="vehicle_id"
                  value={form.vehicle_id}
                  onChange={handleChange}
                  className="w-full min-w-0 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                  required
                >

                  <option value="">
                    Select vehicle
                  </option>

                  {availableVehicles.map(
                    (vehicle) => (
                      <option
                        key={vehicle.id}
                        value={vehicle.id}
                      >
                        {vehicle.vehicle_number} —{" "}
                        {vehicle.vehicle_type}
                      </option>
                    )
                  )}

                </select>

              </div>


              {/* START TIME */}

              <div className="min-w-0">

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Start Time
                </label>

                <input
                  type="datetime-local"
                  name="start_time"
                  value={form.start_time}
                  onChange={handleChange}
                  className="w-full min-w-0 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>


              {/* LOCATIONS */}

              {form.shipment_id && (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="min-w-0 rounded-xl bg-slate-800/50 border border-slate-700 p-4">

                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">

                      <FaMapMarkerAlt className="flex-shrink-0 text-emerald-400" />

                      Pickup

                    </div>

                    <p className="text-white text-sm break-words">

                      {
                        shipmentById[
                          form.shipment_id
                        ]?.pickup_location
                      }

                    </p>

                  </div>


                  <div className="min-w-0 rounded-xl bg-slate-800/50 border border-slate-700 p-4">

                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">

                      <FaMapMarkerAlt className="flex-shrink-0 text-red-400" />

                      Destination

                    </div>

                    <p className="text-white text-sm break-words">

                      {
                        shipmentById[
                          form.shipment_id
                        ]?.delivery_location
                      }

                    </p>

                  </div>

                </div>
              )}


              {/* SUBMIT */}

              <div className="md:col-span-2 flex justify-end">

                <button
                  type="submit"
                  disabled={
                    saving ||
                    availableShipments.length ===
                      0
                  }
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >

                  <FaPlus />

                  {saving
                    ? "Creating..."
                    : "Create Trip"}

                </button>

              </div>

            </form>

          </div>
        )}


        {/* ======================================
            TRIPS TABLE
        ====================================== */}

        <div className="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

          <div className="p-5 sm:p-6 border-b border-slate-800">

            <h2 className="text-lg font-semibold text-white">
              Trip Schedule
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Manage current and completed fleet trips.
            </p>

          </div>


          {trips.length === 0 ? (

            <div className="p-12 text-center">

              <FaRoute className="mx-auto text-4xl text-slate-700 mb-4" />

              <p className="text-slate-400">
                No trips have been created yet.
              </p>

              <p className="text-slate-600 text-sm mt-2">
                Create a trip using the button above.
              </p>

            </div>

          ) : (

            /*
             * The table itself is allowed to scroll
             * vertically if necessary, but it never
             * increases the width of the page.
             */

            <div className="w-full max-w-full overflow-x-auto">

              <table className="w-full min-w-[900px] text-sm">

                <thead className="bg-slate-800/60">

                  <tr>

                    <th className="text-left px-4 py-4 text-slate-400 font-medium">
                      Trip
                    </th>

                    <th className="text-left px-4 py-4 text-slate-400 font-medium">
                      Shipment
                    </th>

                    <th className="text-left px-4 py-4 text-slate-400 font-medium">
                      Driver
                    </th>

                    <th className="text-left px-4 py-4 text-slate-400 font-medium">
                      Vehicle
                    </th>

                    <th className="text-left px-4 py-4 text-slate-400 font-medium">
                      Route
                    </th>

                    <th className="text-left px-4 py-4 text-slate-400 font-medium">
                      Status
                    </th>

                    <th className="text-right px-4 py-4 text-slate-400 font-medium">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-800">

                  {trips.map((trip) => {

                    const shipment =
                      shipmentById[
                        trip.shipment_id
                      ];

                    const driver =
                      driverById[
                        trip.driver_id
                      ];

                    const vehicle =
                      vehicleById[
                        trip.vehicle_id
                      ];

                    const status =
                      trip.status?.toUpperCase();

                    return (

                      <tr
                        key={trip.id}
                        className="hover:bg-slate-800/30 transition"
                      >

                        {/* TRIP */}

                        <td className="px-4 py-5">

                          <div className="font-semibold text-white">
                            #{trip.id}
                          </div>

                          <div className="text-xs text-slate-500 mt-1 whitespace-nowrap">
                            {trip.start_time
                              ? new Date(
                                  trip.start_time
                                ).toLocaleString()
                              : "No start time"}
                          </div>

                        </td>


                        {/* SHIPMENT */}

                        <td className="px-4 py-5">

                          <div className="flex items-center gap-2 whitespace-nowrap">

                            <FaBox className="flex-shrink-0 text-cyan-400" />

                            <span className="text-white">
                              {shipment
                                ?.tracking_number ||
                                `Shipment #${trip.shipment_id}`}
                            </span>

                          </div>

                        </td>


                        {/* DRIVER */}

                        <td className="px-4 py-5">

                          <div className="flex items-center gap-2 whitespace-nowrap">

                            <FaUserTie className="flex-shrink-0 text-indigo-400" />

                            <span className="text-slate-200">
                              {driver?.name ||
                                `Driver #${trip.driver_id}`}
                            </span>

                          </div>

                        </td>


                        {/* VEHICLE */}

                        <td className="px-4 py-5">

                          <div className="flex items-center gap-2 whitespace-nowrap">

                            <FaTruck className="flex-shrink-0 text-blue-400" />

                            <span className="text-slate-200">
                              {vehicle
                                ?.vehicle_number ||
                                `Vehicle #${trip.vehicle_id}`}
                            </span>

                          </div>

                        </td>


                        {/* ROUTE */}

                        <td className="px-4 py-5 max-w-[260px]">

                          <div className="text-slate-200 truncate">
                            {trip.start_location}
                          </div>

                          <div className="text-xs text-slate-500 my-1">
                            ↓
                          </div>

                          <div className="text-slate-400 truncate">
                            {trip.end_location}
                          </div>

                        </td>


                        {/* STATUS */}

                        <td className="px-4 py-5">

                          <span
                            className={`inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full border text-xs font-medium ${getStatusBadge(
                              trip.status
                            )}`}
                          >
                            {status ===
                            "COMPLETED"
                              ? "Completed"
                              : status ===
                                "CANCELLED"
                              ? "Cancelled"
                              : "Ongoing"}
                          </span>

                        </td>


                        {/* ACTIONS */}

                        <td className="px-4 py-5">

                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">

                            {status !==
                              "COMPLETED" &&
                              status !==
                                "CANCELLED" && (

                                <>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStatusChange(
                                        trip,
                                        "ONGOING"
                                      )
                                    }
                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition"
                                    title="Start trip"
                                  >
                                    <FaPlay size={11} />
                                    Start
                                  </button>


                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStatusChange(
                                        trip,
                                        "COMPLETED"
                                      )
                                    }
                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                                    title="Complete trip"
                                  >
                                    <FaCheckCircle size={11} />
                                    Complete
                                  </button>


                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStatusChange(
                                        trip,
                                        "CANCELLED"
                                      )
                                    }
                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                                    title="Cancel trip"
                                  >
                                    <FaTimesCircle size={11} />
                                    Cancel
                                  </button>

                                </>

                              )}


                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  trip.id
                                )
                              }
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
                              title="Delete trip"
                            >
                              <FaTrash size={12} />
                            </button>

                          </div>

                        </td>

                      </tr>

                    );

                  })}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default Trips;