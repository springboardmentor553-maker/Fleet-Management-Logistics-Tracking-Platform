import { useEffect, useState } from "react";
import {
  FaBox,
  FaTruck,
  FaUser,
  FaClock,
  FaSearch,
  FaMapMarkerAlt,
  FaRoute,
  FaCalendarAlt,
} from "react-icons/fa";

import {
  getShipments,
  createShipment,
  updateShipment,
  deleteShipment,
  getShipmentStatus,
} from "../services/shipmentService";

import CreateShipmentModal from "../components/CreateShipmentModal";

const SHIPMENT_STATUSES = [
  "Created",
  "Assigned",
  "Picked Up",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Delayed",
  "Cancelled",
];

function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [trackingNumber, setTrackingNumber] = useState("");
  const [statusFrom, setStatusFrom] = useState("Created");
  const [statusTo, setStatusTo] = useState("Delayed");

  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ==========================================
  // TRACKING STATE
  // ==========================================

  const [trackNumber, setTrackNumber] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // ==========================================
  // ERROR MESSAGE HELPER
  // ==========================================

  const getErrorMessage = (error, defaultMessage) => {
    const detail = error?.response?.data?.detail;

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item?.msg || JSON.stringify(item))
        .join("\n");
    }

    if (typeof detail === "object" && detail !== null) {
      return detail.msg || JSON.stringify(detail);
    }

    if (typeof detail === "string") {
      return detail;
    }

    if (error?.message) {
      return error.message;
    }

    return defaultMessage;
  };

  // ==========================================
  // LOAD SHIPMENTS
  // ==========================================

  const loadShipments = async () => {
    try {
      setLoading(true);

      const data = await getShipments();

      setShipments(data);
    } catch (error) {
      console.error("Failed to load shipments:", error);

      alert(
        getErrorMessage(
          error,
          "Failed to load shipments."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  // ==========================================
  // TRACK SHIPMENT
  // ==========================================

  const handleTrackShipment = async (event) => {
    event.preventDefault();

    const enteredTrackingNumber = trackNumber.trim();

    if (!enteredTrackingNumber) {
      alert("Please enter a tracking number.");
      return;
    }

    try {
      setTrackingLoading(true);
      setTrackingData(null);

      const data = await getShipmentStatus(
        enteredTrackingNumber
      );

      setTrackingData(data);
    } catch (error) {
      console.error(
        "Failed to track shipment:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Shipment could not be tracked."
        )
      );
    } finally {
      setTrackingLoading(false);
    }
  };

  // ==========================================
  // CREATE SHIPMENT
  // ==========================================

  const handleCreateShipment = async (shipmentData) => {
    try {
      const newShipment =
        await createShipment(shipmentData);

      setShipments((previousShipments) => [
        ...previousShipments,
        newShipment,
      ]);

      setShowCreateModal(false);

      alert("Shipment created successfully.");
    } catch (error) {
      console.error(
        "Failed to create shipment:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Failed to create shipment."
        )
      );

      throw error;
    }
  };

  // ==========================================
  // UPDATE SHIPMENT
  // ==========================================

  const handleUpdateShipment = async (event) => {
    event.preventDefault();

    const enteredTrackingNumber =
      trackingNumber.trim();

    if (!enteredTrackingNumber) {
      alert("Please enter a tracking number.");
      return;
    }

    const shipment = shipments.find(
      (item) =>
        item.tracking_number.toLowerCase() ===
        enteredTrackingNumber.toLowerCase()
    );

    if (!shipment) {
      alert(
        "Shipment with this tracking number was not found."
      );
      return;
    }

    if (shipment.status !== statusFrom) {
      alert(
        `Current status of ${shipment.tracking_number} is "${shipment.status}", not "${statusFrom}".`
      );
      return;
    }

    if (statusFrom === statusTo) {
      alert(
        "Change Status From and Change Status To cannot be the same."
      );
      return;
    }

    setUpdating(true);

    const shipmentData = {
      sender_name: shipment.sender_name,
      receiver_name: shipment.receiver_name,
      pickup_location: shipment.pickup_location,
      delivery_location:
        shipment.delivery_location,
      status: statusTo,
      weight: Number(shipment.weight),
      assigned_driver_id:
        shipment.assigned_driver_id ?? null,
      assigned_vehicle_id:
        shipment.assigned_vehicle_id ?? null,
    };

    try {
      const updatedShipment =
        await updateShipment(
          shipment.id,
          shipmentData
        );

      setShipments((previousShipments) =>
        previousShipments.map((item) =>
          item.id === shipment.id
            ? updatedShipment
            : item
        )
      );

      setShowUpdateModal(false);
      setTrackingNumber("");

      alert(
        "Shipment status updated successfully."
      );
    } catch (error) {
      console.error(
        "Failed to update shipment:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Failed to update shipment status."
        )
      );
    } finally {
      setUpdating(false);
    }
  };

  // ==========================================
  // DELETE SHIPMENT
  // ==========================================

  const handleDeleteShipment = async (event) => {
    event.preventDefault();

    const enteredTrackingNumber =
      trackingNumber.trim();

    if (!enteredTrackingNumber) {
      alert("Please enter a tracking number.");
      return;
    }

    const shipment = shipments.find(
      (item) =>
        item.tracking_number.toLowerCase() ===
        enteredTrackingNumber.toLowerCase()
    );

    if (!shipment) {
      alert(
        "Shipment with this tracking number was not found."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete shipment ${shipment.tracking_number}?`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await deleteShipment(shipment.id);

      setShipments((previousShipments) =>
        previousShipments.filter(
          (item) => item.id !== shipment.id
        )
      );

      setShowDeleteModal(false);
      setTrackingNumber("");

      alert("Shipment deleted successfully.");
    } catch (error) {
      console.error(
        "Failed to delete shipment:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Failed to delete shipment."
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // SUMMARY COUNTS
  // ==========================================

  const activeShipments = shipments.filter(
    (shipment) =>
      shipment.status === "Assigned" ||
      shipment.status === "Picked Up" ||
      shipment.status === "In Transit" ||
      shipment.status === "Out for Delivery"
  ).length;

  const deliveredShipments = shipments.filter(
    (shipment) =>
      shipment.status === "Delivered"
  ).length;

  const delayedShipments = shipments.filter(
    (shipment) =>
      shipment.status === "Delayed"
  ).length;

  // ==========================================
  // STATUS COLOR
  // ==========================================

  const getStatusStyle = (status) => {
    switch (status) {
      case "Created":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";

      case "Assigned":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";

      case "Picked Up":
        return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";

      case "In Transit":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";

      case "Out for Delivery":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";

      case "Delivered":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";

      case "Delayed":
        return "bg-orange-500/10 text-orange-400 border border-orange-500/20";

      case "Cancelled":
        return "bg-red-500/10 text-red-400 border border-red-500/20";

      default:
        return "bg-slate-700 text-slate-300";
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-xl font-semibold">
          Loading shipments...
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">

      {/* ========================================
          PAGE HEADING
      ======================================== */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-white">
          Shipment Management
        </h1>

        <p className="text-slate-400 mt-2">
          Monitor and manage all shipments across
          the fleet.
        </p>

      </div>


      {/* ========================================
          SUMMARY + ACTIONS
      ======================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

        {/* SUMMARY CARDS */}

        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* TOTAL */}

          <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Total Shipments
                </p>

                <h2 className="text-3xl font-bold text-white mt-2">
                  {shipments.length}
                </h2>

              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl">
                <FaBox />
              </div>

            </div>

          </div>


          {/* ACTIVE */}

          <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Active Shipments
                </p>

                <h2 className="text-3xl font-bold text-white mt-2">
                  {activeShipments}
                </h2>

              </div>

              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xl">
                <FaTruck />
              </div>

            </div>

          </div>


          {/* DELIVERED */}

          <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Delivered
                </p>

                <h2 className="text-3xl font-bold text-white mt-2">
                  {deliveredShipments}
                </h2>

              </div>

              <div className="w-12 h-12 rounded-xl bg-purple-500 text-white flex items-center justify-center text-xl">
                <FaUser />
              </div>

            </div>

          </div>


          {/* DELAYED */}

          <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Delayed Shipments
                </p>

                <h2 className="text-3xl font-bold text-white mt-2">
                  {delayedShipments}
                </h2>

              </div>

              <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xl">
                <FaClock />
              </div>

            </div>

          </div>

        </div>


        {/* ACTION BUTTONS */}

        <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-6">

          <h2 className="text-xl font-semibold text-white mb-5">
            Shipment Actions
          </h2>

          <div className="space-y-4">

            <button
              onClick={() =>
                setShowCreateModal(true)
              }
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition"
            >
              + Create Shipment
            </button>

            <button
              onClick={() => {
                setTrackingNumber("");
                setStatusFrom("Created");
                setStatusTo("Delayed");
                setShowUpdateModal(true);
              }}
              className="w-full bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition"
            >
              Update Shipment
            </button>

            <button
              onClick={() => {
                setTrackingNumber("");
                setShowDeleteModal(true);
              }}
              className="w-full bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 transition"
            >
              Delete Shipment
            </button>

          </div>

        </div>

      </div>


      {/* ========================================
          TRACK SHIPMENT
      ======================================== */}

      <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-6 mb-8">

        <div className="flex items-center gap-3 mb-5">

          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <FaSearch />
          </div>

          <div>

            <h2 className="text-xl font-semibold text-white">
              Track Shipment
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Enter a tracking number to view the
              latest shipment information.
            </p>

          </div>

        </div>


        {/* TRACK FORM */}

        <form
          onSubmit={handleTrackShipment}
          className="flex flex-col md:flex-row gap-3"
        >

          <input
            type="text"
            value={trackNumber}
            onChange={(event) =>
              setTrackNumber(event.target.value)
            }
            placeholder="Example: FLT000001"
            className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={trackingLoading}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {trackingLoading
              ? "Tracking..."
              : "Track Shipment"}
          </button>

        </form>


        {/* TRACKING RESULT */}

        {trackingData && (

          <div className="mt-6 border border-slate-700 rounded-2xl bg-slate-800/60 p-6">

            {/* RESULT HEADER */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

              <div>

                <p className="text-sm text-slate-400">
                  Tracking Number
                </p>

                <h3 className="text-2xl font-bold text-white mt-1">
                  {trackingData.tracking_number}
                </h3>

              </div>

              <span
                className={`inline-flex w-fit px-4 py-2 rounded-full text-sm font-medium ${getStatusStyle(
                  trackingData.current_status
                )}`}
              >
                {trackingData.current_status}
              </span>

            </div>


            {/* TRACKING INFORMATION */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

              {/* DRIVER */}

              <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">

                <div className="flex items-center gap-3 mb-2">

                  <FaUser className="text-blue-400" />

                  <p className="text-sm text-slate-400">
                    Driver
                  </p>

                </div>

                <p className="text-white font-semibold">
                  {trackingData.driver_name ||
                    "Not assigned"}
                </p>

              </div>


              {/* VEHICLE */}

              <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">

                <div className="flex items-center gap-3 mb-2">

                  <FaTruck className="text-emerald-400" />

                  <p className="text-sm text-slate-400">
                    Vehicle
                  </p>

                </div>

                <p className="text-white font-semibold">
                  {trackingData.vehicle_registration_number ||
                    "Not assigned"}
                </p>

              </div>


              {/* ETA */}

              <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">

                <div className="flex items-center gap-3 mb-2">

                  <FaClock className="text-orange-400" />

                  <p className="text-sm text-slate-400">
                    Estimated Arrival
                  </p>

                </div>

                <p className="text-white font-semibold">
                  {trackingData.eta ||
                    "Not available"}
                </p>

              </div>


              {/* PICKUP */}

              <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">

                <div className="flex items-center gap-3 mb-2">

                  <FaMapMarkerAlt className="text-cyan-400" />

                  <p className="text-sm text-slate-400">
                    Pickup Location
                  </p>

                </div>

                <p className="text-white font-semibold">
                  {trackingData.pickup_location}
                </p>

              </div>


              {/* DESTINATION */}

              <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">

                <div className="flex items-center gap-3 mb-2">

                  <FaRoute className="text-purple-400" />

                  <p className="text-sm text-slate-400">
                    Destination
                  </p>

                </div>

                <p className="text-white font-semibold">
                  {trackingData.destination}
                </p>

              </div>


              {/* ROUTE */}

              <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">

                <div className="flex items-center gap-3 mb-2">

                  <FaRoute className="text-yellow-400" />

                  <p className="text-sm text-slate-400">
                    Route
                  </p>

                </div>

                <p className="text-white font-semibold">
                  {trackingData.pickup_location}
                  {" → "}
                  {trackingData.destination}
                </p>

              </div>

            </div>

          </div>

        )}

      </div>


      {/* ========================================
          ALL SHIPMENTS TABLE
      ======================================== */}

      <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden">

        <div className="p-6 border-b border-slate-800">

          <h2 className="text-xl font-semibold text-white">
            All Shipments
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Current shipment records from the system.
          </p>

        </div>


        {shipments.length === 0 ? (

          <div className="p-8 text-center text-slate-500">
            No shipments found.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-800">

                <tr>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
                    Tracking Number
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
                    Sender
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
                    Receiver
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
                    Pickup
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
                    Destination
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
                    Status
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
                    Weight
                  </th>

                </tr>

              </thead>


              <tbody>

                {shipments.map((shipment) => (

                  <tr
                    key={shipment.id}
                    className="border-t border-slate-800 hover:bg-slate-800/60 transition"
                  >

                    <td className="px-6 py-4 font-semibold text-blue-400">
                      {shipment.tracking_number}
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      {shipment.sender_name}
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      {shipment.receiver_name}
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      {shipment.pickup_location}
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      {shipment.delivery_location}
                    </td>

                    <td className="px-6 py-4">

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(
                          shipment.status
                        )}`}
                      >
                        {shipment.status}
                      </span>

                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      {shipment.weight}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ========================================
          CREATE SHIPMENT MODAL
      ======================================== */}

      {showCreateModal && (

        <CreateShipmentModal
          onClose={() =>
            setShowCreateModal(false)
          }
          onSubmit={handleCreateShipment}
        />

      )}


      {/* ========================================
          UPDATE SHIPMENT MODAL
      ======================================== */}

      {showUpdateModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-xl bg-slate-900 rounded-2xl shadow-xl border border-slate-700">

            {/* HEADER */}

            <div className="flex items-center justify-between p-6 border-b border-slate-700">

              <div>

                <h2 className="text-2xl font-bold text-white">
                  Update Shipment
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  Change the shipment status.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowUpdateModal(false)
                }
                className="text-slate-400 hover:text-white text-2xl"
              >
                ×
              </button>

            </div>


            <form onSubmit={handleUpdateShipment}>

              <div className="p-6 space-y-5">

                {/* TRACKING NUMBER */}

                <div>

                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tracking Number
                  </label>

                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(event) =>
                      setTrackingNumber(
                        event.target.value
                      )
                    }
                    required
                    placeholder="Example: FLT000001"
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />

                </div>


                {/* STATUS FROM */}

                <div>

                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Change Status From
                  </label>

                  <select
                    value={statusFrom}
                    onChange={(event) =>
                      setStatusFrom(
                        event.target.value
                      )
                    }
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  >

                    {SHIPMENT_STATUSES.map(
                      (status) => (

                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* STATUS TO */}

                <div>

                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Change Status To
                  </label>

                  <select
                    value={statusTo}
                    onChange={(event) =>
                      setStatusTo(
                        event.target.value
                      )
                    }
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  >

                    {SHIPMENT_STATUSES.map(
                      (status) => (

                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>


              {/* FOOTER */}

              <div className="flex justify-end gap-3 p-6 border-t border-slate-700">

                <button
                  type="button"
                  onClick={() =>
                    setShowUpdateModal(false)
                  }
                  className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  {updating
                    ? "Updating..."
                    : "Update Shipment"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ========================================
          DELETE SHIPMENT MODAL
      ======================================== */}

      {showDeleteModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-xl bg-slate-900 rounded-2xl shadow-xl border border-slate-700">

            <div className="flex items-center justify-between p-6 border-b border-slate-700">

              <div>

                <h2 className="text-2xl font-bold text-white">
                  Delete Shipment
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  Enter the tracking number of the shipment to delete.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowDeleteModal(false)
                }
                className="text-slate-400 hover:text-white text-2xl"
              >
                ×
              </button>

            </div>


            <form onSubmit={handleDeleteShipment}>

              <div className="p-6">

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tracking Number
                </label>

                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(event) =>
                    setTrackingNumber(
                      event.target.value
                    )
                  }
                  required
                  placeholder="Example: FLT000001"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
                />

              </div>


              <div className="flex justify-end gap-3 p-6 border-t border-slate-700">

                <button
                  type="button"
                  onClick={() =>
                    setShowDeleteModal(false)
                  }
                  className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={deleting}
                  className="px-5 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting
                    ? "Deleting..."
                    : "Delete Shipment"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Shipments;