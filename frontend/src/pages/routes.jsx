import { useEffect, useState } from "react";

import {
  FaRoute,
  FaMapMarkerAlt,
  FaFlagCheckered,
  FaClock,
  FaRoad,
  FaSyncAlt,
  FaTruck,
  FaCircle,
  FaCheckCircle,
} from "react-icons/fa";

import {
  getTrips,
  getTripRoute,
} from "../services/tripService";

import LiveTrackingMap from "../components/LiveTrackingMap";

function RoutesPage() {
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState("");

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [route, setRoute] = useState(null);

  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // LOAD TRIPS
  // ==========================================

  useEffect(() => {
    const loadTrips = async () => {
      try {
        setLoadingTrips(true);
        setError("");

        const data = await getTrips();

        setTrips(data);

        if (data.length > 0) {
          setSelectedTripId(String(data[0].id));
          setSelectedTrip(data[0]);
        }
      } catch (err) {
        console.error("Failed to load trips:", err);

        setError(
          "Unable to load trips. Please try again."
        );
      } finally {
        setLoadingTrips(false);
      }
    };

    loadTrips();
  }, []);

  // ==========================================
  // LOAD ROUTE
  // ==========================================

  const loadRoute = async (tripId) => {
    if (!tripId) {
      return;
    }

    try {
      setLoadingRoute(true);
      setError("");

      const trip = trips.find(
        (item) =>
          String(item.id) === String(tripId)
      );

      setSelectedTrip(trip || null);

      const routeData =
        await getTripRoute(tripId);

      setRoute(routeData);
    } catch (err) {
      console.error(
        "Failed to load route:",
        err
      );

      setRoute(null);

      setError(
        "Unable to calculate route information."
      );
    } finally {
      setLoadingRoute(false);
    }
  };

  // ==========================================
  // HANDLE TRIP SELECTION
  // ==========================================

  const handleTripChange = async (event) => {
    const tripId = event.target.value;

    setSelectedTripId(tripId);

    await loadRoute(tripId);
  };

  // ==========================================
  // INITIAL ROUTE LOAD
  // ==========================================

  useEffect(() => {
    if (
      selectedTripId &&
      trips.length > 0 &&
      !route
    ) {
      loadRoute(selectedTripId);
    }
  }, [selectedTripId, trips]);

  // ==========================================
  // RECALCULATE ROUTE
  // ==========================================

  const handleRecalculate = async () => {
    if (!selectedTripId) {
      return;
    }

    await loadRoute(selectedTripId);
  };

  // ==========================================
  // STATUS LABEL
  // ==========================================

  const getStatusLabel = (status) => {
    if (!status) {
      return "Unknown";
    }

    return status
      .replace("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  return (
    <div className="min-h-full bg-slate-950 text-white p-6">

      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <div
        className={`
          flex
          flex-col
          md:flex-row
          md:items-center
          md:justify-between
          gap-4
          mb-6
        `}
      >
        <div>
          <div
            className={`
              flex
              items-center
              gap-3
            `}
          >
            <div
              className={`
                p-3
                rounded-xl
                bg-blue-600/20
                border
                border-blue-500/20
              `}
            >
              <FaRoute
                className={`
                  text-blue-400
                  text-xl
                `}
              />
            </div>

            <div>
              <h1
                className={`
                  text-2xl
                  font-bold
                `}
              >
                Route Planning
              </h1>

              <p
                className={`
                  text-slate-400
                  text-sm
                  mt-1
                `}
              >
                Generate and monitor optimized trip
                routes, distance and travel time.
              </p>
            </div>
          </div>
        </div>

        {/* STATUS */}

        <div
          className={`
            flex
            items-center
            gap-2
            px-4
            py-2
            rounded-full
            bg-emerald-500/10
            border
            border-emerald-500/20
          `}
        >
          <FaCircle
            className={`
              text-emerald-400
              text-xs
            `}
          />

          <span
            className={`
              text-emerald-400
              text-sm
              font-medium
            `}
          >
            Route System Active
          </span>
        </div>
      </div>

      {/* ====================================== */}
      {/* ERROR */}
      {/* ====================================== */}

      {error && (
        <div
          className={`
            mb-6
            px-4
            py-3
            rounded-xl
            bg-red-500/10
            border
            border-red-500/20
            text-red-400
            text-sm
          `}
        >
          {error}
        </div>
      )}

      {/* ====================================== */}
      {/* TRIP SELECTOR */}
      {/* ====================================== */}

      <div
        className={`
          bg-slate-900
          border
          border-slate-800
          rounded-2xl
          p-5
          mb-6
          shadow-lg
        `}
      >
        <div
          className={`
            flex
            flex-col
            md:flex-row
            md:items-end
            gap-4
          `}
        >
          <div className="flex-1">
            <label
              className={`
                block
                text-sm
                font-medium
                text-slate-300
                mb-2
              `}
            >
              Select Trip
            </label>

            <select
              value={selectedTripId}
              onChange={handleTripChange}
              disabled={
                loadingTrips ||
                trips.length === 0
              }
              className={`
                w-full
                bg-slate-800
                border
                border-slate-700
                text-white
                rounded-xl
                px-4
                py-3
                outline-none
                focus:border-blue-500
              `}
            >
              {trips.length === 0 ? (
                <option value="">
                  No trips available
                </option>
              ) : (
                trips.map((trip) => (
                  <option
                    key={trip.id}
                    value={trip.id}
                  >
                    Trip #{trip.id} —{" "}
                    {trip.start_location}
                    {" → "}
                    {trip.end_location}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={handleRecalculate}
            disabled={
              !selectedTripId ||
              loadingRoute
            }
            className={`
              flex
              items-center
              justify-center
              gap-2
              px-5
              py-3
              rounded-xl
              bg-blue-600
              hover:bg-blue-700
              disabled:opacity-50
              disabled:cursor-not-allowed
              font-medium
              transition
            `}
          >
            <FaSyncAlt
              className={
                loadingRoute
                  ? "animate-spin"
                  : ""
              }
            />

            {loadingRoute
              ? "Calculating..."
              : "Recalculate Route"}
          </button>
        </div>
      </div>

      {/* ====================================== */}
      {/* ROUTE CONTENT */}
      {/* ====================================== */}

      {selectedTrip && route && !loadingRoute && (
        <>
          {/* ROUTE SUMMARY CARDS */}

          <div
            className={`
              grid
              grid-cols-1
              md:grid-cols-2
              lg:grid-cols-4
              gap-4
              mb-6
            `}
          >
            {/* Distance */}

            <div
              className={`
                bg-slate-900
                border
                border-slate-800
                rounded-2xl
                p-5
              `}
            >
              <div
                className={`
                  flex
                  items-center
                  gap-3
                  mb-3
                `}
              >
                <div
                  className={`
                    p-2
                    rounded-lg
                    bg-blue-500/10
                  `}
                >
                  <FaRoad
                    className={`
                      text-blue-400
                    `}
                  />
                </div>

                <span
                  className={`
                    text-slate-400
                    text-sm
                  `}
                >
                  Distance
                </span>
              </div>

              <p
                className={`
                  text-2xl
                  font-bold
                `}
              >
                {route.distance || "N/A"}
              </p>
            </div>

            {/* Travel Time */}

            <div
              className={`
                bg-slate-900
                border
                border-slate-800
                rounded-2xl
                p-5
              `}
            >
              <div
                className={`
                  flex
                  items-center
                  gap-3
                  mb-3
                `}
              >
                <div
                  className={`
                    p-2
                    rounded-lg
                    bg-purple-500/10
                  `}
                >
                  <FaClock
                    className={`
                      text-purple-400
                    `}
                  />
                </div>

                <span
                  className={`
                    text-slate-400
                    text-sm
                  `}
                >
                  Estimated Travel Time
                </span>
              </div>

              <p
                className={`
                  text-2xl
                  font-bold
                `}
              >
                {route.estimated_travel_time ||
                  "N/A"}
              </p>
            </div>

            {/* Route Status */}

            <div
              className={`
                bg-slate-900
                border
                border-slate-800
                rounded-2xl
                p-5
              `}
            >
              <div
                className={`
                  flex
                  items-center
                  gap-3
                  mb-3
                `}
              >
                <div
                  className={`
                    p-2
                    rounded-lg
                    bg-emerald-500/10
                  `}
                >
                  <FaCheckCircle
                    className={`
                      text-emerald-400
                    `}
                  />
                </div>

                <span
                  className={`
                    text-slate-400
                    text-sm
                  `}
                >
                  Trip Status
                </span>
              </div>

              <p
                className={`
                  text-2xl
                  font-bold
                `}
              >
                {getStatusLabel(
                  selectedTrip.status
                )}
              </p>
            </div>

            {/* Vehicle */}

            <div
              className={`
                bg-slate-900
                border
                border-slate-800
                rounded-2xl
                p-5
              `}
            >
              <div
                className={`
                  flex
                  items-center
                  gap-3
                  mb-3
                `}
              >
                <div
                  className={`
                    p-2
                    rounded-lg
                    bg-orange-500/10
                  `}
                >
                  <FaTruck
                    className={`
                      text-orange-400
                    `}
                  />
                </div>

                <span
                  className={`
                    text-slate-400
                    text-sm
                  `}
                >
                  Vehicle
                </span>
              </div>

              <p
                className={`
                  text-2xl
                  font-bold
                `}
              >
                #{selectedTrip.vehicle_id}
              </p>
            </div>
          </div>

          {/* ================================= */}
          {/* ROUTE DETAILS + MAP */}
          {/* ================================= */}

          <div
            className={`
              grid
              grid-cols-1
              lg:grid-cols-3
              gap-6
            `}
          >
            {/* Route Information */}

            <div
              className={`
                bg-slate-900
                border
                border-slate-800
                rounded-2xl
                p-6
              `}
            >
              <h2
                className={`
                  text-lg
                  font-semibold
                  mb-6
                `}
              >
                Route Details
              </h2>

              {/* Pickup */}

              <div
                className={`
                  flex
                  gap-4
                  mb-6
                `}
              >
                <div
                  className={`
                    flex
                    flex-col
                    items-center
                  `}
                >
                  <div
                    className={`
                      w-10
                      h-10
                      rounded-full
                      bg-emerald-500/10
                      flex
                      items-center
                      justify-center
                    `}
                  >
                    <FaMapMarkerAlt
                      className={`
                        text-emerald-400
                      `}
                    />
                  </div>

                  <div
                    className={`
                      w-px
                      h-12
                      bg-slate-700
                      mt-2
                    `}
                  />
                </div>

                <div>
                  <p
                    className={`
                      text-xs
                      uppercase
                      tracking-wide
                      text-slate-500
                    `}
                  >
                    Pickup
                  </p>

                  <p
                    className={`
                      text-white
                      font-medium
                      mt-1
                    `}
                  >
                    {route.pickup_location}
                  </p>
                </div>
              </div>

              {/* Destination */}

              <div
                className={`
                  flex
                  gap-4
                  mb-6
                `}
              >
                <div
                  className={`
                    w-10
                    h-10
                    rounded-full
                    bg-red-500/10
                    flex
                    items-center
                    justify-center
                  `}
                >
                  <FaFlagCheckered
                    className={`
                      text-red-400
                    `}
                  />
                </div>

                <div>
                  <p
                    className={`
                      text-xs
                      uppercase
                      tracking-wide
                      text-slate-500
                    `}
                  >
                    Destination
                  </p>

                  <p
                    className={`
                      text-white
                      font-medium
                      mt-1
                    `}
                  >
                    {route.destination}
                  </p>
                </div>
              </div>

              {/* Route Summary */}

              <div
                className={`
                  border-t
                  border-slate-800
                  pt-5
                `}
              >
                <p
                  className={`
                    text-xs
                    uppercase
                    tracking-wide
                    text-slate-500
                    mb-2
                  `}
                >
                  Route Summary
                </p>

                <p
                  className={`
                    text-slate-300
                    text-sm
                    leading-6
                  `}
                >
                  {route.route_summary ||
                    "No route summary available."}
                </p>
              </div>
            </div>

            {/* Map */}

            <div
              className={`
                lg:col-span-2
                bg-slate-900
                border
                border-slate-800
                rounded-2xl
                p-3
                min-h-[500px]
              `}
            >
              {route.polyline ? (
                <LiveTrackingMap
                  polyline={route.polyline}
                  pickupLocation={
                    route.pickup_location
                  }
                  destination={
                    route.destination
                  }
                />
              ) : (
                <div
                  className={`
                    h-full
                    min-h-[480px]
                    flex
                    items-center
                    justify-center
                    text-slate-500
                  `}
                >
                  Route map is not available.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ====================================== */}
      {/* LOADING */}
      {/* ====================================== */}

      {(loadingTrips || loadingRoute) && (
        <div
          className={`
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            min-h-[400px]
            flex
            items-center
            justify-center
          `}
        >
          <div
            className={`
              text-center
            `}
          >
            <FaSyncAlt
              className={`
                text-blue-400
                text-2xl
                animate-spin
                mx-auto
                mb-4
              `}
            />

            <p
              className={`
                text-slate-400
              `}
            >
              Loading route information...
            </p>
          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* NO TRIPS */}
      {/* ====================================== */}

      {!loadingTrips &&
        trips.length === 0 && (
          <div
            className={`
              bg-slate-900
              border
              border-slate-800
              rounded-2xl
              min-h-[400px]
              flex
              items-center
              justify-center
            `}
          >
            <div
              className={`
                text-center
                px-6
              `}
            >
              <FaRoute
                className={`
                  text-slate-600
                  text-4xl
                  mx-auto
                  mb-4
                `}
              />

              <h2
                className={`
                  text-lg
                  font-semibold
                  text-slate-300
                `}
              >
                No Trips Available
              </h2>

              <p
                className={`
                  text-slate-500
                  text-sm
                  mt-2
                `}
              >
                Create a trip first to generate
                and monitor its route.
              </p>
            </div>
          </div>
        )}
    </div>
  );
}

export default RoutesPage;