import { useState } from "react";
import { useNavigate } from "react-router-dom";

import RouteMap from "../components/RouteMap";
import api from "../api/api";

function RoutePlanner() {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [routeData, setRouteData] = useState(null);
  const [matchingTrip, setMatchingTrip] = useState(null);

  // =====================================================
  // NORMALIZE TEXT
  // =====================================================

  const normalize = (value) => {
    if (!value) {
      return "";
    }

    return value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  };

  // =====================================================
  // SEARCH ROUTE / EXISTING TRIP
  // =====================================================

  const searchRoute = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");
    setRouteData(null);
    setMatchingTrip(null);

    // -----------------------------------------------------
    // Validate pickup
    // -----------------------------------------------------

    if (!pickup.trim()) {
      setMessage("Please enter pickup address.");
      setMessageType("danger");
      return;
    }

    // -----------------------------------------------------
    // Validate destination
    // -----------------------------------------------------

    if (!destination.trim()) {
      setMessage("Please enter destination address.");
      setMessageType("danger");
      return;
    }

    try {
      setLoading(true);

      // ===================================================
      // STEP 1: CHECK PICKUP ADDRESS
      // ===================================================

      let pickupResponse;

      try {
        pickupResponse = await api.get(
          "/routes/geocode",
          {
            params: {
              location: pickup.trim(),
            },
          }
        );
      } catch (error) {
        console.error(
          "Pickup geocoding error:",
          error
        );

        setMessage(
          `Pickup address "${pickup}" not found.`
        );

        setMessageType("danger");
        return;
      }

      if (
        !pickupResponse.data ||
        pickupResponse.data.latitude === undefined ||
        pickupResponse.data.longitude === undefined
      ) {
        setMessage(
          `Pickup address "${pickup}" not found.`
        );

        setMessageType("danger");
        return;
      }

      console.log(
        "Pickup coordinates:",
        pickupResponse.data
      );

      // ===================================================
      // STEP 2: CHECK DESTINATION ADDRESS
      // ===================================================

      let destinationResponse;

      try {
        destinationResponse = await api.get(
          "/routes/geocode",
          {
            params: {
              location: destination.trim(),
            },
          }
        );
      } catch (error) {
        console.error(
          "Destination geocoding error:",
          error
        );

        setMessage(
          `Destination address "${destination}" not found.`
        );

        setMessageType("danger");
        return;
      }

      if (
        !destinationResponse.data ||
        destinationResponse.data.latitude === undefined ||
        destinationResponse.data.longitude === undefined
      ) {
        setMessage(
          `Destination address "${destination}" not found.`
        );

        setMessageType("danger");
        return;
      }

      console.log(
        "Destination coordinates:",
        destinationResponse.data
      );

      // ===================================================
      // STEP 3: GET EXISTING TRIPS
      // ===================================================

      let tripsResponse;

      try {
        tripsResponse = await api.get("/trips");
      } catch (error) {
        console.error(
          "Trips API error:",
          error
        );

        setMessage(
          "Unable to load existing trips."
        );

        setMessageType("danger");
        return;
      }

      const trips = Array.isArray(
        tripsResponse.data
      )
        ? tripsResponse.data
        : [];

      console.log(
        "Existing trips:",
        trips
      );

      // ===================================================
      // STEP 4: FIND MATCHING TRIP
      // ===================================================

      const pickupText =
        normalize(pickup);

      const destinationText =
        normalize(destination);

      const matching = trips.find(
        (trip) => {

          const tripPickup =
            normalize(
              trip.pickup_location
            );

          const tripDestination =
            normalize(
              trip.destination
            );

          return (
            tripPickup === pickupText &&
            tripDestination ===
              destinationText
          );
        }
      );

      // ===================================================
      // STEP 5: NO TRIP FOUND
      // ===================================================

      if (!matching) {
        setMessage(
          `No trip found from "${pickup}" to "${destination}".`
        );

        setMessageType("warning");
        return;
      }

      console.log(
        "Matching trip:",
        matching
      );

      setMatchingTrip(
        matching
      );

      // ===================================================
      // STEP 6: GET EXISTING ROUTE
      // ===================================================

      let routeResponse;

      try {
        routeResponse = await api.get(
          `/trips/${matching.id}/route`
        );
      } catch (error) {
        console.error(
          "Route API error:",
          error
        );

        setMessage(
          "Trip was found, but route information could not be loaded."
        );

        setMessageType("danger");
        return;
      }

      const route =
        routeResponse.data;

      console.log(
        "Route API response:",
        route
      );

      // ===================================================
      // STEP 7: CHECK ROUTE DATA
      // ===================================================

      if (!route) {
        setMessage(
          "Route information is not available for this trip."
        );

        setMessageType("warning");
        return;
      }

      // ===================================================
// STEP 8: PICKUP COORDINATES
// ===================================================

const pickupCoordinates =
  route.pickup_coordinates &&
  typeof route.pickup_coordinates === "object"
    ? route.pickup_coordinates
    : {
        latitude:
          matching.pickup_latitude ??
          pickupResponse.data.latitude,

        longitude:
          matching.pickup_longitude ??
          pickupResponse.data.longitude,
      };


// ===================================================
// STEP 9: DESTINATION COORDINATES
// ===================================================

const destinationCoordinates =
  route.destination_coordinates &&
  typeof route.destination_coordinates === "object"
    ? route.destination_coordinates
    : {
        latitude:
          matching.destination_latitude ??
          destinationResponse.data.latitude,

        longitude:
          matching.destination_longitude ??
          destinationResponse.data.longitude,
      };

      // ===================================================
      // STEP 10: VEHICLE COORDINATES
      // ===================================================

      const vehicleCoordinates =
        route.vehicle_coordinates ||
        route.current_coordinates ||
        route.current_location ||
        pickupCoordinates;

      // ===================================================
      // STEP 11: CONVERT COORDINATES TO NUMBERS
      // ===================================================

      const pickupLat = Number(
        pickupCoordinates?.latitude
      );

      const pickupLng = Number(
        pickupCoordinates?.longitude
      );

      const destinationLat = Number(
        destinationCoordinates?.latitude
      );

      const destinationLng = Number(
        destinationCoordinates?.longitude
      );

      const vehicleLat = Number(
        vehicleCoordinates?.latitude
      );

      const vehicleLng = Number(
        vehicleCoordinates?.longitude
      );

      // ===================================================
      // STEP 12: VALIDATE COORDINATES
      // ===================================================

      const validPickup =
        Number.isFinite(pickupLat) &&
        Number.isFinite(pickupLng);

      const validDestination =
        Number.isFinite(destinationLat) &&
        Number.isFinite(destinationLng);

      const validVehicle =
        Number.isFinite(vehicleLat) &&
        Number.isFinite(vehicleLng);

      if (
        !validPickup ||
        !validDestination
      ) {
        console.error(
          "Invalid coordinates:",
          {
            pickupCoordinates,
            destinationCoordinates,
          }
        );

        setMessage(
          "Trip found, but pickup or destination coordinates are invalid."
        );

        setMessageType("danger");
        return;
      }

      // ===================================================
      // STEP 13: PREPARE ROUTE DATA
      // ===================================================

      const preparedRouteData = {
        ...route,

        pickup: {
          latitude: pickupLat,
          longitude: pickupLng,
        },

        destination: {
          latitude: destinationLat,
          longitude: destinationLng,
        },

        vehicle_coordinates:
          validVehicle
            ? {
                latitude:
                  vehicleLat,
                longitude:
                  vehicleLng,
              }
            : {
                latitude:
                  pickupLat,
                longitude:
                  pickupLng,
              },

        current_index:
          route.current_index ??
          0,

        total_points:
          route.total_points ??
          route.geometry?.coordinates
            ?.length ??
          0,
      };

      // ===================================================
      // DEBUG
      // ===================================================

      console.log(
        "======================================"
      );

      console.log(
        "FINAL ROUTE DATA:",
        preparedRouteData
      );

      console.log(
        "DISTANCE:",
        preparedRouteData.distance_km
      );

      console.log(
        "BACKEND ETA:",
        preparedRouteData.estimated_time_minutes
      );

      console.log(
        "TRIP START:",
        matching.scheduled_start_time
      );

      console.log(
        "TRIP END:",
        matching.scheduled_end_time
      );

      console.log(
        "TRIP STATUS:",
        matching.trip_status
      );

      console.log(
        "======================================"
      );

      // ===================================================
      // STEP 14: SAVE ROUTE DATA
      // ===================================================

      setRouteData(
        preparedRouteData
      );

      setMessage(
        "Trip found successfully."
      );

      setMessageType("success");

    } catch (error) {
      console.error(
        "Route search error:",
        error
      );

      const detail =
        error.response?.data?.detail;

      setMessage(
        detail ||
        "Unable to search for the route."
      );

      setMessageType("danger");

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // START TRACKING
  // =====================================================

  const startTracking = () => {

    if (!matchingTrip) {
      setMessage(
        "No trip selected for tracking."
      );

      setMessageType(
        "warning"
      );

      return;
    }

    navigate(
      `/tracking/${matchingTrip.id}`
    );
  };

  // =====================================================
  // CLEAR SEARCH
  // =====================================================

  const clearSearch = () => {

    setPickup("");
    setDestination("");

    setMessage("");
    setMessageType("");

    setRouteData(null);
    setMatchingTrip(null);
  };

  // =====================================================
  // CALCULATE ETA FROM TRIP SCHEDULE
  // =====================================================

  const calculateScheduledETA = (
    trip
  ) => {

    if (!trip) {
      return null;
    }

    if (
      !trip.scheduled_start_time ||
      !trip.scheduled_end_time
    ) {
      return null;
    }

    const startTime =
      new Date(
        trip.scheduled_start_time
      );

    const endTime =
      new Date(
        trip.scheduled_end_time
      );

    // ---------------------------------------------------
    // INVALID DATE
    // ---------------------------------------------------

    if (
      Number.isNaN(
        startTime.getTime()
      ) ||
      Number.isNaN(
        endTime.getTime()
      )
    ) {

      console.error(
        "Invalid trip schedule:",
        {
          scheduled_start_time:
            trip.scheduled_start_time,

          scheduled_end_time:
            trip.scheduled_end_time,
        }
      );

      return null;
    }

    // ---------------------------------------------------
    // STATUS
    // ---------------------------------------------------

    const status =
      trip.trip_status
        ?.toString()
        .trim()
        .toLowerCase();

    // ---------------------------------------------------
    // SCHEDULED / PENDING
    //
    // Complete scheduled duration
    // ---------------------------------------------------

    if (
      status === "scheduled" ||
      status === "pending"
    ) {

      const duration =
        (endTime - startTime) /
        60000;

      return Math.max(
        0,
        duration
      );
    }

    // ---------------------------------------------------
    // STARTED / IN TRANSIT
    //
    // Remaining time until scheduled end
    // ---------------------------------------------------

    if (
      status === "started" ||
      status === "in transit"
    ) {

      const now =
        new Date();

      const remaining =
        (endTime - now) /
        60000;

      return Math.max(
        0,
        remaining
      );
    }

    // ---------------------------------------------------
    // COMPLETED
    // ---------------------------------------------------

    if (
      status === "completed"
    ) {
      return 0;
    }

    // ---------------------------------------------------
    // DEFAULT
    // ---------------------------------------------------

    const duration =
      (endTime - startTime) /
      60000;

    return Math.max(
      0,
      duration
    );
  };

  // =====================================================
  // FORMAT ETA
  // =====================================================

  const formatETA = (
    minutes
  ) => {

    if (
      minutes === undefined ||
      minutes === null ||
      minutes === ""
    ) {
      return "N/A";
    }

    const totalMinutes =
      Number(minutes);

    if (
      Number.isNaN(
        totalMinutes
      ) ||
      totalMinutes < 0
    ) {
      return "N/A";
    }

    const roundedMinutes =
      Math.round(
        totalMinutes
      );

    const hours =
      Math.floor(
        roundedMinutes / 60
      );

    const mins =
      roundedMinutes % 60;

    if (hours === 0) {
      return `${mins} min`;
    }

    if (mins === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${mins} min`;
  };

  // =====================================================
  // DISTANCE
  // =====================================================

  const distance =
    routeData?.distance_km ??
    routeData?.distance ??
    routeData?.total_distance_km ??
    routeData?.route?.distance_km ??
    null;

  // =====================================================
  // ETA
  // =====================================================

  const eta =
    calculateScheduledETA(
      matchingTrip
    );

  // =====================================================
  // CURRENT STATUS
  // =====================================================

  const currentStatus =
    matchingTrip?.trip_status ||
    routeData?.trip_status ||
    routeData?.status ||
    "Scheduled";

  // =====================================================
  // STATUS STYLE
  // =====================================================

  const getStatusClass = () => {

    const status =
      currentStatus
        ?.toString()
        .toLowerCase();

    if (
      status.includes(
        "completed"
      )
    ) {
      return "bg-success";
    }

    if (
      status.includes(
        "transit"
      )
    ) {
      return "bg-warning text-dark";
    }

    if (
      status.includes(
        "cancel"
      )
    ) {
      return "bg-danger";
    }

    if (
      status.includes(
        "pending"
      )
    ) {
      return "bg-warning text-dark";
    }

    if (
      status.includes(
        "started"
      )
    ) {
      return "bg-primary";
    }

    return "bg-secondary";
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (

    <main
      className="route-planner-page"
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
      }}
    >

      <div
        className="container-fluid py-4 px-4"
      >

        {/* ============================================
            PAGE TITLE
        ============================================ */}

        <div className="mb-4">

          <h2 className="fw-bold">
            🗺️ Route Planner
          </h2>

          <p className="text-muted">
            Find an existing trip and view
            its route, distance, estimated
            time and current status.
          </p>

        </div>


        {/* ============================================
            FIND YOUR TRIP
        ============================================ */}

        <div className="card shadow border-0">

          <div className="card-body p-4">

            <h4 className="fw-bold mb-4">
              📍 Find Your Trip
            </h4>

            <form
              onSubmit={
                searchRoute
              }
            >

              <div className="row">

                {/* PICKUP */}

                <div className="col-md-5 mb-3">

                  <label className="form-label fw-semibold">
                    Pickup Address
                  </label>

                  <div className="input-group">

                    <span className="input-group-text">
                      🟢
                    </span>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="Example: Hyderabad"
                      value={
                        pickup
                      }
                      onChange={
                        (e) =>
                          setPickup(
                            e.target.value
                          )
                      }
                    />

                  </div>

                </div>


                {/* DESTINATION */}

                <div className="col-md-5 mb-3">

                  <label className="form-label fw-semibold">
                    Destination Address
                  </label>

                  <div className="input-group">

                    <span className="input-group-text">
                      🔴
                    </span>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="Example: Vizianagaram"
                      value={
                        destination
                      }
                      onChange={
                        (e) =>
                          setDestination(
                            e.target.value
                          )
                      }
                    />

                  </div>

                </div>


                {/* SEARCH */}

                <div className="col-md-2 mb-3 d-flex align-items-end">

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={
                      loading
                    }
                  >

                    {loading
                      ? "Searching..."
                      : "🔍 Search"}

                  </button>

                </div>

              </div>

            </form>


            {/* MESSAGE */}

            {message && (

              <div
                className={`alert alert-${messageType} mt-4`}
                role="alert"
              >
                {message}
              </div>

            )}


            {/* CLEAR */}

            {(pickup ||
              destination) && (

              <button
                type="button"
                className="btn btn-outline-secondary mt-2"
                onClick={
                  clearSearch
                }
                disabled={
                  loading
                }
              >
                Clear
              </button>

            )}

          </div>

        </div>


        {/* ============================================
            ROUTE SUMMARY
        ============================================ */}

        {matchingTrip &&
          routeData && (

            <>

              <div className="mt-4">

                <h4 className="fw-bold mb-3">
                  🚚 Route Summary
                </h4>

                <div className="row g-4">

                  {/* DISTANCE */}

                  <div className="col-md-4">

                    <div className="card border-0 shadow-sm h-100">

                      <div className="card-body text-center p-4">

                        <div
                          style={{
                            fontSize:
                              "35px",
                          }}
                        >
                          🛣️
                        </div>

                        <h6 className="text-muted mt-2">
                          TOTAL DISTANCE
                        </h6>

                        <h3 className="fw-bold">

                          {distance !==
                            null &&
                          distance !==
                            undefined &&
                          !Number.isNaN(
                            Number(
                              distance
                            )
                          )
                            ? `${Number(
                                distance
                              ).toFixed(
                                2
                              )} KM`
                            : "N/A"}

                        </h3>

                      </div>

                    </div>

                  </div>


                  {/* ETA */}

                  <div className="col-md-4">

                    <div className="card border-0 shadow-sm h-100">

                      <div className="card-body text-center p-4">

                        <div
                          style={{
                            fontSize:
                              "35px",
                          }}
                        >
                          ⏱️
                        </div>

                        <h6 className="text-muted mt-2">
                          ESTIMATED TIME
                        </h6>

                        <h3 className="fw-bold">

                          {formatETA(
                            eta
                          )}

                        </h3>

                      </div>

                    </div>

                  </div>


                  {/* STATUS */}

                  <div className="col-md-4">

                    <div className="card border-0 shadow-sm h-100">

                      <div className="card-body text-center p-4">

                        <div
                          style={{
                            fontSize:
                              "35px",
                          }}
                        >
                          🚦
                        </div>

                        <h6 className="text-muted mt-2">
                          CURRENT STATUS
                        </h6>

                        <h3>

                          <span
                            className={`badge ${getStatusClass()}`}
                          >
                            {
                              currentStatus
                            }
                          </span>

                        </h3>

                      </div>

                    </div>

                  </div>

                </div>

              </div>


              {/* ======================================
                  TRIP DETAILS
              ====================================== */}

              <div className="card shadow border-0 mt-4">

                <div className="card-body p-4">

                  <h5 className="fw-bold mb-3">
                    📍 Trip Details
                  </h5>

                  <div className="row">

                    <div className="col-md-6">

                      <p>
                        <strong>
                          Pickup:
                        </strong>{" "}
                        {
                          matchingTrip.pickup_location
                        }
                      </p>

                    </div>


                    <div className="col-md-6">

                      <p>
                        <strong>
                          Destination:
                        </strong>{" "}
                        {
                          matchingTrip.destination
                        }
                      </p>

                    </div>


                    <div className="col-md-4">

                      <p>
                        <strong>
                          Trip ID:
                        </strong>{" "}
                        #{matchingTrip.id}
                      </p>

                    </div>


                    <div className="col-md-4">

                      <p>
                        <strong>
                          Driver ID:
                        </strong>{" "}
                        {
                          matchingTrip.driver_id
                        }
                      </p>

                    </div>


                    <div className="col-md-4">

                      <p>
                        <strong>
                          Vehicle ID:
                        </strong>{" "}
                        {
                          matchingTrip.vehicle_id
                        }
                      </p>

                    </div>

                  </div>


                  {/* SCHEDULE */}

                  <div className="row mt-2">

                    <div className="col-md-6">

                      <p>
                        <strong>
                          Scheduled Start:
                        </strong>{" "}
                        {matchingTrip
                          .scheduled_start_time
                          ? new Date(
                              matchingTrip
                                .scheduled_start_time
                            ).toLocaleString()
                          : "N/A"}
                      </p>

                    </div>


                    <div className="col-md-6">

                      <p>
                        <strong>
                          Scheduled End:
                        </strong>{" "}
                        {matchingTrip
                          .scheduled_end_time
                          ? new Date(
                              matchingTrip
                                .scheduled_end_time
                            ).toLocaleString()
                          : "N/A"}
                      </p>

                    </div>

                  </div>


                  {/* START TRACKING */}

                  <button
                    type="button"
                    className="btn btn-success mt-2"
                    onClick={
                      startTracking
                    }
                  >
                    ▶ Start Tracking
                  </button>

                </div>

              </div>


              {/* ======================================
                  ROUTE MAP
              ====================================== */}

              <div className="card shadow border-0 mt-4">

                <div className="card-body p-4">

                  <h4 className="fw-bold">
                    🗺️ Route Map
                  </h4>

                  <p className="text-muted">
                    Visual representation of
                    the existing trip route.
                  </p>

                  <RouteMap
                    routeData={
                      routeData
                    }
                  />

                </div>

              </div>

            </>

          )}


        {/* ============================================
            INFORMATION WHEN NO TRIP IS FOUND
        ============================================ */}

        {!matchingTrip && (

          <div className="card border-0 shadow-sm mt-4">

            <div className="card-body">

              <h5 className="fw-bold">
                ℹ️ How Route Planner Works
              </h5>

              <div className="mt-3">

                <p>
                  <span className="badge bg-primary me-2">
                    1
                  </span>
                  Enter pickup address.
                </p>

                <p>
                  <span className="badge bg-primary me-2">
                    2
                  </span>
                  Enter destination address.
                </p>

                <p>
                  <span className="badge bg-primary me-2">
                    3
                  </span>
                  Click Search.
                </p>

                <p>
                  <span className="badge bg-primary me-2">
                    4
                  </span>
                  FleetFlow validates
                  the addresses.
                </p>

                <p>
                  <span className="badge bg-success me-2">
                    5
                  </span>
                  FleetFlow searches for
                  an existing trip.
                </p>

                <p>
                  <span className="badge bg-success me-2">
                    6
                  </span>
                  If found, Distance,
                  ETA, Current Status and
                  Route Map are displayed.
                </p>

                <p className="mb-0">

                  <span className="badge bg-warning text-dark me-2">
                    7
                  </span>

                  Start Tracking opens the
                  matching trip.

                </p>

              </div>

            </div>

          </div>

        )}

      </div>

    </main>
  );
}

export default RoutePlanner;