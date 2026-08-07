import axios from "axios";

// Convert location name to coordinates
export async function geocode(place) {
  const response = await axios.get(
    "https://nominatim.openstreetmap.org/search",
    {
      params: {
        q: place,
        format: "json",
        limit: 1,
      },
    }
  );

  if (response.data.length === 0) {
    throw new Error("Location not found");
  }

  return {
    lat: parseFloat(response.data[0].lat),
    lon: parseFloat(response.data[0].lon),
  };
}

// Generate route using OSRM
export async function generateRoute(start, end) {
  const response = await axios.get(
    `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}`,
    {
      params: {
        overview: "full",
        geometries: "geojson",
      },
    }
  );

  const route = response.data.routes[0];

  return {
    coordinates: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    distance: (route.distance / 1000).toFixed(2),
    duration: (route.duration / 60).toFixed(0),
  };
}