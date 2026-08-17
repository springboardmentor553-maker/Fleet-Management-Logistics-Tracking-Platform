import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import api from "../services/api";
import Layout from "../components/Layout";

// =====================================================
// LEAFLET MARKER ICON FIX
// =====================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// =====================================================
// MAP VIEW
// =====================================================

function ChangeMapView({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions && positions.length >= 2) {
      map.fitBounds(positions, {
        padding: [40, 40],
      });
    }
  }, [positions, map]);

  return null;
}

// =====================================================
// MOVING VEHICLE ICON
// =====================================================

const vehicleIcon = L.divIcon({
  className: "vehicle-marker",
  html: `
    <div style="
      font-size: 32px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));
    ">
      🚛
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// =====================================================
// MAIN COMPONENT
// =====================================================

function RouteGeneration() {
  const [pickupLocation, setPickupLocation] =
    useState("");

  const [destinationLocation, setDestinationLocation] =
    useState("");

  const [pickupCoordinates, setPickupCoordinates] =
    useState(null);

  const [destinationCoordinates, setDestinationCoordinates] =
    useState(null);

  const [route, setRoute] = useState(null);

  const [loading, setLoading] = useState(false);

  // ===================================================
  // VEHICLE ANIMATION STATES
  // ===================================================

  const [vehiclePosition, setVehiclePosition] =
    useState(null);

  const [vehicleIndex, setVehicleIndex] =
    useState(0);

  const [isMoving, setIsMoving] =
    useState(false);

  const [tripCompleted, setTripCompleted] =
    useState(false);

  // ===================================================
  // GENERATE ROUTE
  // ===================================================

  const generateRoute = async (e) => {
    e.preventDefault();

    if (
      !pickupLocation.trim() ||
      !destinationLocation.trim()
    ) {
      alert("Please enter pickup and destination");
      return;
    }

    try {
      setLoading(true);

      setRoute(null);
      setPickupCoordinates(null);
      setDestinationCoordinates(null);

      setVehiclePosition(null);
      setVehicleIndex(0);
      setIsMoving(false);
      setTripCompleted(false);

      const response = await api.get("/route/", {
        params: {
          pickup_location:
            pickupLocation.trim(),

          destination:
            destinationLocation.trim(),
        },
      });

      console.log(
        "Route response:",
        response.data
      );

      if (response.data.message) {
        alert(response.data.message);
        return;
      }

      setRoute(response.data);

      setPickupCoordinates(
        response.data.pickup_coordinates
      );

      setDestinationCoordinates(
        response.data.destination_coordinates
      );

    } catch (error) {
      console.log(
        "Route Error:",
        error
      );

      const detail =
        error.response?.data?.detail;

      const message =
        error.response?.data?.message;

      alert(
        typeof detail === "string"
          ? detail
          : typeof message === "string"
          ? message
          : "Failed to generate route"
      );

    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // ROUTE COORDINATES
  // ===================================================

  const routeLine =
    Array.isArray(route?.route_coordinates)
      ? route.route_coordinates.map(
          (point) => [
            Number(point[0]),
            Number(point[1]),
          ]
        )
      : [];

  // ===================================================
  // PICKUP POSITION
  // ===================================================

  const pickupPosition =
    pickupCoordinates
      ? [
          Number(
            pickupCoordinates.latitude
          ),
          Number(
            pickupCoordinates.longitude
          ),
        ]
      : null;

  // ===================================================
  // DESTINATION POSITION
  // ===================================================

  const destinationPosition =
    destinationCoordinates
      ? [
          Number(
            destinationCoordinates.latitude
          ),
          Number(
            destinationCoordinates.longitude
          ),
        ]
      : null;

  // ===================================================
  // VEHICLE ANIMATION
  // ===================================================

  useEffect(() => {
    if (
      !isMoving ||
      routeLine.length < 2
    ) {
      return;
    }

    if (
      vehicleIndex >=
      routeLine.length - 1
    ) {
      setIsMoving(false);
      setTripCompleted(true);
      return;
    }

    const timer = setTimeout(() => {
      const nextIndex =
        vehicleIndex + 1;

      setVehicleIndex(nextIndex);

      setVehiclePosition(
        routeLine[nextIndex]
      );

    }, 300);

    return () => clearTimeout(timer);

  }, [
    isMoving,
    vehicleIndex,
    routeLine,
  ]);

  // ===================================================
  // START TRIP
  // ===================================================

  const startTrip = () => {
    if (routeLine.length < 2) {
      alert(
        "Please generate a route first"
      );
      return;
    }

    if (tripCompleted) {
      setVehicleIndex(0);

      setVehiclePosition(
        routeLine[0]
      );

      setTripCompleted(false);
    }

    if (!vehiclePosition) {
      setVehicleIndex(0);

      setVehiclePosition(
        routeLine[0]
      );
    }

    setIsMoving(true);
  };

  // ===================================================
  // PAUSE TRIP
  // ===================================================

  const pauseTrip = () => {
    setIsMoving(false);
  };

  // ===================================================
  // RESET TRIP
  // ===================================================

  const resetTrip = () => {
    setIsMoving(false);

    setTripCompleted(false);

    setVehicleIndex(0);

    if (routeLine.length > 0) {
      setVehiclePosition(
        routeLine[0]
      );
    } else {
      setVehiclePosition(null);
    }
  };

  // ===================================================
  // CURRENT VEHICLE POSITION
  // ===================================================

  const currentVehiclePosition =
    vehiclePosition ||
    pickupPosition;

  // ===================================================
  // MAP POSITIONS
  // ===================================================

  const mapPositions =
    routeLine.length >= 2
      ? routeLine
      : [
          ...(pickupPosition
            ? [pickupPosition]
            : []),

          ...(destinationPosition
            ? [destinationPosition]
            : []),
        ];

  // ===================================================
  // PROGRESS
  // ===================================================

  const progress =
    routeLine.length > 1
      ? Math.round(
          (vehicleIndex /
            (routeLine.length - 1)) *
            100
        )
      : 0;

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <Layout>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-8">

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
          Route Generation
        </h1>

        <p className="text-slate-400 mt-2">
          Generate and track a vehicle along the
          actual road route
        </p>

      </div>


      {/* =================================================
          FORM
      ================================================= */}

      <form
        onSubmit={generateRoute}
        className="bg-slate-900/75 border border-slate-700/60 rounded-2xl p-6 mb-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* PICKUP */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Pickup Location
            </label>

            <input
              type="text"
              value={pickupLocation}
              onChange={(e) =>
                setPickupLocation(
                  e.target.value
                )
              }
              placeholder="Example: Guntur"
              className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />

          </div>


          {/* DESTINATION */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Destination
            </label>

            <input
              type="text"
              value={destinationLocation}
              onChange={(e) =>
                setDestinationLocation(
                  e.target.value
                )
              }
              placeholder="Example: Vijayawada"
              className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />

          </div>

        </div>


        {/* GENERATE */}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/30 transition disabled:opacity-50"
        >
          {loading
            ? "Generating Route..."
            : "Generate Route"}
        </button>

      </form>


      {/* =================================================
          ROUTE DETAILS
      ================================================= */}

      {route && (

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

          {/* DISTANCE */}

          <div className="bg-slate-900/75 border border-blue-500/20 rounded-2xl p-5">

            <p className="text-slate-400">
              Distance
            </p>

            <p className="text-3xl font-bold text-blue-400 mt-2">
              {route.distance || "-"}
            </p>

          </div>


          {/* TRAVEL TIME */}

          <div className="bg-slate-900/75 border border-green-500/20 rounded-2xl p-5">

            <p className="text-slate-400">
              Estimated Travel Time
            </p>

            <p className="text-2xl font-bold text-green-400 mt-2">
              {route.estimated_travel_time || "-"}
            </p>

          </div>


          {/* ETA */}

          <div className="bg-slate-900/75 border border-purple-500/20 rounded-2xl p-5">

            <p className="text-slate-400">
              Estimated Arrival
            </p>

            <p className="text-xl font-bold text-purple-400 mt-2">
              {route.estimated_arrival_time || "-"}
            </p>

          </div>

        </div>

      )}


      {/* =================================================
          VEHICLE CONTROL
      ================================================= */}

      {routeLine.length >= 2 && (

        <div className="bg-slate-900/75 border border-slate-700/60 rounded-2xl p-6 mb-6">

          <div className="flex flex-wrap gap-3">

            {/* START */}

            <button
              onClick={startTrip}
              disabled={isMoving}
              className="px-5 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-500 disabled:opacity-50"
            >
              ▶ Start Trip
            </button>


            {/* PAUSE */}

            <button
              onClick={pauseTrip}
              disabled={!isMoving}
              className="px-5 py-3 rounded-xl bg-yellow-600 text-white font-semibold hover:bg-yellow-500 disabled:opacity-50"
            >
              ⏸ Pause
            </button>


            {/* RESET */}

            <button
              onClick={resetTrip}
              className="px-5 py-3 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-600"
            >
              🔄 Reset
            </button>

          </div>


          {/* PROGRESS */}

          <div className="mt-5">

            <div className="flex justify-between text-sm mb-2">

              <span className="text-slate-400">
                Trip Progress
              </span>

              <span className="text-blue-400 font-semibold">
                {progress}%
              </span>

            </div>

            <div className="w-full bg-slate-800 rounded-full h-3">

              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

          </div>


          {/* STATUS */}

          <div className="mt-4">

            {tripCompleted ? (

              <p className="text-green-400 font-semibold">
                ✅ Trip Completed
              </p>

            ) : isMoving ? (

              <p className="text-blue-400 font-semibold">
                🚛 Vehicle is moving...
              </p>

            ) : (

              <p className="text-slate-400">
                Vehicle is ready to start
              </p>

            )}

          </div>

        </div>

      )}


      {/* =================================================
          CURRENT VEHICLE LOCATION
      ================================================= */}

      {currentVehiclePosition && (

        <div className="bg-slate-900/75 border border-orange-500/20 rounded-2xl p-5 mb-6">

          <p className="text-slate-400">
            Current Vehicle Location
          </p>

          <p className="text-orange-400 font-semibold mt-2">

            Latitude:{" "}
            {Number(
              currentVehiclePosition[0]
            ).toFixed(5)}

            {"   "}

            Longitude:{" "}
            {Number(
              currentVehiclePosition[1]
            ).toFixed(5)}

          </p>

        </div>

      )}


      {/* =================================================
          MAP
      ================================================= */}

      <div className="bg-slate-900/75 border border-slate-700/60 rounded-2xl overflow-hidden">

        <div className="p-5 border-b border-slate-800">

          <h2 className="text-xl font-bold text-white">
            Live Route Map
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Vehicle movement along the generated road route
          </p>

        </div>


        <div className="h-[550px]">

          <MapContainer
            center={[
              16.5062,
              80.6480,
            ]}
            zoom={10}
            scrollWheelZoom={true}
            className="h-full w-full"
          >

            {/* MAP TILES */}

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


            {/* =================================================
                PICKUP MARKER
            ================================================= */}

            {pickupPosition && (

              <Marker
                position={pickupPosition}
              >

                <Popup>

                  <b>
                    📍 Pickup Location
                  </b>

                  <br />

                  {pickupLocation}

                </Popup>

              </Marker>

            )}


            {/* =================================================
                DESTINATION MARKER
            ================================================= */}

            {destinationPosition && (

              <Marker
                position={
                  destinationPosition
                }
              >

                <Popup>

                  <b>
                    🏁 Destination
                  </b>

                  <br />

                  {destinationLocation}

                </Popup>

              </Marker>

            )}


            {/* =================================================
                ACTUAL ROAD ROUTE
            ================================================= */}

            {routeLine.length >= 2 && (

              <Polyline
                positions={routeLine}
                pathOptions={{
                  color: "blue",
                  weight: 6,
                  opacity: 0.8,
                }}
              />

            )}


            {/* =================================================
                MOVING VEHICLE
            ================================================= */}

            {currentVehiclePosition && (

              <Marker
                position={
                  currentVehiclePosition
                }
                icon={vehicleIcon}
              >

                <Popup>

                  <b>
                    🚛 Vehicle
                  </b>

                  <br />

                  Status:{" "}
                  {tripCompleted
                    ? "Completed"
                    : isMoving
                    ? "In Transit"
                    : "Ready"}

                  <br />

                  Latitude:{" "}
                  {Number(
                    currentVehiclePosition[0]
                  ).toFixed(5)}

                  <br />

                  Longitude:{" "}
                  {Number(
                    currentVehiclePosition[1]
                  ).toFixed(5)}

                </Popup>

              </Marker>

            )}


            {/* =================================================
                FIT MAP
            ================================================= */}

            {mapPositions.length >= 2 && (

              <ChangeMapView
                positions={mapPositions}
              />

            )}

          </MapContainer>

        </div>

      </div>

    </Layout>
  );
}

export default RouteGeneration;