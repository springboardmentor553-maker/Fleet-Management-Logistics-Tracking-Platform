import { useEffect, useState } from "react";
import api from "../services/api";

function RecentTrips() {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const res = await api.get("/dashboard/fleet");

      setTrips(res.data.recent_trips || []);
    } catch (err) {
      console.log("Recent Trips Error:", err);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">

      {/* Heading */}
      <h2 className="text-2xl font-bold text-white mb-5">
        Recent Trips
      </h2>

      {/* Table */}
      <div className="overflow-x-auto">

        <table className="w-full">

          <thead>
            <tr className="bg-blue-700/80 text-white">

              <th className="p-3 text-left rounded-tl-lg">
                Trip
              </th>

              <th className="p-3 text-left">
                Driver
              </th>

              <th className="p-3 text-left">
                Vehicle
              </th>

              <th className="p-3 text-left rounded-tr-lg">
                Status
              </th>

            </tr>
          </thead>

          <tbody>

            {trips.length > 0 ? (

              trips.map((trip) => {

                const tripId = trip.id ?? trip.trip_id;
                const status = trip.trip_status ?? trip.status;

                return (
                  <tr
                    key={tripId}
                    className="border-b border-slate-700 hover:bg-slate-800/70 transition"
                  >

                    {/* Trip ID */}
                    <td className="p-4 text-slate-200 font-medium">
                      {tripId}
                    </td>

                    {/* Driver */}
                    <td className="p-4 text-slate-300">
                      {trip.driver_id ?? "N/A"}
                    </td>

                    {/* Vehicle */}
                    <td className="p-4 text-slate-300">
                      {trip.vehicle_id ?? "N/A"}
                    </td>

                    {/* Status */}
                    <td className="p-4">

                      <span
                        className={`
                          px-3 py-1 rounded-full text-xs font-semibold
                          ${
                            status === "Completed"
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : status === "In Progress"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : status === "Cancelled"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-slate-700/70 text-slate-300 border border-slate-600"
                          }
                        `}
                      >
                        {status || "N/A"}
                      </span>

                    </td>

                  </tr>
                );
              })

            ) : (

              <tr>

                <td
                  colSpan="4"
                  className="text-center p-8 text-slate-500"
                >
                  No recent trips found
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default RecentTrips;