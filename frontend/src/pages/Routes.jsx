import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Route as RouteIcon, MapPin, Clock, Fuel, IndianRupee, Navigation, Zap, ArrowRightLeft } from 'lucide-react'
import { getCityCoords, geocodeCity } from '../utils/cityCoordinates'
import { getRouteOptions } from '../utils/routing'

// Leaflet's default marker icons don't resolve correctly through Vite's bundler
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Rough estimate assumptions — used only to approximate fuel cost, not real-time data
const AVG_FUEL_PRICE_PER_LITRE = 100
const AVG_MILEAGE_KM_PER_LITRE = 5

const ROUTE_TYPES = [
  { key: 'shortest', label: 'Shortest Route', icon: MapPin },
  { key: 'fastest', label: 'Fastest Route', icon: Zap },
  { key: 'fuel_efficient', label: 'Fuel Efficient', icon: Fuel },
  { key: 'traffic_avoidance', label: 'Traffic Avoidance', icon: ArrowRightLeft },
]

function resolveRouteForType(routeOptions, type) {
  if (!routeOptions) return null
  if (type === 'shortest' || type === 'fuel_efficient') return routeOptions.shortest
  // OSRM's free tier has no live traffic data, so "fastest" and "traffic avoidance"
  // both resolve to the same time-optimized route.
  return routeOptions.fastest
}

// Keeps the map's view fitted to whatever markers/route are currently shown
function FitBounds({ positions }) {
  const map = useMap()
  useState(() => {
    if (positions && positions.length > 0) {
      map.fitBounds(positions, { padding: [30, 30] })
    }
  }, [positions])
  return null
}

export default function RoutesPage() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [originCoords, setOriginCoords] = useState(null)
  const [destCoords, setDestCoords] = useState(null)
  const [routeOptions, setRouteOptions] = useState(null)
  const [routeType, setRouteType] = useState('fastest')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setRouteOptions(null)

    try {
      let o = getCityCoords(origin)
      let d = getCityCoords(destination)
      if (!o) o = await geocodeCity(origin)
      if (!d) d = await geocodeCity(destination)

      if (!o || !d) {
        setError(`Could not find location for "${!o ? origin : destination}"`)
        setLoading(false)
        return
      }

      setOriginCoords(o)
      setDestCoords(d)

      const options = await getRouteOptions(o, d)
      if (!options) {
        setError('Could not calculate a route between these locations')
        setLoading(false)
        return
      }

      setRouteOptions(options)
      setRouteType('fastest')
    } catch (err) {
      setError('Something went wrong while generating the route')
    } finally {
      setLoading(false)
    }
  }

  const activeRoute = resolveRouteForType(routeOptions, routeType)
  const estimatedFuelCost = activeRoute
    ? Math.round((activeRoute.distanceKm / AVG_MILEAGE_KM_PER_LITRE) * AVG_FUEL_PRICE_PER_LITRE)
    : null

  const center = originCoords && destCoords
    ? [(originCoords.lat + destCoords.lat) / 2, (originCoords.lng + destCoords.lng) / 2]
    : [22.9734, 78.6569]

  const fitPositions = activeRoute?.coordinates?.length > 1
    ? activeRoute.coordinates
    : (originCoords && destCoords ? [[originCoords.lat, originCoords.lng], [destCoords.lat, destCoords.lng]] : [])

  return (
    <div className="ff-section">
      <div className="ff-page-header">
        <div>
          <div className="ff-section-title"><RouteIcon size={16} /><span>Route Optimization</span></div>
          <p className="ff-page-subtitle">Plan and compare routes between two locations</p>
        </div>
      </div>

      <div className="ff-routes-layout">
        {/* Left: Route Details panel */}
        <div className="ff-route-panel">
          <div className="ff-widget-title" style={{ marginBottom: 12 }}><span>Route Details</span></div>

          <form onSubmit={handleGenerate} className="ff-route-form-vertical">
            <div className="ff-route-input-group">
              <label>From</label>
              <input placeholder="e.g. Delhi" value={origin} onChange={(e) => setOrigin(e.target.value)} required />
            </div>
            <div className="ff-route-input-group">
              <label>To</label>
              <input placeholder="e.g. Mumbai" value={destination} onChange={(e) => setDestination(e.target.value)} required />
            </div>
            <button type="submit" className="ff-btn-primary" disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? 'Generating...' : 'Generate Route'}
            </button>
          </form>

          {error && <div className="ff-modal-error" style={{ marginTop: 14 }}>{error}</div>}

          {activeRoute && (
            <div className="ff-route-stats-list">
              <div className="ff-route-stat-row">
                <Navigation size={15} />
                <div>
                  <div className="ff-route-detail-label">Distance</div>
                  <div className="ff-route-detail-value">{Math.round(activeRoute.distanceKm)} km</div>
                </div>
              </div>
              <div className="ff-route-stat-row">
                <Clock size={15} />
                <div>
                  <div className="ff-route-detail-label">Estimated Time</div>
                  <div className="ff-route-detail-value">
                    {Math.floor(activeRoute.durationMin / 60)}h {Math.round(activeRoute.durationMin % 60)}m
                  </div>
                </div>
              </div>
              <div className="ff-route-stat-row">
                <IndianRupee size={15} />
                <div>
                  <div className="ff-route-detail-label">Est. Fuel Cost (approx.)</div>
                  <div className="ff-route-detail-value">&#8377;{estimatedFuelCost}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Map */}
        <div className="ff-tracking-map" style={{ minHeight: 320 }}>
          <MapContainer
            center={center}
            zoom={originCoords && destCoords ? 6 : 4.5}
            style={{ width: '100%', height: '100%', borderRadius: '10px' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {fitPositions.length > 0 && <FitBounds positions={fitPositions} />}

            {originCoords && <Marker position={[originCoords.lat, originCoords.lng]} />}
            {destCoords && <Marker position={[destCoords.lat, destCoords.lng]} />}
            {activeRoute && (
              <Polyline
                positions={activeRoute.coordinates}
                pathOptions={{ color: '#aa3bff', weight: 4 }}
              />
            )}
          </MapContainer>
        </div>
      </div>

      {routeOptions && activeRoute && (
        <>
          <div className="ff-route-type-grid" style={{ marginTop: 16 }}>
            {ROUTE_TYPES.map(rt => {
              const Icon = rt.icon
              return (
                <button
                  key={rt.key}
                  className={`ff-route-type-card ${routeType === rt.key ? 'active' : ''}`}
                  onClick={() => setRouteType(rt.key)}
                  type="button"
                >
                  <Icon size={18} />
                  <span>{rt.label}</span>
                </button>
              )
            })}
          </div>

          {!routeOptions.hasAlternatives && (
            <p style={{ fontSize: 11, color: '#c9820a', marginTop: 10, fontWeight: 500 }}>
              Only one road path was found between these locations, so all four options currently show the same route and distance.
            </p>
          )}

          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
            Routes are calculated from OpenStreetMap's free road network data. Fastest Route and Traffic Avoidance
            currently show the same time-optimized path, since live traffic conditions aren't available on the free tier.
            Fuel Efficient is approximated from the shortest-distance route, since fuel-consumption data requires vehicle-specific inputs.
          </p>
        </>
      )}
    </div>
  )
}
