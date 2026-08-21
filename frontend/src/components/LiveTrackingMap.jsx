import { useEffect, useRef, useState } from "react";

import {
  setOptions,
  importLibrary,
} from "@googlemaps/js-api-loader";


const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY;


const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";


const WS_BASE_URL =
  API_BASE_URL
    .replace(/^http:/, "ws:")
    .replace(/^https:/, "wss:");


function LiveTrackingMap({
  polyline,
  pickupLocation,
  destination,
  tripId = null,
}) {

  const mapRef =
    useRef(null);

  const mapInstanceRef =
    useRef(null);

  const currentMarkerRef =
    useRef(null);

  const websocketRef =
    useRef(null);

  const watchIdRef =
    useRef(null);


  const markerClassesRef =
    useRef({
      AdvancedMarkerElement: null,
      PinElement: null,
    });


  const [
    mapError,
    setMapError
  ] = useState("");


  const [
    trackingStatus,
    setTrackingStatus
  ] = useState(
    tripId
      ? "Connecting to live tracking..."
      : ""
  );


  const [
    currentLocation,
    setCurrentLocation
  ] = useState(null);


  // ============================================================
  // GOOGLE MAP
  // ============================================================

  useEffect(() => {

    if (
      !polyline ||
      !mapRef.current
    ) {
      return;
    }


    let cancelled = false;


    const loadMap = async () => {

      try {

        setMapError("");


        if (!GOOGLE_MAPS_API_KEY) {

          throw new Error(
            "Google Maps API key is missing."
          );

        }


        setOptions({

          key:
            GOOGLE_MAPS_API_KEY,

          v: "weekly",

        });


        const {
          Map,
          Polyline
        } =
          await importLibrary(
            "maps"
          );


        const {
          LatLngBounds
        } =
          await importLibrary(
            "core"
          );


        const {
          AdvancedMarkerElement,
          PinElement,
        } =
          await importLibrary(
            "marker"
          );


        const {
          encoding
        } =
          await importLibrary(
            "geometry"
          );


        if (cancelled) {
          return;
        }


        markerClassesRef.current = {

          AdvancedMarkerElement,

          PinElement,

        };


        const path =
          encoding.decodePath(
            polyline
          );


        if (
          !path ||
          path.length === 0
        ) {

          throw new Error(
            "Route polyline could not be decoded."
          );

        }


        const map =
          new Map(
            mapRef.current,
            {

              center:
                path[
                  Math.floor(
                    path.length / 2
                  )
                ],

              zoom: 6,

              mapTypeControl:
                false,

              streetViewControl:
                false,

              fullscreenControl:
                true,

              gestureHandling:
                "greedy",


              styles: [

                {
                  elementType:
                    "geometry",

                  stylers: [
                    {
                      color:
                        "#1d2a3a",
                    },
                  ],
                },

                {
                  elementType:
                    "labels.text.fill",

                  stylers: [
                    {
                      color:
                        "#8fa3b8",
                    },
                  ],
                },

                {
                  elementType:
                    "labels.text.stroke",

                  stylers: [
                    {
                      color:
                        "#1d2a3a",
                    },
                  ],
                },

                {
                  featureType:
                    "administrative",

                  elementType:
                    "geometry",

                  stylers: [
                    {
                      color:
                        "#475569",
                    },
                  ],
                },

                {
                  featureType:
                    "administrative.country",

                  elementType:
                    "labels.text.fill",

                  stylers: [
                    {
                      color:
                        "#a8b5c4",
                    },
                  ],
                },

                {
                  featureType:
                    "road",

                  elementType:
                    "geometry",

                  stylers: [
                    {
                      color:
                        "#334155",
                    },
                  ],
                },

                {
                  featureType:
                    "road",

                  elementType:
                    "geometry.stroke",

                  stylers: [
                    {
                      color:
                        "#1e293b",
                    },
                  ],
                },

                {
                  featureType:
                    "road",

                  elementType:
                    "labels.text.fill",

                  stylers: [
                    {
                      color:
                        "#94a3b8",
                    },
                  ],
                },

                {
                  featureType:
                    "road.highway",

                  elementType:
                    "geometry",

                  stylers: [
                    {
                      color:
                        "#475569",
                    },
                  ],
                },

                {
                  featureType:
                    "road.highway",

                  elementType:
                    "geometry.stroke",

                  stylers: [
                    {
                      color:
                        "#1e293b",
                    },
                  ],
                },

                {
                  featureType:
                    "road.highway",

                  elementType:
                    "labels.text.fill",

                  stylers: [
                    {
                      color:
                        "#cbd5e1",
                    },
                  ],
                },

                {
                  featureType:
                    "water",

                  elementType:
                    "geometry",

                  stylers: [
                    {
                      color:
                        "#0f172a",
                    },
                  ],
                },

                {
                  featureType:
                    "water",

                  elementType:
                    "labels.text.fill",

                  stylers: [
                    {
                      color:
                        "#64748b",
                    },
                  ],
                },

                {
                  featureType:
                    "poi",

                  elementType:
                    "geometry",

                  stylers: [
                    {
                      color:
                        "#263548",
                    },
                  ],
                },

                {
                  featureType:
                    "poi",

                  elementType:
                    "labels.text.fill",

                  stylers: [
                    {
                      color:
                        "#94a3b8",
                    },
                  ],
                },

                {
                  featureType:
                    "transit",

                  elementType:
                    "geometry",

                  stylers: [
                    {
                      color:
                        "#263548",
                    },
                  ],
                },

              ],

            }
          );


        mapInstanceRef.current =
          map;


        // ======================================================
        // ROUTE
        // ======================================================

        const routeLine =
          new Polyline({

            path,

            geodesic:
              true,

            strokeColor:
              "#2563EB",

            strokeOpacity:
              0.95,

            strokeWeight:
              5,

          });


        routeLine.setMap(
          map
        );


        // ======================================================
        // FIT ROUTE
        // ======================================================

        const bounds =
          new LatLngBounds();


        path.forEach(
          (point) => {

            bounds.extend(
              point
            );

          }
        );


        map.fitBounds(
          bounds
        );


        // ======================================================
        // PICKUP MARKER
        // ======================================================

        const pickupPin =
          new PinElement({

            background:
              "#10B981",

            borderColor:
              "#FFFFFF",

            glyphColor:
              "#FFFFFF",

            glyphText:
              "P",

          });


        new AdvancedMarkerElement({

          map,

          position:
            path[0],

          title:
            pickupLocation ||
            "Pickup Location",

          content:
            pickupPin.element,

        });


        // ======================================================
        // DESTINATION MARKER
        // ======================================================

        const destinationPin =
          new PinElement({

            background:
              "#EF4444",

            borderColor:
              "#FFFFFF",

            glyphColor:
              "#FFFFFF",

            glyphText:
              "D",

          });


        new AdvancedMarkerElement({

          map,

          position:
            path[
              path.length - 1
            ],

          title:
            destination ||
            "Destination",

          content:
            destinationPin.element,

        });


      } catch (error) {

        console.error(
          "Google Maps error:",
          error
        );


        if (!cancelled) {

          setMapError(
            error.message ||
            "Unable to load Google Maps."
          );

        }

      }

    };


    loadMap();


    return () => {

      cancelled = true;

      mapInstanceRef.current =
        null;

      currentMarkerRef.current =
        null;

    };

  }, [
    polyline,
    pickupLocation,
    destination,
  ]);


  // ============================================================
  // REAL-TIME WEBSOCKET
  // ============================================================

  useEffect(() => {

    if (!tripId) {

      setTrackingStatus("");

      return;

    }


    const token =
      localStorage.getItem(
        "token"
      );


    if (!token) {

      setTrackingStatus(
        "Login required for live tracking."
      );

      return;

    }


    const user =
      JSON.parse(
        localStorage.getItem(
          "user"
        ) || "null"
      );


    const isDriver =
      String(
        user?.role || ""
      ).toLowerCase() ===
      "driver";


    const websocketUrl =
      `${WS_BASE_URL}/ws/tracking/${tripId}` +
      `?token=${encodeURIComponent(
        token
      )}`;


    const websocket =
      new WebSocket(
        websocketUrl
      );


    websocketRef.current =
      websocket;


    // ========================================================
    // CONNECTION OPEN
    // ========================================================

    websocket.onopen = () => {

      setTrackingStatus(

        isDriver

          ? "GPS tracking connected"

          : "Live tracking connected"

      );


      // ------------------------------------------------------
      // DRIVER GPS
      // ------------------------------------------------------

      if (
        isDriver &&
        navigator.geolocation
      ) {

        watchIdRef.current =
          navigator.geolocation
            .watchPosition(

              (position) => {

                const location = {

                  latitude:
                    position
                      .coords
                      .latitude,

                  longitude:
                    position
                      .coords
                      .longitude,

                };


                setCurrentLocation(
                  location
                );


                if (
                  websocket.readyState ===
                  WebSocket.OPEN
                ) {

                  websocket.send(
                    JSON.stringify({

                      type:
                        "location",

                      ...location,

                    })
                  );

                }

              },


              (error) => {

                console.warn(
                  "Browser GPS error:",
                  error
                );


                setTrackingStatus(
                  "Connected, but GPS permission is unavailable"
                );

              },


              {

                enableHighAccuracy:
                  true,

                maximumAge:
                  5000,

                timeout:
                  10000,

              }

            );

      }

    };


    // ========================================================
    // RECEIVE LOCATION
    // ========================================================

    websocket.onmessage =
      (event) => {

        try {

          const message =
            JSON.parse(
              event.data
            );


          if (

            message.type ===
              "location"

            &&

            typeof message.latitude ===
              "number"

            &&

            typeof message.longitude ===
              "number"

          ) {

            setCurrentLocation({

              latitude:
                message.latitude,

              longitude:
                message.longitude,

              timestamp:
                message.timestamp,

            });


            if (!isDriver) {

              setTrackingStatus(
                "Receiving live GPS position"
              );

            }

          }

        } catch (error) {

          console.warn(
            "Invalid tracking message:",
            error
          );

        }

      };


    // ========================================================
    // ERROR
    // ========================================================

    websocket.onerror =
      () => {

        setTrackingStatus(
          "Live tracking connection error"
        );

      };


    // ========================================================
    // CLOSE
    // ========================================================

    websocket.onclose =
      () => {

        setTrackingStatus(
          "Live tracking disconnected"
        );

      };


    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {

      if (
        watchIdRef.current !==
        null
      ) {

        navigator.geolocation?.clearWatch(
          watchIdRef.current
        );

        watchIdRef.current =
          null;

      }


      if (
        websocketRef.current
      ) {

        websocketRef.current.close();

        websocketRef.current =
          null;

      }


      setCurrentLocation(
        null
      );

    };

  }, [tripId]);


  // ============================================================
  // CURRENT VEHICLE MARKER
  // ============================================================

  useEffect(() => {

    const map =
      mapInstanceRef.current;


    const {
      AdvancedMarkerElement,
      PinElement,
    } =
      markerClassesRef.current;


    if (

      !map ||

      !AdvancedMarkerElement ||

      !PinElement ||

      !currentLocation

    ) {

      return;

    }


    const position = {

      lat:
        currentLocation
          .latitude,

      lng:
        currentLocation
          .longitude,

    };


    // Update existing marker
    if (
      currentMarkerRef.current
    ) {

      currentMarkerRef
        .current
        .position =
        position;


      map.panTo(
        position
      );


      return;

    }


    // Create vehicle marker
    const currentPin =
      new PinElement({

        background:
          "#2563EB",

        borderColor:
          "#FFFFFF",

        glyphColor:
          "#FFFFFF",

        glyphText:
          "V",

        scale:
          1.1,

      });


    currentMarkerRef.current =
      new AdvancedMarkerElement({

        map,

        position,

        title:
          "Current Vehicle Location",

        content:
          currentPin.element,

      });


    map.panTo(
      position
    );


  }, [
    currentLocation
  ]);


  // ============================================================
  // ERROR
  // ============================================================

  if (mapError) {

    return (

      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-xl">

        <div className="text-center px-6">

          <p className="text-red-500 font-medium">
            Unable to load Google Maps.
          </p>

          <p className="text-gray-500 text-sm mt-2">
            {mapError}
          </p>

        </div>

      </div>

    );

  }


  // ============================================================
  // MAP
  // ============================================================

  return (

    <div className="relative w-full h-full rounded-xl overflow-hidden">

      <div
        ref={mapRef}
        className="w-full h-full rounded-xl"
      />


      {tripId && (

        <div className="absolute top-4 left-4 z-10">

          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-950/90 border border-slate-700 shadow-lg">

            <span
              className={`w-2.5 h-2.5 rounded-full ${
                currentLocation
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-amber-400"
              }`}
            />

            <span className="text-xs font-medium text-white">

              {trackingStatus}

            </span>

          </div>

        </div>

      )}

    </div>

  );

}


export default LiveTrackingMap;