import { useEffect, useState } from "react";
import {
  FaRoute,
  FaMapMarkerAlt,
  FaFlagCheckered,
  FaTruck,
} from "react-icons/fa";

import LiveTrackingMap from "../components/LiveTrackingMap";

import {
  getDriverDashboard,
} from "../services/driverDashboardService";


function DriverLiveTracking() {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {

    const loadData = async () => {

      try {

        setLoading(true);

        const result =
          await getDriverDashboard();

        setData(result);

      } catch (err) {

        console.error(err);

        setError(
          err.response?.data?.detail ||
          "Failed to load live tracking."
        );

      } finally {

        setLoading(false);

      }

    };

    loadData();

  }, []);


  if (loading) {

    return (
      <div className="min-h-full bg-slate-950 text-white flex items-center justify-center">
        Loading live tracking...
      </div>
    );

  }


  if (error) {

    return (
      <div className="min-h-full bg-slate-950 p-6">

        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-5">
          {error}
        </div>

      </div>
    );

  }


  const trip = data?.active_trip;
  const vehicle = data?.assigned_vehicle;
  const route = trip?.route;


  if (!trip) {

    return (
      <div className="min-h-full bg-slate-950 text-slate-100 p-6">

        <div className="mb-8">

          <h1 className="text-3xl font-bold">
            Driver Live Tracking
          </h1>

          <p className="text-slate-400 mt-2">
            Only your current trip is displayed here.
          </p>

        </div>


        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">

          <FaRoute className="mx-auto text-5xl text-slate-700 mb-5" />

          <h2 className="text-xl font-semibold text-white">
            No Active Trip
          </h2>

          <p className="text-slate-500 mt-2">
            You do not currently have an ongoing trip.
          </p>

        </div>

      </div>
    );

  }


  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-6">


      <div className="mb-8">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <FaRoute />
          </div>

          <div>

            <h1 className="text-3xl font-bold">
              Driver Live Tracking
            </h1>

            <p className="text-slate-400 mt-1">
              Tracking your current trip only.
            </p>

          </div>

        </div>

      </div>


      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">


        {/* ===================================================
            TRIP INFORMATION
        =================================================== */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FaRoute />
            </div>

            <div>

              <h2 className="font-semibold text-white">
                Current Trip #{trip.id}
              </h2>

              <p className="text-xs text-slate-500">
                {trip.status}
              </p>

            </div>

          </div>


          <div className="space-y-6">


            <div className="flex gap-3">

              <FaMapMarkerAlt className="text-emerald-400 mt-1" />

              <div>

                <p className="text-xs text-slate-500 uppercase">
                  Pickup
                </p>

                <p className="text-white mt-1">
                  {trip.start_location}
                </p>

              </div>

            </div>


            <div className="flex gap-3">

              <FaFlagCheckered className="text-red-400 mt-1" />

              <div>

                <p className="text-xs text-slate-500 uppercase">
                  Destination
                </p>

                <p className="text-white mt-1">
                  {trip.end_location}
                </p>

              </div>

            </div>


            <div className="border-t border-slate-800 pt-5">

              <div className="flex items-center gap-3">

                <FaTruck className="text-blue-400" />

                <div>

                  <p className="text-xs text-slate-500">
                    Vehicle
                  </p>

                  <p className="text-white font-semibold">
                    {vehicle?.vehicle_number || "Not assigned"}
                  </p>

                </div>

              </div>

            </div>


            {route && (

              <div className="border-t border-slate-800 pt-5 space-y-4">

                <div className="flex justify-between">

                  <span className="text-slate-500">
                    Distance
                  </span>

                  <span className="text-white">
                    {route.distance}
                  </span>

                </div>


                <div className="flex justify-between">

                  <span className="text-slate-500">
                    Travel Time
                  </span>

                  <span className="text-white">
                    {route.estimated_travel_time}
                  </span>

                </div>


                <div className="flex justify-between">

                  <span className="text-slate-500">
                    ETA
                  </span>

                  <span className="text-emerald-400">
                    {route.eta || "Not available"}
                  </span>

                </div>

              </div>

            )}

          </div>

        </div>


        {/* ===================================================
            MAP
        =================================================== */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 min-h-[600px]">

          {route?.polyline ? (

            <LiveTrackingMap
              tripId={trip.id}
              polyline={route.polyline}
              pickupLocation={trip.start_location}
              destination={trip.end_location}
            />

          ) : (

            <div className="h-full min-h-[560px] flex items-center justify-center text-center">

              <div>

                <FaRoute className="mx-auto text-5xl text-slate-700 mb-5" />

                <p className="text-slate-400">
                  Route information is not available.
                </p>

                <p className="text-slate-600 text-sm mt-2">
                  The current trip does not have valid route coordinates.
                </p>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}


export default DriverLiveTracking;