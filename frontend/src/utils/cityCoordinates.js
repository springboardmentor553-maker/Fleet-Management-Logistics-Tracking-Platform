export const CITY_COORDINATES = {
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'surat': { lat: 21.1702, lng: 72.8311 },
  'kanpur': { lat: 26.4499, lng: 80.3319 },
  'nagpur': { lat: 21.1458, lng: 79.0882 },
  'indore': { lat: 22.7196, lng: 75.8577 },
  'bhopal': { lat: 23.2599, lng: 77.4126 },
  'patna': { lat: 25.5941, lng: 85.1376 },
  'chandigarh': { lat: 30.7333, lng: 76.7794 },
  'coimbatore': { lat: 11.0168, lng: 76.9558 },
}

export function getCityCoords(cityName) {
  if (!cityName) return null
  const key = cityName.trim().toLowerCase()
  return CITY_COORDINATES[key] || null
}

export async function geocodeCity(cityName) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await response.json()
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
    return null
  } catch (err) {
    console.error('Geocoding failed:', err)
    return null
  }
}

export function haversineDistance(coord1, coord2) {
  const R = 6371 // Earth radius in km
  const toRad = (deg) => deg * (Math.PI / 180)
  const dLat = toRad(coord2.lat - coord1.lat)
  const dLng = toRad(coord2.lng - coord1.lng)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}