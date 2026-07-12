// Fetches a real driving route between two points using OSRM (free, no API key needed)
export async function getRoute(origin, destination) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
    const response = await fetch(url)
    const data = await response.json()

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null
    }

    const route = data.routes[0]
    // GeoJSON gives [lng, lat] pairs — Leaflet needs [lat, lng], so we flip them
    const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])

    return {
      coordinates,
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
    }
  } catch (err) {
    console.error('Routing failed:', err)
    return null
  }
}

// Given a route's coordinate list and a progress value (0 to 1), finds the point along the route
export function getPositionAlongRoute(coordinates, progress) {
  if (!coordinates || coordinates.length < 2) return null

  // Calculate cumulative distance along the route
  const segmentDistances = []
  let totalDistance = 0
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lat1, lng1] = coordinates[i]
    const [lat2, lng2] = coordinates[i + 1]
    const d = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2))
    segmentDistances.push(d)
    totalDistance += d
  }

  const targetDistance = totalDistance * progress
  let accumulated = 0

  for (let i = 0; i < segmentDistances.length; i++) {
    if (accumulated + segmentDistances[i] >= targetDistance) {
      const segmentProgress = segmentDistances[i] === 0 ? 0 : (targetDistance - accumulated) / segmentDistances[i]
      const [lat1, lng1] = coordinates[i]
      const [lat2, lng2] = coordinates[i + 1]
      return {
        lat: lat1 + (lat2 - lat1) * segmentProgress,
        lng: lng1 + (lng2 - lng1) * segmentProgress,
      }
    }
    accumulated += segmentDistances[i]
  }

  return { lat: coordinates[coordinates.length - 1][0], lng: coordinates[coordinates.length - 1][1] }
}