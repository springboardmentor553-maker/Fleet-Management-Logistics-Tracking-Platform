import { useEffect, useRef, useState } from "react";
import {
  setOptions,
  importLibrary,
} from "@googlemaps/js-api-loader";

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function LiveTrackingMap({
  polyline,
  pickupLocation,
  destination,
}) {
  const mapRef = useRef(null);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    if (!polyline || !mapRef.current) {
      return;
    }

    const loadMap = async () => {
      try {
        setMapError("");

        if (!GOOGLE_MAPS_API_KEY) {
          throw new Error(
            "Google Maps API key is missing."
          );
        }

        // Configure Google Maps loader
        setOptions({
          key: GOOGLE_MAPS_API_KEY,
          v: "weekly",
        });

        // Load required libraries
        const { Map, Polyline } =
          await importLibrary("maps");

        const { LatLngBounds } =
          await importLibrary("core");

        const {
          AdvancedMarkerElement,
          PinElement,
        } = await importLibrary("marker");

        const { encoding } =
          await importLibrary("geometry");

        // Decode the route polyline
        const path = encoding.decodePath(polyline);

        if (!path || path.length === 0) {
          throw new Error(
            "Route polyline could not be decoded."
          );
        }

        // Create Google Map
        const map = new Map(mapRef.current, {
          center: path[Math.floor(path.length / 2)],
          zoom: 6,

          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,

          gestureHandling: "greedy",

          // Dark Google Maps styling
          styles: [
            {
              elementType: "geometry",
              stylers: [
                {
                  color: "#1d2a3a",
                },
              ],
            },
            {
              elementType: "labels.text.fill",
              stylers: [
                {
                  color: "#8fa3b8",
                },
              ],
            },
            {
              elementType: "labels.text.stroke",
              stylers: [
                {
                  color: "#1d2a3a",
                },
              ],
            },
            {
              featureType: "administrative",
              elementType: "geometry",
              stylers: [
                {
                  color: "#475569",
                },
              ],
            },
            {
              featureType: "administrative.country",
              elementType: "labels.text.fill",
              stylers: [
                {
                  color: "#a8b5c4",
                },
              ],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [
                {
                  color: "#334155",
                },
              ],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [
                {
                  color: "#1e293b",
                },
              ],
            },
            {
              featureType: "road",
              elementType: "labels.text.fill",
              stylers: [
                {
                  color: "#94a3b8",
                },
              ],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [
                {
                  color: "#475569",
                },
              ],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [
                {
                  color: "#1e293b",
                },
              ],
            },
            {
              featureType: "road.highway",
              elementType: "labels.text.fill",
              stylers: [
                {
                  color: "#cbd5e1",
                },
              ],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [
                {
                  color: "#0f172a",
                },
              ],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [
                {
                  color: "#64748b",
                },
              ],
            },
            {
              featureType: "poi",
              elementType: "geometry",
              stylers: [
                {
                  color: "#263548",
                },
              ],
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [
                {
                  color: "#94a3b8",
                },
              ],
            },
            {
              featureType: "transit",
              elementType: "geometry",
              stylers: [
                {
                  color: "#263548",
                },
              ],
            },
          ],
        });

        // Draw route
        const routeLine = new Polyline({
          path,
          geodesic: true,
          strokeColor: "#2563EB",
          strokeOpacity: 0.95,
          strokeWeight: 5,
        });

        routeLine.setMap(map);

        // Fit map to route
        const bounds = new LatLngBounds();

        path.forEach((point) => {
          bounds.extend(point);
        });

        map.fitBounds(bounds);

        // ------------------------------------
        // PICKUP MARKER
        // ------------------------------------

        const pickupPin = new PinElement({
          background: "#10B981",
          borderColor: "#FFFFFF",
          glyphColor: "#FFFFFF",
          glyphText: "P",
        });

        new AdvancedMarkerElement({
          map,
          position: path[0],
          title:
            pickupLocation || "Pickup Location",
          content: pickupPin.element,
        });

        // ------------------------------------
        // DESTINATION MARKER
        // ------------------------------------

        const destinationPin = new PinElement({
          background: "#EF4444",
          borderColor: "#FFFFFF",
          glyphColor: "#FFFFFF",
          glyphText: "D",
        });

        new AdvancedMarkerElement({
          map,
          position: path[path.length - 1],
          title:
            destination || "Destination",
          content: destinationPin.element,
        });

      } catch (error) {
        console.error(
          "Google Maps error:",
          error
        );

        setMapError(
          error.message ||
            "Unable to load Google Maps."
        );
      }
    };

    loadMap();
  }, [
    polyline,
    pickupLocation,
    destination,
  ]);

  // Error display
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

  // Google Map container
  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-xl"
    />
  );
}

export default LiveTrackingMap;