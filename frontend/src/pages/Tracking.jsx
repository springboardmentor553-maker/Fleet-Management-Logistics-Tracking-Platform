import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import RouteMap from "../components/RouteMap";

import api from "../api/api";


function Tracking() {

  const { tripId } = useParams();


  // ==================================================
  // STORAGE KEY
  // ==================================================

  const storageKey =
    `fleetflow_tracking_${tripId}`;


  // ==================================================
  // DEFAULT LOCATION
  // ==================================================

  const defaultLocation = {
    latitude: 17.731,
    longitude: 83.301,
  };


  // ==================================================
  // LOAD SAVED TRACKING STATE
  // ==================================================

  const getSavedState = () => {

    try {

      const saved =
        localStorage.getItem(
          storageKey
        );

      if (!saved) {
        return null;
      }

      return JSON.parse(saved);

    } catch (error) {

      console.error(
        "Unable to restore tracking state:",
        error
      );

      return null;
    }
  };


  const savedState =
    getSavedState();


  // ==================================================
  // VEHICLE LOCATION
  // ==================================================

  const [location, setLocation] =
    useState(
      savedState?.location ||
      defaultLocation
    );


  // ==================================================
  // TRACKING STATUS
  // ==================================================

  const [status, setStatus] =
    useState(
      savedState?.status ||
      "Loading..."
    );


  // ==================================================
  // PROGRESS
  // ==================================================

  const [progress, setProgress] =
    useState(
      Number(
        savedState?.progress || 0
      )
    );


  // ==================================================
  // ROUTE DATA
  // ==================================================

  const [routeData, setRouteData] =
    useState(null);

  const [
    savedTrackingState,
    setSavedTrackingState,
  ] = useState(null);

  // ==================================================
  // CURRENT ROUTE POINT
  // ==================================================

  const [currentIndex, setCurrentIndex] =
    useState(
      Number(
        savedState?.currentIndex || 0
      )
    );


  // ==================================================
  // TOTAL ROUTE POINTS
  // ==================================================

  const [totalPoints, setTotalPoints] =
    useState(
      Number(
        savedState?.totalPoints || 0
      )
    );


  // ==================================================
  // WEBSOCKET STATUS
  // ==================================================

  const [
    connectionStatus,
    setConnectionStatus,
  ] = useState(
    "Connecting..."
  );


  // ==================================================
  // 1. LOAD CURRENT TRIP FROM BACKEND
  // ==================================================

  useEffect(() => {

    if (!tripId) {
      return;
    }


    const loadCurrentTrip =
      async () => {

        try {

          console.log(
            `Loading current Trip ${tripId}...`
          );


          const response =
            await api.get(
              `/trips/${tripId}`
            );


          const trip =
            response.data;


          console.log(
            "Current Trip:",
            trip
          );


          // ------------------------------------------
          // BACKEND STATUS IS AUTHORITATIVE
          // ------------------------------------------

          if (trip.trip_status) {

            setStatus(
              trip.trip_status
            );

          }


          // ------------------------------------------
          // Save backend state
          // ------------------------------------------

          setSavedTrackingState({

            status:
              trip.trip_status ||
              status,

            location,

            progress,

            currentIndex,

            totalPoints,

          });

        } catch (error) {

          console.error(
            "Trip API Error:",
            error
          );

        }

      };


    loadCurrentTrip();

  }, [tripId]);


  // ==================================================
  // 2. WEBSOCKET LIVE TRACKING
  // ==================================================

  useEffect(() => {

    if (!tripId) {

      setStatus(
        "Trip ID Missing"
      );

      return;
    }


    console.log(
      `Connecting to Trip ${tripId}...`
    );


    const socket =
      new WebSocket(
        `${
          import.meta.env.VITE_WS_URL
        }/ws/tracking/${tripId}`
      );


    // ==================================================
    // CONNECTION OPEN
    // ==================================================

    socket.onopen = () => {

      console.log(
        "WebSocket Connected"
      );


      setConnectionStatus(
        "Connected"
      );

    };


    // ==================================================
    // RECEIVE DATA
    // ==================================================

    socket.onmessage =
      (event) => {

        try {

          const data =
            JSON.parse(
              event.data
            );


          console.log(
            "Tracking Data:",
            data
          );


          // ------------------------------------------
          // BACKEND ERROR
          // ------------------------------------------

          if (data.error) {

            console.error(
              "Tracking Error:",
              data.error
            );

            return;
          }


          // ------------------------------------------
          // LOCATION
          // ------------------------------------------

          let nextLocation =
            location;


          if (
            data.latitude !==
              undefined &&
            data.longitude !==
              undefined
          ) {

            nextLocation = {

              latitude:
                Number(
                  data.latitude
                ),

              longitude:
                Number(
                  data.longitude
                ),

            };


            setLocation(
              nextLocation
            );

          }


          // ------------------------------------------
          // STATUS
          // ------------------------------------------

          let nextStatus =
            status;


          if (data.status) {

            nextStatus =
              data.status;


            setStatus(
              nextStatus
            );

          }


          // ------------------------------------------
          // PROGRESS
          // ------------------------------------------

          let nextProgress =
            progress;


          if (
            data.progress !==
            undefined
          ) {

            nextProgress =
              Math.min(
                Math.max(
                  Number(
                    data.progress
                  ) || 0,
                  0
                ),
                100
              );


            setProgress(
              nextProgress
            );

          }


          // ------------------------------------------
          // CURRENT INDEX
          // ------------------------------------------

          let nextCurrentIndex =
            currentIndex;


          if (
            data.current_index !==
            undefined
          ) {

            nextCurrentIndex =
              Number(
                data.current_index
              );


            setCurrentIndex(
              nextCurrentIndex
            );

          }


          // ------------------------------------------
          // TOTAL POINTS
          // ------------------------------------------

          let nextTotalPoints =
            totalPoints;


          if (
            data.total_points !==
            undefined
          ) {

            nextTotalPoints =
              Number(
                data.total_points
              );


            setTotalPoints(
              nextTotalPoints
            );

          }


          // ------------------------------------------
          // SAVE LATEST STATE
          // ------------------------------------------

          saveTrackingState({

            location:
              nextLocation,

            status:
              nextStatus,

            progress:
              nextProgress,

            currentIndex:
              nextCurrentIndex,

            totalPoints:
              nextTotalPoints,

          });


        } catch (error) {

          console.error(
            "Invalid WebSocket Data:",
            error
          );

        }

      };


    // ==================================================
    // WEBSOCKET ERROR
    // ==================================================

    socket.onerror =
      (error) => {

        console.error(
          "WebSocket Error:",
          error
        );


        setConnectionStatus(
          "Connection Error"
        );

      };


    // ==================================================
    // WEBSOCKET CLOSED
    // ==================================================

    socket.onclose = () => {

      console.log(
        "WebSocket Closed"
      );


      setConnectionStatus(
        "Disconnected"
      );

    };


    // ==================================================
    // CLEANUP
    // ==================================================

    return () => {

      console.log(
        "Leaving tracking page..."
      );


      socket.close();

    };

  }, [tripId]);


  // ==================================================
  // 3. SAVE TRACKING STATE
  // ==================================================

  const saveTrackingState =
    (state) => {

      try {

        localStorage.setItem(

          storageKey,

          JSON.stringify({

            location:
              state.location,

            status:
              state.status,

            progress:
              state.progress,

            currentIndex:
              state.currentIndex,

            totalPoints:
              state.totalPoints,

            updatedAt:
              new Date().toISOString(),

          })

        );

      } catch (error) {

        console.error(
          "Unable to save tracking state:",
          error
        );

      }

    };


  // ==================================================
  // 4. SAVE CURRENT STATE WHEN IT CHANGES
  // ==================================================

  useEffect(() => {

    if (!tripId) {
      return;
    }


    saveTrackingState({

      location,

      status,

      progress,

      currentIndex,

      totalPoints,

    });

  }, [
    tripId,
    location,
    status,
    progress,
    currentIndex,
    totalPoints,
  ]);


  // ==================================================
  // 5. FETCH ROUTE
  // ==================================================

  useEffect(() => {

    if (!tripId) {
      return;
    }


    const fetchRoute =
      async () => {

        try {

          console.log(
            `Fetching route for Trip ${tripId}...`
          );


          const response =
            await api.get(
              `/trips/${tripId}/route`
            );


          const route =
            response.data;


          console.log(
            "Route API Response:",
            route
          );


          setRouteData({

            ...route,

            vehicle_coordinates:
              location,

            current_index:
              currentIndex,

            total_points:
              totalPoints,

          });

        } catch (error) {

          console.error(
            "Route API Error:",
            error
          );


          setRouteData(
            null
          );

        }

      };


    fetchRoute();

  }, [tripId]);


  // ==================================================
  // 6. UPDATE ROUTE WHEN LOCATION CHANGES
  // ==================================================

  useEffect(() => {

    if (!routeData) {
      return;
    }


    setRouteData(
      previous => ({

        ...previous,

        vehicle_coordinates:
          location,

        current_index:
          currentIndex,

        total_points:
          totalPoints,

      })
    );


  }, [
    location,
    currentIndex,
    totalPoints,
  ]);


  // ==================================================
  // 7. SAFE PROGRESS
  // ==================================================

  const safeProgress =
    Math.min(

      Math.max(
        Number(progress) || 0,
        0
      ),

      100

    );


  // ==================================================
  // 8. STATUS COLOR
  // ==================================================

  const getStatusClass =
    () => {

      const normalized =
        String(
          status || ""
        ).toLowerCase();


      if (
        normalized ===
          "delivered" ||
        normalized ===
          "completed"
      ) {

        return "text-success";

      }


      if (
        normalized ===
          "in transit" ||
        normalized ===
          "started"
      ) {

        return "text-warning";

      }


      if (
        normalized ===
          "connection error"
      ) {

        return "text-danger";

      }


      return "text-primary";

    };


  // ==================================================
  // 9. RENDER
  // ==================================================

  return (

    <main
      className="tracking-page"
      style={{
        background:
          "#f4f6f9",

        minHeight:
          "100vh",
      }}
    >

      <div className="container-fluid p-4">


        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div className="d-flex justify-content-between align-items-center mb-4">

          <div>

            <h3
              className="fw-bold mb-1"
              style={{
                color:
                  "#172033",
              }}
            >
              🚚 Live Trip Tracking
            </h3>

            <p className="text-muted mb-0">

              Real-time vehicle location
              and trip progress

            </p>

          </div>


          <div
            className="px-3 py-2 rounded-pill"
            style={{

              background:
                connectionStatus ===
                "Connected"
                  ? "#dcfce7"
                  : "#fee2e2",

              color:
                connectionStatus ===
                "Connected"
                  ? "#15803d"
                  : "#dc2626",

              fontWeight:
                "600",

              fontSize:
                "14px",

            }}
          >

            <span
              style={{

                display:
                  "inline-block",

                width:
                  "8px",

                height:
                  "8px",

                borderRadius:
                  "50%",

                background:
                  connectionStatus ===
                  "Connected"
                    ? "#16a34a"
                    : "#dc2626",

                marginRight:
                  "7px",

              }}
            />

            {connectionStatus}

          </div>

        </div>


        {/* ==================================================
            INFORMATION CARDS
        ================================================== */}

        <div className="row g-4 mb-4">


          {/* STATUS */}

          <div className="col-xl-3 col-md-6">

            <div
              className="card border-0 shadow-sm h-100"
              style={{
                borderRadius:
                  "15px",
              }}
            >

              <div className="card-body text-center p-4">

                <div
                  style={{
                    fontSize:
                      "32px",
                    marginBottom:
                      "8px",
                  }}
                >
                  📡
                </div>

                <h6 className="text-muted">
                  STATUS
                </h6>

                <h4
                  className={
                    `fw-bold ${
                      getStatusClass()
                    }`
                  }
                >
                  {status}
                </h4>

              </div>

            </div>

          </div>


          {/* TRIP */}

          <div className="col-xl-3 col-md-6">

            <div
              className="card border-0 shadow-sm h-100"
              style={{
                borderRadius:
                  "15px",
              }}
            >

              <div className="card-body text-center p-4">

                <div
                  style={{
                    fontSize:
                      "32px",
                    marginBottom:
                      "8px",
                  }}
                >
                  🚛
                </div>

                <h6 className="text-muted">
                  TRIP
                </h6>

                <h4 className="fw-bold">
                  #{tripId}
                </h4>

              </div>

            </div>

          </div>


          {/* SPEED */}

          <div className="col-xl-3 col-md-6">

            <div
              className="card border-0 shadow-sm h-100"
              style={{
                borderRadius:
                  "15px",
              }}
            >

              <div className="card-body text-center p-4">

                <div
                  style={{
                    fontSize:
                      "32px",
                    marginBottom:
                      "8px",
                  }}
                >
                  ⚡
                </div>

                <h6 className="text-muted">
                  SPEED
                </h6>

                <h4 className="fw-bold">
                  60 km/h
                </h4>

              </div>

            </div>

          </div>


          {/* GPS */}

          <div className="col-xl-3 col-md-6">

            <div
              className="card border-0 shadow-sm h-100"
              style={{
                borderRadius:
                  "15px",
              }}
            >

              <div className="card-body text-center p-4">

                <div
                  style={{
                    fontSize:
                      "32px",
                    marginBottom:
                      "8px",
                  }}
                >
                  🛰️
                </div>

                <h6 className="text-muted">
                  GPS
                </h6>

                <h4
                  className={
                    connectionStatus ===
                    "Connected"
                      ? "text-success fw-bold"
                      : "text-danger fw-bold"
                  }
                >

                  {status === "Completed"
  ? "✅ Trip Completed"
  : status === "Cancelled"
    ? "⛔ Cancelled"
    : connectionStatus === "Connected"
      ? "🟢 Online"
      : "🟠 Waiting"}

                </h4>

              </div>

            </div>

          </div>

        </div>


        {/* ==================================================
            VEHICLE PROGRESS
        ================================================== */}

        <div
          className="card border-0 shadow-sm mb-4"
          style={{
            borderRadius:
              "15px",
          }}
        >

          <div className="card-body p-4">

            <div className="d-flex justify-content-between align-items-center">

              <div>

                <h5
                  className="fw-bold mb-1"
                >
                  Vehicle Progress
                </h5>

                <small className="text-muted">
                  Live route progress
                </small>

              </div>

              <h4 className="fw-bold mb-0">

                {Math.round(
                  safeProgress
                )}
                %

              </h4>

            </div>


            <div
              className="progress mt-3"
              style={{
                height:
                  "12px",

                borderRadius:
                  "20px",

                background:
                  "#e2e8f0",
              }}
            >

              <div
                className="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                style={{

                  width:
                    `${safeProgress}%`,

                  borderRadius:
                    "20px",

                  transition:
                    "width 0.5s ease",

                }}
              >

                {Math.round(
                  safeProgress
                )}

                %

              </div>

            </div>


            <div className="row mt-4">


              <div className="col-md-4">

                <div
                  className="p-3 rounded"
                  style={{
                    background:
                      "#f8fafc",
                  }}
                >

                  <small className="text-muted">
                    Current Route Point
                  </small>

                  <h5 className="fw-bold mb-0">
                    {currentIndex}
                  </h5>

                </div>

              </div>


              <div className="col-md-4">

                <div
                  className="p-3 rounded"
                  style={{
                    background:
                      "#f8fafc",
                  }}
                >

                  <small className="text-muted">
                    Total Route Points
                  </small>

                  <h5 className="fw-bold mb-0">
                    {totalPoints}
                  </h5>

                </div>

              </div>


              <div className="col-md-4">

                <div
                  className="p-3 rounded"
                  style={{
                    background:
                      "#f8fafc",
                  }}
                >

                  <small className="text-muted">
                    Current Status
                  </small>

                  <h5
                    className={
                      `fw-bold mb-0 ${
                        getStatusClass()
                      }`
                    }
                  >
                    {status}
                  </h5>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* ==================================================
            GPS LOCATION
        ================================================== */}

        <div
          className="card border-0 shadow-sm mb-4"
          style={{
            borderRadius:
              "15px",
          }}
        >

          <div className="card-body p-4">

            <h5
              className="fw-bold mb-3"
            >
              📍 Current Vehicle Location
            </h5>


            <div className="row g-3">


              <div className="col-md-6">

                <div
                  className="p-3 rounded"
                  style={{
                    background:
                      "#f8fafc",

                    border:
                      "1px solid #e2e8f0",
                  }}
                >

                  <small className="text-muted">
                    Latitude
                  </small>

                  <h5 className="fw-bold mb-0">

                    {Number(
                      location.latitude
                    ).toFixed(6)}

                  </h5>

                </div>

              </div>


              <div className="col-md-6">

                <div
                  className="p-3 rounded"
                  style={{
                    background:
                      "#f8fafc",

                    border:
                      "1px solid #e2e8f0",
                  }}
                >

                  <small className="text-muted">
                    Longitude
                  </small>

                  <h5 className="fw-bold mb-0">

                    {Number(
                      location.longitude
                    ).toFixed(6)}

                  </h5>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* ==================================================
            ROUTE MAP
        ================================================== */}

        <div
          className="card border-0 shadow-sm"
          style={{
            borderRadius:
              "15px",

            overflow:
              "hidden",
          }}
        >

          <div
            className="card-header border-0"
            style={{
              background:
                "white",

              padding:
                "18px 20px",
            }}
          >

            <h5
              className="fw-bold mb-1"
            >
              🗺️ Live Route Map
            </h5>

            <small className="text-muted">

              Real-time vehicle position
              and route

            </small>

          </div>


          <div
            style={{
              minHeight:
                "500px",
            }}
          >

            {routeData ? (

              <RouteMap
                routeData={
                  routeData
                }
              />

            ) : (

              <div
                className="d-flex flex-column justify-content-center align-items-center"
                style={{
                  minHeight:
                    "500px",

                  background:
                    "#f8fafc",
                }}
              >

                <div
                  className="spinner-border text-primary mb-3"
                  role="status"
                />

                <h6 className="fw-semibold">
                  Loading Route...
                </h6>

                <small className="text-muted">

                  Waiting for route
                  information

                </small>

              </div>

            )}

          </div>

        </div>

      </div>

    </main>

  );
}


export default Tracking;