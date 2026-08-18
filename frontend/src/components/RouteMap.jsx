import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import {
  useEffect,
  useMemo,
  useRef,
} from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

// =====================================================
// FIX DEFAULT LEAFLET MARKER ICON
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
// PICKUP ICON
// =====================================================

const pickupIcon = L.divIcon({
  className: "custom-map-marker",

  html: `
    <div style="
      width: 38px;
      height: 38px;
      background: #16a34a;
      border: 4px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      display:flex;
      align-items:center;
      justify-content:center;
    ">
      <div style="
        transform: rotate(45deg);
        color:white;
        font-size:18px;
        font-weight:bold;
      ">
        P
      </div>
    </div>
  `,

  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

// =====================================================
// DESTINATION ICON
// =====================================================

const destinationIcon = L.divIcon({
  className: "custom-map-marker",

  html: `
    <div style="
      width: 38px;
      height: 38px;
      background: #dc2626;
      border: 4px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      display:flex;
      align-items:center;
      justify-content:center;
    ">
      <div style="
        transform: rotate(45deg);
        color:white;
        font-size:18px;
        font-weight:bold;
      ">
        D
      </div>
    </div>
  `,

  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

// =====================================================
// VEHICLE ICON
// =====================================================

const vehicleIcon = L.divIcon({
  className: "vehicle-marker",

  html: `
    <div style="
      width: 48px;
      height: 48px;
      background: white;
      border: 3px solid #2563eb;
      border-radius: 50%;
      box-shadow:
        0 3px 10px rgba(0,0,0,0.35),
        0 0 0 6px rgba(37,99,235,0.15);
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:25px;
    ">
      🚚
    </div>
  `,

  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -24],
});

// =====================================================
// MAP AUTO FIT COMPONENT
// =====================================================

// =====================================================
// MAP AUTO FIT COMPONENT
// =====================================================

function FitRoute({
  pickup,
  destination,
  routeCoordinates,
}) {
  const map = useMap();

  // Prevent fitBounds from running again
  // after the user starts interacting with the map.
  const hasInitialFit = useRef(false);

  useEffect(() => {
    const points = [];

    // ---------------------------------------------------
    // PICKUP
    // ---------------------------------------------------

    if (
      pickup &&
      Number.isFinite(pickup[0]) &&
      Number.isFinite(pickup[1])
    ) {
      points.push(pickup);
    }

    // ---------------------------------------------------
    // DESTINATION
    // ---------------------------------------------------

    if (
      destination &&
      Number.isFinite(destination[0]) &&
      Number.isFinite(destination[1])
    ) {
      points.push(destination);
    }

    // ---------------------------------------------------
    // REAL ROAD ROUTE
    // ---------------------------------------------------

    if (
      Array.isArray(routeCoordinates) &&
      routeCoordinates.length > 1
    ) {
      points.push(
        ...routeCoordinates
      );
    }

    // Need at least two points
    if (points.length < 2) {
      return;
    }

    // ---------------------------------------------------
    // ONLY FIT THE MAP ONCE
    // ---------------------------------------------------

    if (hasInitialFit.current) {
      return;
    }

    const bounds =
      L.latLngBounds(points);

    map.fitBounds(
      bounds,
      {
        paddingTopLeft: [
          70,
          70,
        ],

        paddingBottomRight: [
          70,
          70,
        ],

        maxZoom: 9,

        animate: true,

        duration: 0.8,
      }
    );

    hasInitialFit.current = true;

  }, [
    map,
    pickup,
    destination,
    routeCoordinates,
  ]);

  return null;
}
// =====================================================
// MAP RESIZE FIX
// =====================================================

function MapResizeFix() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [map]);

  return null;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

function RouteMap({ routeData }) {
  // ===================================================
  // VALIDATE DATA
  // ===================================================

  if (!routeData) {
    return (
      <div className="alert alert-warning">
        Route data is not available.
      </div>
    );
  }

  // ===================================================
  // GET PICKUP COORDINATES
  // ===================================================

  const pickupLatitude = Number(
    routeData?.pickup_coordinates?.latitude ??
      routeData?.pickup?.latitude ??
      routeData?.pickup_latitude
  );

  const pickupLongitude = Number(
    routeData?.pickup_coordinates?.longitude ??
      routeData?.pickup?.longitude ??
      routeData?.pickup_longitude
  );

  // ===================================================
  // GET DESTINATION COORDINATES
  // ===================================================

  const destinationLatitude = Number(
    routeData?.destination_coordinates?.latitude ??
      routeData?.destination?.latitude ??
      routeData?.destination_latitude
  );

  const destinationLongitude = Number(
    routeData?.destination_coordinates?.longitude ??
      routeData?.destination?.longitude ??
      routeData?.destination_longitude
  );

  // ===================================================
  // GET VEHICLE COORDINATES
  // ===================================================

  const vehicleLatitude = Number(
    routeData?.vehicle_coordinates?.latitude ??
      routeData?.current_coordinates?.latitude ??
      routeData?.current_location?.latitude ??
      pickupLatitude
  );

  const vehicleLongitude = Number(
    routeData?.vehicle_coordinates?.longitude ??
      routeData?.current_coordinates?.longitude ??
      routeData?.current_location?.longitude ??
      pickupLongitude
  );

  // ===================================================
  // VALIDATE PICKUP
  // ===================================================

  const validPickup =
    Number.isFinite(pickupLatitude) &&
    Number.isFinite(pickupLongitude);

  // ===================================================
  // VALIDATE DESTINATION
  // ===================================================

  const validDestination =
    Number.isFinite(destinationLatitude) &&
    Number.isFinite(destinationLongitude);

  // ===================================================
  // VALIDATE VEHICLE
  // ===================================================

  const validVehicle =
    Number.isFinite(vehicleLatitude) &&
    Number.isFinite(vehicleLongitude);

  // ===================================================
  // INVALID COORDINATES
  // ===================================================

  if (!validPickup || !validDestination) {
    console.error(
      "Invalid RouteMap coordinates:",
      routeData
    );

    return (
      <div className="alert alert-danger">
        Unable to display route map because pickup
        or destination coordinates are invalid.
      </div>
    );
  }

  // ===================================================
  // CONVERT TO LEAFLET FORMAT
  //
  // Leaflet:
  // [latitude, longitude]
  //
  // GeoJSON:
  // [longitude, latitude]
  // ===================================================

  const pickupPosition = [
    pickupLatitude,
    pickupLongitude,
  ];

  const destinationPosition = [
    destinationLatitude,
    destinationLongitude,
  ];

  const vehiclePosition = validVehicle
    ? [
        vehicleLatitude,
        vehicleLongitude,
      ]
    : pickupPosition;

// ===================================================
// GET REAL ROAD ROUTE FROM BACKEND
//
// Backend sends:
// route_coordinates: [
//   [latitude, longitude],
//   [latitude, longitude],
//   ...
// ]
//
// The backend already converts OSRM coordinates
// into Leaflet format, so DO NOT reverse them.
// ===================================================

const routeCoordinates = useMemo(() => {

  const coordinates =
    routeData?.route_coordinates;

  if (!Array.isArray(coordinates)) {
    return [];
  }

  return coordinates.filter(
    (point) =>
      Array.isArray(point) &&
      point.length >= 2 &&
      Number.isFinite(Number(point[0])) &&
      Number.isFinite(Number(point[1]))
  );

}, [routeData?.route_coordinates]);

// ===================================================
// FINAL ROUTE
// ===================================================

const finalRouteCoordinates =
  routeCoordinates.length > 1
    ? routeCoordinates
    : [
        pickupPosition,
        destinationPosition,
      ];

  // ===================================================
  // DISTANCE
  // ===================================================

  const distance =
    routeData?.distance_km ??
    routeData?.distance ??
    routeData?.total_distance_km;

  // ===================================================
  // STATUS
  // ===================================================

  const status =
    routeData?.trip_status ??
    routeData?.status ??
    "Scheduled";

  // ===================================================
  // MAP CENTER
  // ===================================================

  const center = pickupPosition;

  // ===================================================
  // RETURN MAP
  // ===================================================

  return (
    <div
      style={{
        width: "100%",
        marginTop: "20px",
      }}
    >
      {/* =============================================
          MAP HEADER
      ============================================= */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: "12px",
          padding: "0 5px",
        }}
      >
        <div>
          <h5
            style={{
              margin: 0,
              fontWeight: 700,
            }}
          >
            🗺️ Live Route Map
          </h5>

          <small
            style={{
              color: "#64748b",
            }}
          >
            Real road route with live
            vehicle position
          </small>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <span
            style={{
              background:
                "#dcfce7",
              color:
                "#166534",
              padding:
                "5px 10px",
              borderRadius:
                "20px",
              fontSize:
                "12px",
              fontWeight: 600,
            }}
          >
            ● Live
          </span>

          {distance !==
            undefined &&
            distance !== null && (
              <span
                style={{
                  background:
                    "#eff6ff",
                  color:
                    "#1d4ed8",
                  padding:
                    "5px 10px",
                  borderRadius:
                    "20px",
                  fontSize:
                    "12px",
                  fontWeight: 600,
                }}
              >
                {Number(
                  distance
                ).toFixed(2)}{" "}
                km
              </span>
            )}
        </div>
      </div>

      {/* =============================================
          MAP
      ============================================= */}

      <div
        style={{
          width: "100%",
          height: "600px",
          borderRadius: "18px",
          overflow: "hidden",
          border:
            "1px solid #dbe3ec",
          boxShadow:
            "0 8px 30px rgba(15,23,42,0.12)",
          position: "relative",
        }}
      >
        <MapContainer
          center={center}
          zoom={7}
          scrollWheelZoom={true}
          dragging={true}
          doubleClickZoom={true}
          touchZoom={true}
          boxZoom={true}
          keyboard={true}
          zoomControl={true}
          attributionControl={true}
          style={{
            width: "100%",
            height: "100%",
          }}
        >

          {/* =========================================
              REALISTIC MAP TILES
          ========================================= */}

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />

          {/* =========================================
              AUTO FIT
          ========================================= */}

          <FitRoute
            pickup={
              pickupPosition
            }
            destination={
              destinationPosition
            }
            
            routeCoordinates={
              finalRouteCoordinates
            }
          />

          {/* =========================================
              RESIZE FIX
          ========================================= */}

          <MapResizeFix />

          {/* =========================================
              ROUTE OUTER CASING
              Makes route look like a real
              highlighted road.
          ========================================= */}

          <Polyline
            positions={
              finalRouteCoordinates
            }
            pathOptions={{
              color: "#0f172a",
              weight: 10,
              opacity: 0.30,
              lineCap: "round",
              lineJoin: "round",
            }}
          />

          {/* =========================================
              MAIN ROUTE
          ========================================= */}

          <Polyline
            positions={
              finalRouteCoordinates
            }
            pathOptions={{
              color: "#2563eb",
              weight: 6,
              opacity: 0.95,
              lineCap: "round",
              lineJoin: "round",
            }}
          />

          {/* =========================================
              PICKUP MARKER
          ========================================= */}

          <Marker
            position={
              pickupPosition
            }
            icon={
              pickupIcon
            }
          >
            <Popup>
              <div
                style={{
                  minWidth:
                    "180px",
                }}
              >
                <strong
                  style={{
                    color:
                      "#15803d",
                  }}
                >
                  🟢 Pickup
                </strong>

                <br />

                <span>
                  {routeData?.pickup_location ||
                    "Pickup Location"}
                </span>

                <br />

                <small>
                  {pickupLatitude.toFixed(
                    6
                  )}
                  ,{" "}
                  {pickupLongitude.toFixed(
                    6
                  )}
                </small>
              </div>
            </Popup>
          </Marker>

          {/* =========================================
              DESTINATION MARKER
          ========================================= */}

          <Marker
            position={
              destinationPosition
            }
            icon={
              destinationIcon
            }
          >
            <Popup>
              <div
                style={{
                  minWidth:
                    "180px",
                }}
              >
                <strong
                  style={{
                    color:
                      "#dc2626",
                  }}
                >
                  🔴 Destination
                </strong>

                <br />

                <span>
                  {routeData?.destination_location ||
                    "Destination"}
                </span>

                <br />

                <small>
                  {destinationLatitude.toFixed(
                    6
                  )}
                  ,{" "}
                  {destinationLongitude.toFixed(
                    6
                  )}
                </small>
              </div>
            </Popup>
          </Marker>

          {/* =========================================
              LIVE VEHICLE
          ========================================= */}

          {validVehicle && (
            <Marker
              position={
                vehiclePosition
              }
              icon={
                vehicleIcon
              }
            >
              <Popup>
                <div
                  style={{
                    minWidth:
                      "200px",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "#2563eb",
                      fontSize:
                        "15px",
                    }}
                  >
                    🚚 Live Vehicle
                  </strong>

                  <hr
                    style={{
                      margin:
                        "7px 0",
                    }}
                  />

                  <div>
                    <strong>
                      Status:
                    </strong>{" "}
                    {status}
                  </div>

                  <div>
                    <strong>
                      Latitude:
                    </strong>{" "}
                    {vehicleLatitude.toFixed(
                      6
                    )}
                  </div>

                  <div>
                    <strong>
                      Longitude:
                    </strong>{" "}
                    {vehicleLongitude.toFixed(
                      6
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

        </MapContainer>

        {/* =========================================
            MAP LEGEND
        ========================================= */}

        <div
          style={{
            position:
              "absolute",
            bottom: "20px",
            left: "20px",
            zIndex: 1000,
            background:
              "rgba(255,255,255,0.96)",
            padding:
              "12px 15px",
            borderRadius:
              "10px",
            boxShadow:
              "0 3px 12px rgba(0,0,0,0.2)",
            fontSize:
              "13px",
          }}
        >
          <div
            style={{
              marginBottom:
                "6px",
              fontWeight:
                600,
            }}
          >
            Route Legend
          </div>

          <div
            style={{
              marginBottom:
                "4px",
            }}
          >
            🟢 Pickup
          </div>

          <div
            style={{
              marginBottom:
                "4px",
            }}
          >
            🔴 Destination
          </div>

          <div>
            🚚 Live Vehicle
          </div>
        </div>
      </div>

      {/* =============================================
          MAP INFORMATION
      ============================================= */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          marginTop: "10px",
          color: "#64748b",
          fontSize: "13px",
        }}
      >
        <span>
          🖱️ Scroll to zoom
        </span>

        <span>
          ✋ Drag to move
        </span>

        <span>
          🔍 Use + / − to zoom
        </span>

        <span>
          📍 Click markers for details
        </span>
      </div>
    </div>
  );
}

export default RouteMap;