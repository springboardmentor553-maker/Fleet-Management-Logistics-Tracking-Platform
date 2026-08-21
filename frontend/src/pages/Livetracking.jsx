import { useEffect, useState } from "react";

import {
  FaRoute,
  FaMapMarkerAlt,
  FaFlagCheckered,
  FaClock,
  FaRoad,
  FaTruck,
  FaCircle,
  FaLocationArrow,
} from "react-icons/fa";

import {
  getTrips,
  getTripRoute,
} from "../services/tripService";

import { getVehicles } from "../services/vehicleService";

import LiveTrackingMap from "../components/LiveTrackingMap";


function LiveTracking() {
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState("");

  const [route, setRoute] = useState(null);

  const [selectedTrip, setSelectedTrip] = useState(null);

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  // =======================================
  // LOAD TRIPS + VEHICLES
  // =======================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setError("");

        // Get all trips
        const tripData = await getTrips();

        setTrips(tripData);

        // Get all vehicles
        const vehicleData = await getVehicles();

        setVehicles(vehicleData);


        // Select first available trip
        if (tripData.length > 0) {
          const firstTrip = tripData[0];

          setSelectedTripId(
            String(firstTrip.id)
          );

          setSelectedTrip(firstTrip);


          // Find vehicle assigned to first trip
          const vehicle = vehicleData.find(
            (item) =>
              item.id === firstTrip.vehicle_id
          );

          setSelectedVehicle(
            vehicle || null
          );
        }

      } catch (err) {
        console.error(
          "Failed to load tracking data:",
          err
        );

        setError(
          "Failed to load trips and vehicle information."
        );
      }
    };

    loadData();
  }, []);


  // =======================================
  // LOAD ROUTE WHEN TRIP CHANGES
  // =======================================

  useEffect(() => {
    if (!selectedTripId) {
      return;
    }

    const loadRoute = async () => {
      try {
        setLoading(true);
        setError("");

        // Find selected trip
        const trip = trips.find(
          (item) =>
            String(item.id) ===
            String(selectedTripId)
        );

        setSelectedTrip(
          trip || null
        );


        // Find vehicle assigned to trip
        const vehicle = vehicles.find(
          (item) =>
            item.id === trip?.vehicle_id
        );

        setSelectedVehicle(
          vehicle || null
        );


        // Get route information
        const data =
          await getTripRoute(
            selectedTripId
          );

        setRoute(data);

      } catch (err) {
        console.error(
          "Failed to load route:",
          err
        );

        setRoute(null);

        setError(
          "Unable to load route information."
        );

      } finally {
        setLoading(false);
      }
    };

    loadRoute();

  }, [
    selectedTripId,
    trips,
    vehicles,
  ]);


  // =======================================
  // HANDLE TRIP SELECTION
  // =======================================

  const handleTripChange = (event) => {
    setSelectedTripId(
      event.target.value
    );
  };


  return (
    <div className="min-h-full bg-slate-950 text-white p-6">


      {/* ======================================= */}
      {/* HEADER */}
      {/* ======================================= */}

      <div className="
        flex
        flex-col
        md:flex-row
        md:items-center
        md:justify-between
        gap-4
        mb-6
      ">

        <div>

          <div className="
            flex
            items-center
            gap-3
          ">

            <div className="
              p-3
              rounded-xl
              bg-blue-600/20
              border
              border-blue-500/10
            ">

              <FaRoute
                className="
                  text-blue-400
                  text-xl
                "
              />

            </div>


            <div>

              <h1 className="
                text-2xl
                font-bold
              ">
                Trip Route / Live Tracking
              </h1>


              <p className="
                text-slate-400
                text-sm
                mt-1
              ">
                Monitor vehicle movement and route
                information in real time.
              </p>

            </div>

          </div>

        </div>


        {/* LIVE STATUS */}

        <div className="
          flex
          items-center
          gap-2
          px-4
          py-2
          rounded-full
          bg-emerald-500/10
          border
          border-emerald-500/20
        ">

          <FaCircle
            className="
              text-emerald-400
              text-xs
              animate-pulse
            "
          />

          <span className="
            text-emerald-400
            text-sm
            font-medium
          ">
            Live Tracking
          </span>

        </div>

      </div>



      {/* ======================================= */}
      {/* TRIP SELECTOR */}
      {/* ======================================= */}

      <div className="
        bg-slate-900
        border
        border-slate-800
        rounded-2xl
        p-5
        mb-6
        shadow-lg
      ">

        <div className="
          flex
          items-center
          gap-3
          mb-3
        ">

          <FaTruck
            className="text-blue-400"
          />

          <label className="
            text-sm
            font-semibold
            text-slate-300
          ">
            Select Trip
          </label>

        </div>


        <select
          value={selectedTripId}
          onChange={handleTripChange}
          className="
            w-full
            md:w-96
            bg-slate-800
            border
            border-slate-700
            rounded-xl
            px-4
            py-3
            text-white
            outline-none
            focus:border-blue-500
            focus:ring-1
            focus:ring-blue-500
            transition
          "
        >

          <option value="">
            Select a trip
          </option>


          {trips.map((trip) => (

            <option
              key={trip.id}
              value={trip.id}
            >

              Trip #{trip.id} —{" "}
              {trip.start_location} →{" "}
              {trip.end_location}

            </option>

          ))}

        </select>

      </div>



      {/* ======================================= */}
      {/* ERROR */}
      {/* ======================================= */}

      {error && (

        <div className="
          bg-red-500/10
          border
          border-red-500/30
          text-red-400
          rounded-xl
          p-4
          mb-6
        ">

          {error}

        </div>

      )}



      {/* ======================================= */}
      {/* MAIN CONTENT */}
      {/* ======================================= */}

      {!loading && route && (

        <div className="
          grid
          grid-cols-1
          xl:grid-cols-[350px_1fr]
          gap-6
        ">


          {/* ======================================= */}
          {/* TRIP INFORMATION */}
          {/* ======================================= */}

          <div className="
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            p-6
            shadow-lg
          ">


            {/* TRIP HEADING */}

            <div className="
              flex
              items-center
              gap-3
              mb-6
            ">

              <div className="
                p-3
                rounded-xl
                bg-blue-600/10
                border
                border-blue-500/10
              ">

                <FaRoute
                  className="text-blue-400"
                />

              </div>


              <div>

                <h2 className="
                  font-semibold
                  text-lg
                ">
                  Trip Information
                </h2>


                <p className="
                  text-xs
                  text-slate-500
                ">
                  Trip #{selectedTrip?.id}
                </p>

              </div>

            </div>



            {/* ================================= */}
            {/* PICKUP */}
            {/* ================================= */}

            <div className="mb-6">

              <div className="
                flex
                items-start
                gap-3
              ">

                <FaMapMarkerAlt
                  className="
                    text-emerald-400
                    mt-1
                  "
                />


                <div>

                  <p className="
                    text-xs
                    text-slate-500
                    uppercase
                    tracking-wide
                  ">
                    Pickup
                  </p>


                  <p className="
                    text-slate-200
                    font-medium
                    mt-1
                  ">
                    {route.pickup_location}
                  </p>

                </div>

              </div>

            </div>



            {/* ================================= */}
            {/* DESTINATION */}
            {/* ================================= */}

            <div className="mb-6">

              <div className="
                flex
                items-start
                gap-3
              ">

                <FaFlagCheckered
                  className="
                    text-red-400
                    mt-1
                  "
                />


                <div>

                  <p className="
                    text-xs
                    text-slate-500
                    uppercase
                    tracking-wide
                  ">
                    Destination
                  </p>


                  <p className="
                    text-slate-200
                    font-medium
                    mt-1
                  ">
                    {route.destination}
                  </p>

                </div>

              </div>

            </div>



            {/* ================================= */}
            {/* VEHICLE INFORMATION */}
            {/* ================================= */}

            {selectedVehicle && (

              <div className="
                mb-5
                p-4
                rounded-xl
                bg-slate-800/40
                border
                border-slate-800
              ">

                <div className="
                  flex
                  items-center
                  gap-3
                  mb-4
                ">

                  <div className="
                    p-2
                    rounded-lg
                    bg-blue-500/10
                  ">

                    <FaTruck
                      className="
                        text-blue-400
                        text-sm
                      "
                    />

                  </div>


                  <div>

                    <p className="
                      text-xs
                      text-slate-500
                      uppercase
                      tracking-wide
                    ">
                      Vehicle
                    </p>


                    <p className="
                      text-white
                      font-semibold
                      mt-1
                    ">
                      {selectedVehicle.vehicle_number}
                    </p>

                  </div>

                </div>


                {/* VEHICLE DETAILS */}

                <div className="
                  grid
                  grid-cols-2
                  gap-4
                  text-xs
                ">


                  {/* TYPE */}

                  <div>

                    <p className="
                      text-slate-500
                    ">
                      Type
                    </p>


                    <p className="
                      text-slate-300
                      mt-1
                    ">
                      {selectedVehicle.vehicle_type}
                    </p>

                  </div>


                  {/* MODEL */}

                  <div>

                    <p className="
                      text-slate-500
                    ">
                      Model
                    </p>


                    <p className="
                      text-slate-300
                      mt-1
                    ">
                      {selectedVehicle.model}
                    </p>

                  </div>


                  {/* FUEL */}

                  <div>

                    <p className="
                      text-slate-500
                    ">
                      Fuel
                    </p>


                    <p className="
                      text-slate-300
                      mt-1
                    ">
                      {selectedVehicle.fuel_type}
                    </p>

                  </div>


                  {/* CAPACITY */}

                  <div>

                    <p className="
                      text-slate-500
                    ">
                      Capacity
                    </p>


                    <p className="
                      text-slate-300
                      mt-1
                    ">
                      {selectedVehicle.capacity}
                    </p>

                  </div>

                </div>

              </div>

            )}



            {/* DIVIDER */}

            <div className="
              border-t
              border-slate-800
              my-5
            " />



            {/* ================================= */}
            {/* DISTANCE */}
            {/* ================================= */}

            <div className="
              flex
              items-center
              justify-between
              py-3
            ">

              <div className="
                flex
                items-center
                gap-3
              ">

                <FaRoad
                  className="text-blue-400"
                />

                <span className="
                  text-slate-400
                ">
                  Distance
                </span>

              </div>


              <span className="font-semibold">
                {route.distance}
              </span>

            </div>



            {/* ================================= */}
            {/* ETA */}
            {/* ================================= */}

            <div className="
              flex
              items-center
              justify-between
              py-3
            ">

              <div className="
                flex
                items-center
                gap-3
              ">

                <FaClock
                  className="
                    text-purple-400
                  "
                />

                <span className="
                  text-slate-400
                ">
                  ETA
                </span>

              </div>


              <span className="
                font-semibold
                text-right
              ">
                {route.estimated_travel_time}
              </span>

            </div>



            {/* ================================= */}
            {/* STATUS */}
            {/* ================================= */}

            <div className="
              flex
              items-center
              justify-between
              py-3
            ">

              <span className="
                text-slate-400
              ">
                Status
              </span>


              <span className="
                px-3
                py-1
                rounded-full
                text-xs
                font-semibold
                bg-emerald-500/10
                text-emerald-400
                border
                border-emerald-500/20
              ">

                {selectedTrip?.status ||
                  "ONGOING"}

              </span>

            </div>



            {/* ================================= */}
            {/* ROUTE SUMMARY */}
            {/* ================================= */}

            <div className="
              mt-5
              p-4
              bg-slate-800/50
              rounded-xl
              border
              border-slate-800
            ">

              <p className="
                text-xs
                text-slate-500
                uppercase
                tracking-wide
              ">
                Route
              </p>


              <p className="
                text-slate-200
                font-medium
                mt-1
              ">
                {route.route_summary}
              </p>

            </div>

          </div>



          {/* ======================================= */}
          {/* GOOGLE MAP */}
          {/* ======================================= */}

          <div className="
            relative
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            p-3
            shadow-lg
            min-h-[550px]
          ">

            <div className="
              relative
              h-[550px]
              w-full
              overflow-hidden
              rounded-xl
            ">


              {/* GOOGLE MAP */}

              <LiveTrackingMap
                tripId={selectedTripId}
                polyline={route.polyline}
                pickupLocation={
                  route.pickup_location
                }
                destination={
                  route.destination
                }
              />



              {/* ================================= */}
              {/* ACTIVE ROUTE */}
              {/* ================================= */}

              <div className="
                absolute
                top-4
                left-4
                z-10
                bg-slate-950/90
                backdrop-blur-md
                border
                border-slate-700/70
                rounded-xl
                px-4
                py-3
                shadow-xl
              ">

                <div className="
                  flex
                  items-center
                  gap-2
                  mb-1
                ">

                  <FaLocationArrow
                    className="
                      text-blue-400
                      text-xs
                    "
                  />


                  <span className="
                    text-xs
                    uppercase
                    tracking-wider
                    text-slate-400
                  ">
                    Active Route
                  </span>

                </div>


                <p className="
                  text-sm
                  font-semibold
                  text-white
                ">

                  {route.pickup_location}
                  {" → "}
                  {route.destination}

                </p>

              </div>



              {/* ================================= */}
              {/* LIVE BADGE */}
              {/* ================================= */}

              <div className="
                absolute
                top-4
                right-4
                z-10
                flex
                items-center
                gap-2
                bg-slate-950/90
                backdrop-blur-md
                border
                border-emerald-500/30
                rounded-full
                px-3
                py-2
                shadow-xl
              ">

                <FaCircle
                  className="
                    text-emerald-400
                    text-[8px]
                    animate-pulse
                  "
                />


                <span className="
                  text-xs
                  font-semibold
                  text-emerald-400
                ">
                  LIVE
                </span>

              </div>



              {/* ================================= */}
              {/* ROUTE SUMMARY CARD */}
              {/* ================================= */}

              <div className="
                absolute
                bottom-4
                left-4
                z-10
                bg-slate-950/90
                backdrop-blur-md
                border
                border-slate-700/70
                rounded-xl
                px-4
                py-3
                shadow-xl
                max-w-sm
              ">

                <p className="
                  text-[10px]
                  uppercase
                  tracking-wider
                  text-slate-500
                  mb-1
                ">
                  Route
                </p>


                <p className="
                  text-sm
                  text-white
                  font-medium
                ">
                  {route.route_summary}
                </p>


                <div className="
                  flex
                  items-center
                  gap-4
                  mt-2
                  text-xs
                  text-slate-400
                ">

                  <span>
                    {route.distance}
                  </span>


                  <span className="
                    text-slate-600
                  ">
                    •
                  </span>


                  <span>
                    {route.estimated_travel_time}
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}



      {/* ======================================= */}
      {/* LOADING */}
      {/* ======================================= */}

      {loading && (

        <div className="
          h-[550px]
          bg-slate-900
          border
          border-slate-800
          rounded-2xl
          flex
          items-center
          justify-center
        ">

          <div className="text-center">

            <div className="
              w-10
              h-10
              border-4
              border-slate-700
              border-t-blue-500
              rounded-full
              animate-spin
              mx-auto
            " />


            <p className="
              text-slate-400
              mt-4
            ">
              Loading route...
            </p>

          </div>

        </div>

      )}

    </div>
  );
}


export default LiveTracking;