// Uses Google's DirectionsService to get real, traffic-aware routes.
// Requires the Google Maps JS script to already be loaded on the page.
export function getGoogleRouteOptions(origin, destination) {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error('Google Maps not loaded yet'))
      return
    }

    const directionsService = new window.google.maps.DirectionsService()

    directionsService.route(
        {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true,
            drivingOptions: {
                departureTime: new Date(), // "now" — enables real-time traffic data
                trafficModel: 'bestguess',
            },
        },
        (result, status) => {
            console.log('Directions API status:', status, result)
            if (status !== 'OK' || !result.routes || result.routes.length === 0) {
                resolve(null)
                return
        }

        const parsedRoutes = result.routes.map((route) => {
          const leg = route.legs[0]
          return {
            coordinates: route.overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() })),
            distanceKm: leg.distance.value / 1000,
            durationMin: leg.duration.value / 60,
            // duration_in_traffic reflects current real traffic conditions
            durationInTrafficMin: leg.duration_in_traffic
              ? leg.duration_in_traffic.value / 60
              : leg.duration.value / 60,
          }
        })

        // Fastest = lowest travel time accounting for current traffic
        const fastest = parsedRoutes.reduce((a, b) => (a.durationInTrafficMin <= b.durationInTrafficMin ? a : b))
        // Shortest = lowest distance, regardless of traffic
        const shortest = parsedRoutes.reduce((a, b) => (a.distanceKm <= b.distanceKm ? a : b))
        // Traffic avoidance = the route with the smallest traffic delay (duration_in_traffic - duration)
        const trafficAvoidance = parsedRoutes.reduce((a, b) => {
          const delayA = a.durationInTrafficMin - a.durationMin
          const delayB = b.durationInTrafficMin - b.durationMin
          return delayA <= delayB ? a : b
        })

        resolve({
          fastest,
          shortest,
          trafficAvoidance,
          hasAlternatives: parsedRoutes.length > 1,
        })
      }
    )
  })
}