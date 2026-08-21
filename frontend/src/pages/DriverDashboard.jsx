import { useEffect, useState } from "react";

import {
  FaRoute,
  FaCheckCircle,
  FaTimesCircle,
  FaTruck,
  FaBox,
  FaMapMarkerAlt,
  FaFlagCheckered,
} from "react-icons/fa";

import {
  getDriverDashboard,
} from "../services/driverDashboardService";


function DriverDashboard() {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const loadDashboard = async () => {

    try {

      setLoading(true);
      setError("");

      const result =
        await getDriverDashboard();

      setData(result);

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Failed to load driver dashboard."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    loadDashboard();
  }, []);


  if (loading) {

    return (
      <div className="min-h-full bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-xl font-semibold">
          Loading driver dashboard...
        </div>
      </div>
    );

  }


  if (error) {

    return (
      <div className="min-h-full bg-slate-950 text-slate-100 p-6">

        <div className="max-w-3xl mx-auto bg-red-500/10 border border-red-500/30 rounded-2xl p-6">

          <h2 className="text-lg font-semibold text-red-400">
            Unable to load Driver Dashboard
          </h2>

          <p className="text-slate-300 mt-2">
            {error}
          </p>

          <p className="text-slate-500 text-sm mt-3">
            Make sure the logged-in driver's name
            matches the driver name registered in
            the Drivers module.
          </p>

        </div>

      </div>
    );

  }


  const summary = data?.summary || {};
  const activeTrip = data?.active_trip;
  const vehicle = data?.assigned_vehicle;
  const history = data?.trip_history || [];
  const shipments = data?.shipments || [];


  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-6">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-8">

        <p className="text-sm text-blue-400 font-medium">
          Driver Workspace
        </p>

        <h1 className="text-3xl font-bold text-white mt-1">
          Welcome, {data?.driver?.name}
        </h1>

        <p className="text-slate-400 mt-2">
          Manage your trips, vehicle, shipments and
          operational history.
        </p>

      </div>


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">


        {/* ACTIVE */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-400">
                Active Trip
              </p>

              <p className="text-3xl font-bold mt-2 text-white">
                {summary.active_trips || 0}
              </p>

            </div>

            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FaRoute />
            </div>

          </div>

        </div>


        {/* COMPLETED */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-400">
                Completed Trips
              </p>

              <p className="text-3xl font-bold mt-2 text-white">
                {summary.completed_trips || 0}
              </p>

            </div>

            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FaCheckCircle />
            </div>

          </div>

        </div>


        {/* CANCELLED */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-400">
                Cancelled Trips
              </p>

              <p className="text-3xl font-bold mt-2 text-white">
                {summary.cancelled_trips || 0}
              </p>

            </div>

            <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <FaTimesCircle />
            </div>

          </div>

        </div>


        {/* VEHICLE */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-400">
                Assigned Vehicle
              </p>

              <p className="text-lg font-bold mt-2 text-white">
                {vehicle?.vehicle_number || "None"}
              </p>

            </div>

            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <FaTruck />
            </div>

          </div>

        </div>


        {/* SHIPMENTS */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-400">
                My Shipments
              </p>

              <p className="text-3xl font-bold mt-2 text-white">
                {summary.shipments || 0}
              </p>

            </div>

            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <FaBox />
            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          ACTIVE TRIP + VEHICLE
      ===================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">


        {/* ACTIVE TRIP */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FaRoute />
            </div>

            <div>

              <h2 className="text-lg font-semibold text-white">
                My Active Trip
              </h2>

              <p className="text-sm text-slate-500">
                Current assigned trip
              </p>

            </div>

          </div>


          {!activeTrip ? (

            <div className="py-10 text-center">

              <FaRoute className="mx-auto text-4xl text-slate-700 mb-4" />

              <p className="text-slate-400">
                No active trip
              </p>

              <p className="text-slate-600 text-sm mt-2">
                You currently have no ongoing trip.
              </p>

            </div>

          ) : (

            <div className="space-y-5">


              <div className="flex justify-between">

                <span className="text-slate-500">
                  Trip
                </span>

                <span className="text-white font-semibold">
                  #{activeTrip.id}
                </span>

              </div>


              <div className="flex items-start gap-3">

                <FaMapMarkerAlt className="text-emerald-400 mt-1" />

                <div>

                  <p className="text-xs text-slate-500">
                    Pickup
                  </p>

                  <p className="text-white mt-1">
                    {activeTrip.start_location}
                  </p>

                </div>

              </div>


              <div className="flex items-start gap-3">

                <FaFlagCheckered className="text-red-400 mt-1" />

                <div>

                  <p className="text-xs text-slate-500">
                    Destination
                  </p>

                  <p className="text-white mt-1">
                    {activeTrip.end_location}
                  </p>

                </div>

              </div>


              <div className="flex justify-between border-t border-slate-800 pt-4">

                <span className="text-slate-500">
                  Status
                </span>

                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
                  {activeTrip.status}
                </span>

              </div>

            </div>

          )}

        </div>


        {/* ASSIGNED VEHICLE */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <FaTruck />
            </div>

            <div>

              <h2 className="text-lg font-semibold text-white">
                Assigned Vehicle
              </h2>

              <p className="text-sm text-slate-500">
                Your current vehicle
              </p>

            </div>

          </div>


          {!vehicle ? (

            <div className="py-10 text-center">

              <FaTruck className="mx-auto text-4xl text-slate-700 mb-4" />

              <p className="text-slate-400">
                No vehicle assigned
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-2 gap-5">


              <div>

                <p className="text-xs text-slate-500">
                  Registration
                </p>

                <p className="text-white font-semibold mt-1">
                  {vehicle.vehicle_number}
                </p>

              </div>


              <div>

                <p className="text-xs text-slate-500">
                  Type
                </p>

                <p className="text-white font-semibold mt-1">
                  {vehicle.vehicle_type}
                </p>

              </div>


              <div>

                <p className="text-xs text-slate-500">
                  Manufacturer
                </p>

                <p className="text-white font-semibold mt-1">
                  {vehicle.manufacturer}
                </p>

              </div>


              <div>

                <p className="text-xs text-slate-500">
                  Model
                </p>

                <p className="text-white font-semibold mt-1">
                  {vehicle.model}
                </p>

              </div>


              <div>

                <p className="text-xs text-slate-500">
                  Fuel Type
                </p>

                <p className="text-white font-semibold mt-1">
                  {vehicle.fuel_type}
                </p>

              </div>


              <div>

                <p className="text-xs text-slate-500">
                  Status
                </p>

                <p className="text-white font-semibold mt-1">
                  {vehicle.status}
                </p>

              </div>

            </div>

          )}

        </div>

      </div>


      {/* =====================================================
          TRIP HISTORY
      ===================================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-8">

        <div className="p-6 border-b border-slate-800">

          <h2 className="text-lg font-semibold text-white">
            My Trip History
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Your completed, cancelled and current trips.
          </p>

        </div>


        {history.length === 0 ? (

          <div className="p-10 text-center text-slate-500">
            No trip history available.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] text-sm">

              <thead className="bg-slate-800/60">

                <tr>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Trip
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Route
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Shipment
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-800">

                {history.map((trip) => (

                  <tr
                    key={trip.id}
                    className="hover:bg-slate-800/30"
                  >

                    <td className="px-5 py-4 text-white font-semibold">
                      #{trip.id}
                    </td>

                    <td className="px-5 py-4">

                      <div className="text-slate-200">
                        {trip.start_location}
                      </div>

                      <div className="text-slate-600 text-xs my-1">
                        ↓
                      </div>

                      <div className="text-slate-400">
                        {trip.end_location}
                      </div>

                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {trip.shipment?.tracking_number ||
                        `Shipment #${trip.shipment_id}`}
                    </td>

                    <td className="px-5 py-4">

                      <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs">
                        {trip.status}
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =====================================================
          MY SHIPMENTS
      ===================================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

        <div className="p-6 border-b border-slate-800">

          <h2 className="text-lg font-semibold text-white">
            My Shipments
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Shipments assigned to you.
          </p>

        </div>


        {shipments.length === 0 ? (

          <div className="p-10 text-center text-slate-500">
            No shipments assigned.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] text-sm">

              <thead className="bg-slate-800/60">

                <tr>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Tracking
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Receiver
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Pickup
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Destination
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-800">

                {shipments.map((shipment) => (

                  <tr
                    key={shipment.id}
                    className="hover:bg-slate-800/30"
                  >

                    <td className="px-5 py-4 text-cyan-400 font-semibold">
                      {shipment.tracking_number}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {shipment.receiver_name}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {shipment.pickup_location}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {shipment.delivery_location}
                    </td>

                    <td className="px-5 py-4">

                      <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">
                        {shipment.status}
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}


export default DriverDashboard;