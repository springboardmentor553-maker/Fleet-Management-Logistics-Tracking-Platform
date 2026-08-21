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

import Layout from "../components/Layout";

// =====================================================
// LEAFLET ICON FIX
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
// VEHICLE ICON
// =====================================================

const vehicleIcon = L.divIcon({
  className: "vehicle-marker",

  html: `
    <div style="
      font-size: 34px;
      width: 45px;
      height: 45px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 50%;
      border: 3px solid #2563eb;
      box-shadow: 0 3px 10px rgba(0,0,0,0.4);
    ">
      🚛
    </div>
  `,

  iconSize: [45, 45],
  iconAnchor: [22, 22],
});


// =====================================================
// PICKUP ICON
// =====================================================

const pickupIcon = L.divIcon({
  className: "pickup-marker",

  html: `
    <div style="
      font-size: 28px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 50%;
      border: 3px solid #22c55e;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    ">
      📍
    </div>
  `,

  iconSize: [40, 40],
  iconAnchor: [20, 20],
});


// =====================================================
// DESTINATION ICON
// =====================================================

const destinationIcon = L.divIcon({
  className: "destination-marker",

  html: `
    <div style="
      font-size: 28px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 50%;
      border: 3px solid #ef4444;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    ">
      🏁
    </div>
  `,

  iconSize: [40, 40],
  iconAnchor: [20, 20],
});


// =====================================================
// FIT ROUTE
// =====================================================

function FitRoute({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points && points.length >= 2) {
      map.fitBounds(points, {
        padding: [50, 50],
      });
    }
  }, [points, map]);

  return null;
}


// =====================================================
// FOLLOW VEHICLE
// =====================================================

function FollowVehicle({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.panTo(position, {
        animate: true,
        duration: 1,
      });
    }
  }, [position, map]);

  return null;
}


// =====================================================
// LIVE TRACKING
// =====================================================

function LiveTracking() {

  const [tripId, setTripId] = useState("15");

  const [vehicle, setVehicle] = useState(null);

  const [connected, setConnected] = useState(false);

  const [messages, setMessages] = useState(0);

  const [error, setError] = useState("");

  // Pickup
  const [pickup, setPickup] = useState(null);

  // Destination
  const [destination, setDestination] = useState(null);

  // Actual road route
  const [routePoints, setRoutePoints] = useState([]);

  // Vehicle movement trail
  const [vehicleTrail, setVehicleTrail] = useState([]);


  // ===================================================
  // WEBSOCKET
  // ===================================================

  useEffect(() => {

    if (!tripId) {
      return;
    }


    // Reset
    setVehicle(null);
    setMessages(0);
    setConnected(false);
    setError("");

    setPickup(null);
    setDestination(null);
    setRoutePoints([]);
    setVehicleTrail([]);


    // =================================================
    // CREATE WEBSOCKET
    // =================================================

    const socket = new WebSocket(
  `wss://fleetflow-backend-56xc.onrender.com/ws/tracking/${tripId}`
);


    // =================================================
    // CONNECTED
    // =================================================

    socket.onopen = () => {

      console.log(
        "WebSocket connected"
      );

      setConnected(true);

      setError("");
    };


    // =================================================
    // MESSAGE
    // =================================================

    socket.onmessage = (event) => {

      try {

        const data = JSON.parse(
          event.data
        );


        console.log(
          "Tracking update:",
          data
        );


        // =============================================
        // ERROR MESSAGE
        // =============================================

        if (data.message) {

          setError(data.message);

          return;
        }


        // =============================================
        // VEHICLE DATA
        // =============================================

        setVehicle(data);


        setMessages(
          (previous) =>
            previous + 1
        );


        // =============================================
        // PICKUP COORDINATES
        // =============================================

        if (
          data.pickup_coordinates &&
          data.pickup_coordinates.latitude !== undefined &&
          data.pickup_coordinates.longitude !== undefined
        ) {

          const pickupPoint = [
            Number(
              data.pickup_coordinates.latitude
            ),

            Number(
              data.pickup_coordinates.longitude
            ),
          ];


          if (
            Number.isFinite(pickupPoint[0]) &&
            Number.isFinite(pickupPoint[1])
          ) {

            setPickup(pickupPoint);
          }
        }


        // =============================================
        // DESTINATION COORDINATES
        // =============================================

        if (
          data.destination_coordinates &&
          data.destination_coordinates.latitude !== undefined &&
          data.destination_coordinates.longitude !== undefined
        ) {

          const destinationPoint = [

            Number(
              data.destination_coordinates.latitude
            ),

            Number(
              data.destination_coordinates.longitude
            ),

          ];


          if (
            Number.isFinite(destinationPoint[0]) &&
            Number.isFinite(destinationPoint[1])
          ) {

            setDestination(
              destinationPoint
            );
          }
        }


        // =============================================
        // ACTUAL ROAD ROUTE
        // =============================================

        if (
          Array.isArray(
            data.route_coordinates
          ) &&
          data.route_coordinates.length >= 2
        ) {

          const points =
            data.route_coordinates
              .map((point) => [

                Number(point[0]),

                Number(point[1]),

              ])
              .filter(
                (point) =>
                  Number.isFinite(point[0]) &&
                  Number.isFinite(point[1])
              );


          if (points.length >= 2) {

            console.log(
              "WebSocket route points:",
              points.length
            );

            setRoutePoints(points);
          }
        }


        // =============================================
        // LIVE VEHICLE POSITION
        // =============================================

        if (
          data.latitude !== undefined &&
          data.longitude !== undefined
        ) {

          const latitude =
            Number(data.latitude);

          const longitude =
            Number(data.longitude);


          if (
            Number.isFinite(latitude) &&
            Number.isFinite(longitude)
          ) {

            const newPoint = [
              latitude,
              longitude,
            ];


            // =======================================
            // UPDATE VEHICLE TRAIL
            // =======================================

            setVehicleTrail(
              (previous) => {

                const updated = [
                  ...previous,
                  newPoint,
                ];


                // Keep last 100 positions
                return updated.slice(-100);
              }
            );
          }
        }

      } catch (err) {

        console.log(
          "Message parsing error:",
          err
        );
      }
    };


    // =================================================
    // ERROR
    // =================================================

    socket.onerror = (error) => {

      console.log(
        "WebSocket error:",
        error
      );


      setConnected(false);


      setError(
        "WebSocket connection failed"
      );
    };


    // =================================================
    // CLOSED
    // =================================================

    socket.onclose = () => {

      console.log(
        "WebSocket disconnected"
      );


      setConnected(false);
    };


    // =================================================
    // CLEANUP
    // =================================================

    return () => {

      socket.close();

    };

  }, [tripId]);


  // ===================================================
  // VEHICLE POSITION
  // ===================================================

  const vehiclePosition =

    vehicle &&
    vehicle.latitude !== undefined &&
    vehicle.longitude !== undefined

      ? [

          Number(
            vehicle.latitude
          ),

          Number(
            vehicle.longitude
          ),

        ]

      : null;


  // ===================================================
  // MAP CENTER
  // ===================================================

  const mapCenter =

    vehiclePosition ||
    pickup ||
    [16.5062, 80.6480];


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

          Live Tracking

        </h1>


        <p className="text-slate-400 mt-2">

          Monitor vehicle location in real time

        </p>

      </div>


      {/* =================================================
          TRIP ID
      ================================================= */}

      <div className="bg-slate-900/75 border border-slate-700/60 rounded-2xl p-6 mb-6">

        <label className="block text-sm font-medium text-slate-300 mb-2">

          Trip ID

        </label>


        <input

          type="number"

          value={tripId}

          onChange={(e) =>
            setTripId(e.target.value)
          }

          className="w-full max-w-md bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500"

          placeholder="Enter Trip ID"

        />

      </div>


      {/* =================================================
          CONNECTION CARDS
      ================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">


        {/* Connection */}

        <div className="bg-slate-900/75 border border-blue-500/20 rounded-2xl p-5">

          <p className="text-slate-400">

            Connection

          </p>


          <p
            className={`text-xl font-bold mt-2 ${
              connected
                ? "text-green-400"
                : "text-red-400"
            }`}
          >

            {connected
              ? "🟢 Connected"
              : "🔴 Disconnected"}

          </p>

        </div>


        {/* Trip */}

        <div className="bg-slate-900/75 border border-purple-500/20 rounded-2xl p-5">

          <p className="text-slate-400">

            Trip ID

          </p>


          <p className="text-2xl font-bold text-purple-400 mt-2">

            {vehicle?.trip_id || tripId}

          </p>

        </div>


        {/* Vehicle */}

        <div className="bg-slate-900/75 border border-blue-500/20 rounded-2xl p-5">

          <p className="text-slate-400">

            Vehicle ID

          </p>


          <p className="text-2xl font-bold text-blue-400 mt-2">

            {vehicle?.vehicle_id || "-"}

          </p>

        </div>


        {/* Updates */}

        <div className="bg-slate-900/75 border border-green-500/20 rounded-2xl p-5">

          <p className="text-slate-400">

            Updates Received

          </p>


          <p className="text-2xl font-bold text-green-400 mt-2">

            {messages}

          </p>

        </div>

      </div>


      {/* =================================================
          VEHICLE INFORMATION
      ================================================= */}

      {vehicle && (

        <div className="bg-slate-900/75 border border-slate-700/60 rounded-2xl p-6 mb-6">

          <h2 className="text-xl font-bold text-white mb-5">

            Vehicle Information

          </h2>


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">


            <div>

              <p className="text-slate-500 text-sm">

                Driver

              </p>


              <p className="text-white font-semibold mt-1">

                Driver #{vehicle.driver_id}

              </p>

            </div>


            <div>

              <p className="text-slate-500 text-sm">

                Vehicle

              </p>


              <p className="text-white font-semibold mt-1">

                Vehicle #{vehicle.vehicle_id}

              </p>

            </div>


            <div>

              <p className="text-slate-500 text-sm">

                Status

              </p>


              <p className="text-green-400 font-semibold mt-1">

                {vehicle.trip_status}

              </p>

            </div>


            <div>

              <p className="text-slate-500 text-sm">

                Route

              </p>


              <p className="text-white font-semibold mt-1">

                {vehicle.pickup_location}

                {" → "}

                {vehicle.destination}

              </p>

            </div>


          </div>

        </div>

      )}


      {/* =================================================
          CURRENT LOCATION
      ================================================= */}

      {vehiclePosition && (

        <div className="bg-slate-900/75 border border-orange-500/20 rounded-2xl p-6 mb-6">

          <h2 className="text-xl font-bold text-white mb-4">

            Current Vehicle Location

          </h2>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


            <div>

              <p className="text-slate-500">

                Latitude

              </p>


              <p className="text-orange-400 text-xl font-bold mt-1">

                {vehiclePosition[0].toFixed(6)}

              </p>

            </div>


            <div>

              <p className="text-slate-500">

                Longitude

              </p>


              <p className="text-orange-400 text-xl font-bold mt-1">

                {vehiclePosition[1].toFixed(6)}

              </p>

            </div>


          </div>

        </div>

      )}


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6">

          {error}

        </div>

      )}


      {/* =================================================
          MAP
      ================================================= */}

      <div className="bg-slate-900/75 border border-slate-700/60 rounded-2xl overflow-hidden">


        <div className="p-5 border-b border-slate-800">

          <h2 className="text-xl font-bold text-white">

            Live Vehicle Map

          </h2>


          <p className="text-sm text-slate-500 mt-1">

            🚛 Vehicle position updates automatically

          </p>

        </div>


        <div className="h-[550px]">

          <MapContainer

            center={mapCenter}

            zoom={10}

            scrollWheelZoom={true}

            className="h-full w-full"

          >


            {/* =================================================
                MAP TILES
            ================================================= */}

            <TileLayer

              attribution="&copy; OpenStreetMap contributors"

              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

            />


            {/* =================================================
                PICKUP
            ================================================= */}

            {pickup && (

              <Marker

                position={pickup}

                icon={pickupIcon}

              >

                <Popup>

                  <b>📍 Pickup</b>

                  <br />

                  {vehicle?.pickup_location}

                </Popup>

              </Marker>

            )}


            {/* =================================================
                DESTINATION
            ================================================= */}

            {destination && (

              <Marker

                position={destination}

                icon={destinationIcon}

              >

                <Popup>

                  <b>🏁 Destination</b>

                  <br />

                  {vehicle?.destination}

                </Popup>

              </Marker>

            )}


            {/* =================================================
                ACTUAL ROAD ROUTE
            ================================================= */}

            {routePoints.length >= 2 && (

              <Polyline

                positions={routePoints}

                pathOptions={{

                  color: "#2563eb",

                  weight: 7,

                  opacity: 0.9,

                }}

              />

            )}


            {/* =================================================
                VEHICLE TRAIL
            ================================================= */}

            {vehicleTrail.length >= 2 && (

              <Polyline

                positions={vehicleTrail}

                pathOptions={{

                  color: "#22c55e",

                  weight: 4,

                  opacity: 0.8,

                  dashArray: "8, 8",

                }}

              />

            )}


            {/* =================================================
                LIVE VEHICLE
            ================================================= */}

            {vehiclePosition && (

              <Marker

                position={vehiclePosition}

                icon={vehicleIcon}

              >

                <Popup>

                  <b>🚛 Live Vehicle</b>

                  <br />

                  Trip ID: {vehicle.trip_id}

                  <br />

                  Driver ID: {vehicle.driver_id}

                  <br />

                  Vehicle ID: {vehicle.vehicle_id}

                  <br />

                  Status: {vehicle.trip_status}

                  <br />

                  Latitude:{" "}

                  {vehiclePosition[0].toFixed(6)}

                  <br />

                  Longitude:{" "}

                  {vehiclePosition[1].toFixed(6)}

                </Popup>

              </Marker>

            )}


            {/* =================================================
                FIT TO ROUTE
            ================================================= */}

            {routePoints.length >= 2 && (

              <FitRoute

                points={routePoints}

              />

            )}


            {/* =================================================
                FOLLOW VEHICLE
            ================================================= */}

            {vehiclePosition && (

              <FollowVehicle

                position={vehiclePosition}

              />

            )}


          </MapContainer>

        </div>

      </div>

    </Layout>

  );
}


export default LiveTracking;