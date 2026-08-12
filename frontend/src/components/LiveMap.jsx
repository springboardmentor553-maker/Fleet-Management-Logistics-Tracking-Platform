import {
  useEffect,
  useState,
} from "react";

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

import {

  getTrips,

  getTripRoute,

  geocodeLocation,

  generateRoute,

} from "../services/mapService";

import {

  connectWebSocket,

  disconnectWebSocket,

} from "../services/websocketService";

import "./Map.css";


// ==========================================================
// LEAFLET MARKER FIX
// ==========================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({

  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

});


// ==========================================================
// FIT ROUTE
// ==========================================================

function FitBounds({
  route,
}) {

  const map = useMap();


  useEffect(() => {

    if (
      route &&
      route.length > 1
    ) {

      map.fitBounds(

        route,

        {

          padding:
            [50, 50],

        }

      );

    }

  }, [
    route,
    map,
  ]);


  return null;

}


// ==========================================================
// LIVE MAP
// ==========================================================

function LiveMap() {

  // ========================================================
  // TRIPS
  // ========================================================

  const [
    trips,
    setTrips,
  ] = useState([]);


  const [
    selectedTripId,
    setSelectedTripId,
  ] = useState("");


  const [
    selectedTrip,
    setSelectedTrip,
  ] = useState(null);


  // ========================================================
  // LOCATIONS
  // ========================================================

  const [
    pickup,
    setPickup,
  ] = useState("");


  const [
    destination,
    setDestination,
  ] = useState("");


  // ========================================================
  // COORDINATES
  // ========================================================

  const [
    pickupCoords,
    setPickupCoords,
  ] = useState(null);


  const [
    destinationCoords,
    setDestinationCoords,
  ] = useState(null);


  // ========================================================
  // ROUTE
  // ========================================================

  const [
    route,
    setRoute,
  ] = useState([]);


  const [
    distance,
    setDistance,
  ] = useState("");


  const [
    duration,
    setDuration,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  // ========================================================
  // LIVE VEHICLE
  // ========================================================

  const [
    vehicleLocation,
    setVehicleLocation,
  ] = useState(null);


  const [
    vehicleStatus,
    setVehicleStatus,
  ] = useState("");


  // ========================================================
  // LOAD TRIPS
  // ========================================================

  useEffect(() => {

    async function loadTrips() {

      try {

        const data =
          await getTrips();


        setTrips(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {

        console.error(
          error
        );

        alert(
          error.message
        );

      }

    }


    loadTrips();

  }, []);


  // ========================================================
  // SELECT TRIP
  // ========================================================

  useEffect(() => {

    if (
      !selectedTripId
    ) {

      setSelectedTrip(null);

      return;

    }


    const trip =
      trips.find(

        item =>
          String(item.id) ===
          String(selectedTripId)

      );


    if (!trip) {

      return;

    }


    setSelectedTrip(
      trip
    );


    // ------------------------------------------------------
    // Automatically show source/destination
    // ------------------------------------------------------

    setPickup(
      trip.pickup_location || ""
    );


    setDestination(
      trip.destination || ""
    );


    // ------------------------------------------------------
    // Clear previous route
    // ------------------------------------------------------

    setRoute([]);

    setDistance("");

    setDuration("");

    setPickupCoords(null);

    setDestinationCoords(null);

    setVehicleLocation(null);

    setVehicleStatus("");


    // ------------------------------------------------------
    // Automatically load selected trip
    // ------------------------------------------------------

    async function loadTripRoute() {

      try {

        setLoading(true);


        console.log(
          `Loading Trip ${trip.id}`
        );


        const data =
          await getTripRoute(
            trip.id
          );


        console.log(
          "Trip Route:",
          data
        );


        // --------------------------------------------------
        // Pickup
        // --------------------------------------------------

        const pickupPosition = [

          Number(
            data.pickup_latitude
          ),

          Number(
            data.pickup_longitude
          ),

        ];


        // --------------------------------------------------
        // Destination
        // --------------------------------------------------

        const destinationPosition = [

          Number(
            data.destination_latitude
          ),

          Number(
            data.destination_longitude
          ),

        ];


        setPickupCoords(
          pickupPosition
        );


        setDestinationCoords(
          destinationPosition
        );


        // --------------------------------------------------
        // Distance
        // --------------------------------------------------

        setDistance(

          Number(
            data.distance_km
          ).toFixed(2)

        );


        // --------------------------------------------------
        // Duration
        // --------------------------------------------------

        setDuration(

          Number(
            data.duration_minutes
          ).toFixed(2)

        );


        // --------------------------------------------------
        // Route geometry
        // --------------------------------------------------

        if (

          data.geometry &&

          Array.isArray(
            data.geometry.coordinates
          )

        ) {

          const routeCoordinates =

            data.geometry.coordinates.map(

              ([lng, lat]) => [

                Number(lat),

                Number(lng),

              ]

            );


          setRoute(
            routeCoordinates
          );

        }


        // --------------------------------------------------
        // Update selected trip object with coordinates
        // --------------------------------------------------

        setSelectedTrip({

          ...trip,

          pickup_latitude:
            data.pickup_latitude,

          pickup_longitude:
            data.pickup_longitude,

          destination_latitude:
            data.destination_latitude,

          destination_longitude:
            data.destination_longitude,

        });


      } catch (error) {

        console.error(
          "Selected Trip Error:",
          error
        );


        alert(
          error.message ||
          "Unable to load selected trip."
        );


      } finally {

        setLoading(false);

      }

    }


    loadTripRoute();

  }, [
    selectedTripId,
    trips,
  ]);


  // ========================================================
  // CONNECT WEBSOCKET TO SELECTED TRIP
  // ========================================================

  useEffect(() => {

    if (
      !selectedTripId
    ) {

      return;

    }


    const tripId =
      Number(
        selectedTripId
      );


    connectWebSocket(

      tripId,

      (data) => {

        console.log(
          "Live Trip Update:",
          data
        );


        if (

          data.type ===
          "location_update"

        ) {

          if (

            data.latitude != null &&

            data.longitude != null

          ) {

            setVehicleLocation([

              Number(
                data.latitude
              ),

              Number(
                data.longitude
              ),

            ]);

          }


          if (
            data.status
          ) {

            setVehicleStatus(
              data.status
            );

          }

        }

      }

    );


    return () => {

      disconnectWebSocket();

    };

  }, [
    selectedTripId,
  ]);


  // ========================================================
  // MANUAL SEARCH
  // ========================================================

  const searchRoute =
    async () => {

      try {

        if (
          !pickup.trim() ||
          !destination.trim()
        ) {

          alert(

            "Enter both pickup "
            + "and destination."

          );

          return;

        }


        setLoading(true);


        // --------------------------------------------------
        // Pickup
        // --------------------------------------------------

        const pickupData =
          await geocodeLocation(
            pickup
          );


        // --------------------------------------------------
        // Destination
        // --------------------------------------------------

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              1100
            )
        );


        const destinationData =
          await geocodeLocation(
            destination
          );


        // --------------------------------------------------
        // Coordinates
        // --------------------------------------------------

        const pickupPosition = [

          Number(
            pickupData.latitude
          ),

          Number(
            pickupData.longitude
          ),

        ];


        const destinationPosition = [

          Number(
            destinationData.latitude
          ),

          Number(
            destinationData.longitude
          ),

        ];


        setPickupCoords(
          pickupPosition
        );


        setDestinationCoords(
          destinationPosition
        );


        // --------------------------------------------------
        // Route
        // --------------------------------------------------

        const routeData =
          await generateRoute(

            pickupData.latitude,

            pickupData.longitude,

            destinationData.latitude,

            destinationData.longitude

          );


        setDistance(

          Number(
            routeData.distance_km
          ).toFixed(2)

        );


        setDuration(

          Number(
            routeData.duration_minutes
          ).toFixed(2)

        );


        const routeCoordinates =

          routeData.geometry.coordinates.map(

            ([lng, lat]) => [

              Number(lat),

              Number(lng),

            ]

          );


        setRoute(
          routeCoordinates
        );


        // Manual route
        // is not associated with selected trip

        setSelectedTrip(null);

        setSelectedTripId("");


      } catch (error) {

        console.error(
          error
        );


        alert(
          error.message ||
          "Unable to generate route."
        );


      } finally {

        setLoading(false);

      }

    };


  // ========================================================
  // CLEAR
  // ========================================================

  const clearMap = () => {

    setSelectedTripId("");

    setSelectedTrip(null);

    setPickup("");

    setDestination("");

    setPickupCoords(null);

    setDestinationCoords(null);

    setVehicleLocation(null);

    setVehicleStatus("");

    setRoute([]);

    setDistance("");

    setDuration("");

  };


  // ========================================================
  // UI
  // ========================================================

  return (

    <div className="map-page">


      {/* ==================================================
          SELECT TRIP
      ================================================== */}

      <div
        className="map-trip-selector"
        style={{
          marginBottom: "15px",
        }}
      >

        <select

          value={
            selectedTripId
          }

          onChange={

            e =>
              setSelectedTripId(
                e.target.value
              )

          }

          style={{

            width: "100%",

            padding:
              "14px 16px",

            borderRadius:
              "10px",

            border:
              "1px solid #d1d5db",

            fontSize:
              "16px",

            background:
              "#ffffff",

          }}

        >

          <option value="">

            Select a Trip

          </option>


          {trips.map(
            trip => (

              <option

                key={
                  trip.id
                }

                value={
                  trip.id
                }

              >

                {`Trip ${trip.id} • `}
                {trip.pickup_location}
                {" → "}
                {trip.destination}
                {` • ${trip.trip_status}`}

              </option>

            )
          )}

        </select>

      </div>


      {/* ==================================================
          SELECTED TRIP
      ================================================== */}

      {selectedTrip && (

        <div
          style={{

            marginBottom:
              "15px",

            padding:
              "15px 18px",

            borderRadius:
              "10px",

            background:
              "#ffffff",

            boxShadow:
              "0 2px 10px rgba(0,0,0,0.06)",

          }}
        >

          <strong>

            Trip {selectedTrip.id}

          </strong>


          <div
            style={{
              marginTop: "8px",
            }}
          >

            📍{" "}
            {selectedTrip.pickup_location}

            {" → "}

            🏁{" "}
            {selectedTrip.destination}

          </div>


          <div
            style={{
              marginTop: "6px",
            }}
          >

            Status:

            {" "}

            <strong>

              {selectedTrip.trip_status}

            </strong>

          </div>

        </div>

      )}


      {/* ==================================================
          OPTIONAL SEARCH
      ================================================== */}

      <div
        className="map-controls"
      >

        <input

          type="text"

          placeholder="Pickup Location"

          value={pickup}

          onChange={

            e =>
              setPickup(
                e.target.value
              )

          }

        />


        <input

          type="text"

          placeholder="Destination"

          value={destination}

          onChange={

            e =>
              setDestination(
                e.target.value
              )

          }

        />


        <button

          onClick={
            searchRoute
          }

          disabled={
            loading
          }

        >

          {loading
            ? "Loading..."
            : "Search Route"}

        </button>


        <button

          onClick={
            clearMap
          }

          type="button"

        >

          Clear

        </button>

      </div>


      {/* ==================================================
          ROUTE INFORMATION
      ================================================== */}

      <div
        className="route-info"
      >

        <div
          className="route-card"
        >

          <div
            className="route-title"
          >

            Total Distance

          </div>


          <div
            className="route-value"
          >

            {distance
              ? `${distance} km`
              : "-- km"}

          </div>

        </div>


        <div
          className="route-card"
        >

          <div
            className="route-title"
          >

            Estimated Duration

          </div>


          <div
            className="route-value"
          >

            {duration
              ? `${duration} mins`
              : "-- mins"}

          </div>

        </div>

      </div>


      {/* ==================================================
          LIVE TRIP
      ================================================== */}

      {selectedTrip && (

        <div
          style={{
            marginBottom:
              "10px",
            fontWeight:
              "600",
          }}
        >

          🚚 Live Trip:

          {" "}

          Trip {selectedTrip.id}

          {vehicleStatus && (

            <>
              {" | "}
              {vehicleStatus}
            </>

          )}

        </div>

      )}


      {/* ==================================================
          MAP
      ================================================== */}

      <MapContainer

        center={[
          20.5937,
          78.9629,
        ]}

        zoom={5}

        className="leaflet-map"

      >

        <TileLayer

          attribution={
            "© OpenStreetMap contributors"
          }

          url={
            "https://tile.openstreetmap.org/"
            + "{z}/{x}/{y}.png"
          }

        />


        {/* =================================================
            PICKUP
        ================================================= */}

        {pickupCoords && (

          <Marker
            position={
              pickupCoords
            }
          >

            <Popup>

              📍 Pickup

              <br />

              {pickup}

            </Popup>

          </Marker>

        )}


        {/* =================================================
            DESTINATION
        ================================================= */}

        {destinationCoords && (

          <Marker
            position={
              destinationCoords
            }
          >

            <Popup>

              🏁 Destination

              <br />

              {destination}

            </Popup>

          </Marker>

        )}


        {/* =================================================
            LIVE VEHICLE
        ================================================= */}

        {vehicleLocation && (

          <Marker
            position={
              vehicleLocation
            }
          >

            <Popup>

              🚚 Live Vehicle

              <br />

              Trip {selectedTripId}

            </Popup>

          </Marker>

        )}


        {/* =================================================
            ROAD ROUTE
        ================================================= */}

        {route.length > 1 && (

          <>

            <Polyline

              positions={
                route
              }

              pathOptions={{

                color:
                  "#2563eb",

                weight:
                  6,

                opacity:
                  0.85,

              }}

            />


            <FitBounds
              route={route}
            />

          </>

        )}

      </MapContainer>

    </div>

  );

}


export default LiveMap;