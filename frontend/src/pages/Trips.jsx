import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function Trips() {
  const [trips, setTrips] = useState([]);

  // ================= ROLE =================

  const userRole = localStorage.getItem("role") || "";

  const normalizedRole = userRole
    .toLowerCase()
    .replace(/\s+/g, "_");

  // Roles allowed to manage trips
  const canManageTrips = [
    "administrator",
    "fleet_manager",
    "dispatcher",
  ].includes(normalizedRole);

  // ================= LOAD TRIPS =================

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const res = await api.get("/trips/");
      setTrips(res.data);
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to load trips"
      );
    }
  };

  // ================= DELETE TRIP =================

  const deleteTrip = async (id) => {
    if (!window.confirm("Delete this trip?")) return;

    try {
      await api.delete(`/trips/${id}`);

      alert("Trip Deleted Successfully");

      loadTrips();
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to delete trip"
      );
    }
  };

  // ================= STATUS STYLE =================

  const getStatusStyle = (status) => {
    const value = status?.toLowerCase() || "";

    if (value === "completed") {
      return "bg-green-500/10 text-green-400 border-green-500/20";
    }

    if (value === "active") {
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }

    if (value === "cancelled") {
      return "bg-red-500/10 text-red-400 border-red-500/20";
    }

    if (value === "pending") {
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    }

    if (value === "assigned") {
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }

    return "bg-slate-500/10 text-slate-300 border-slate-500/20";
  };

  // ================= SUMMARY =================

  const completedTrips = trips.filter(
    (trip) =>
      trip.trip_status?.toLowerCase() === "completed"
  ).length;

  const activeTrips = trips.filter(
    (trip) =>
      trip.trip_status?.toLowerCase() === "active"
  ).length;

  const cancelledTrips = trips.filter(
    (trip) =>
      trip.trip_status?.toLowerCase() === "cancelled"
  ).length;

  // ================= UI =================

  return (
    <Layout>

      {/* ================= HEADER ================= */}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            Trips
          </h1>

          <p className="text-slate-400 mt-2">
            Manage trips, schedules and fleet operations
          </p>
        </div>

        {/* ADD TRIP - ADMIN / FLEET MANAGER / DISPATCHER */}

        {canManageTrips && (
          <Link
            to="/add-trip"
            className="w-fit bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-blue-900/30 hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-0.5 transition-all"
          >
            + Add Trip
          </Link>
        )}

      </div>


      {/* ================= SUMMARY CARDS ================= */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

        <SummaryCard
          title="Total Trips"
          value={trips.length}
          color="blue"
        />

        <SummaryCard
          title="Active Trips"
          value={activeTrips}
          color="cyan"
        />

        <SummaryCard
          title="Completed Trips"
          value={completedTrips}
          color="green"
        />

        <SummaryCard
          title="Cancelled Trips"
          value={cancelledTrips}
          color="red"
        />

      </div>


      {/* ================= TRIPS TABLE ================= */}

      <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">

        <div className="p-6 border-b border-slate-800">

          <h2 className="text-xl font-bold text-white">
            Trip List
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            All trips registered in the fleet system
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full min-w-[1200px]">

            <thead className="bg-blue-600/20">

              <tr>

                <th className="p-4 text-left text-blue-300">
                  ID
                </th>

                <th className="p-4 text-left text-blue-300">
                  Shipment
                </th>

                <th className="p-4 text-left text-blue-300">
                  Driver
                </th>

                <th className="p-4 text-left text-blue-300">
                  Vehicle
                </th>

                <th className="p-4 text-left text-blue-300">
                  Pickup
                </th>

                <th className="p-4 text-left text-blue-300">
                  Destination
                </th>

                <th className="p-4 text-left text-blue-300">
                  Status
                </th>

                <th className="p-4 text-left text-blue-300">
                  Start Time
                </th>

                <th className="p-4 text-left text-blue-300">
                  End Time
                </th>

                <th className="p-4 text-left text-blue-300">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {trips.length === 0 ? (

                <tr>

                  <td
                    colSpan="10"
                    className="text-center p-10 text-slate-500"
                  >
                    No trips found
                  </td>

                </tr>

              ) : (

                trips.map((trip) => (

                  <tr
                    key={trip.id}
                    className="border-t border-slate-800 hover:bg-blue-500/5 transition"
                  >

                    {/* ID */}

                    <td className="p-4 text-slate-400">
                      {trip.id}
                    </td>


                    {/* Shipment */}

                    <td className="p-4">

                      <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-lg text-sm">
                        #{trip.shipment_id}
                      </span>

                    </td>


                    {/* Driver */}

                    <td className="p-4">

                      <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3 py-1 rounded-lg text-sm">
                        #{trip.driver_id}
                      </span>

                    </td>


                    {/* Vehicle */}

                    <td className="p-4">

                      <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1 rounded-lg text-sm">
                        #{trip.vehicle_id}
                      </span>

                    </td>


                    {/* Pickup */}

                    <td className="p-4 text-slate-300">
                      {trip.pickup_location || "-"}
                    </td>


                    {/* Destination */}

                    <td className="p-4 text-slate-300">
                      {trip.destination || "-"}
                    </td>


                    {/* Status */}

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(
                          trip.trip_status
                        )}`}
                      >
                        {trip.trip_status || "Unknown"}
                      </span>

                    </td>


                    {/* Start Time */}

                    <td className="p-4 text-slate-400 text-sm">
                      {trip.scheduled_start_time || "-"}
                    </td>


                    {/* End Time */}

                    <td className="p-4 text-slate-400 text-sm">
                      {trip.scheduled_end_time || "-"}
                    </td>


                    {/* ================= ACTIONS ================= */}

                    <td className="p-4">

                      <div className="flex gap-2">

                        {/* EDIT
                            ADMIN / FLEET MANAGER / DISPATCHER
                        */}

                        {canManageTrips && (
                          <Link
                            to={`/edit-trip/${trip.id}`}
                            className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition"
                          >
                            Edit
                          </Link>
                        )}


                        {/* ETA
                            ALL ROLES CAN VIEW
                        */}

                        <Link
                          to={`/trip-eta/${trip.id}`}
                          className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1.5 rounded-lg hover:bg-yellow-500/20 transition"
                        >
                          ETA
                        </Link>


                        {/* DELETE
                            ADMIN / FLEET MANAGER / DISPATCHER
                        */}

                        {canManageTrips && (
                          <button
                            onClick={() =>
                              deleteTrip(trip.id)
                            }
                            className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition"
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

    blue: {
      border: "border-blue-400/20",
      text: "text-blue-400",
    },

    cyan: {
      border: "border-cyan-400/20",
      text: "text-cyan-400",
    },

    green: {
      border: "border-green-400/20",
      text: "text-green-400",
    },

    red: {
      border: "border-red-400/20",
      text: "text-red-400",
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

export default Trips;