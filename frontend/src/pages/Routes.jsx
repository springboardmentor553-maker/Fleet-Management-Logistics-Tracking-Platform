import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { Route as RouteIcon, MapPin, Clock, Fuel, IndianRupee, Navigation, Zap, ArrowRightLeft } from 'lucide-react'
import { getCityCoords, geocodeCity } from '../utils/cityCoordinates'
import { getRouteOptions } from '../utils/routing'

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
  return routeOptions.fastest
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
          <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%', borderRadius: '10px' }} scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; MapTiler &copy; OpenStreetMap contributors'
              url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_KEY}`}
            />
            {originCoords && <Marker position={[originCoords.lat, originCoords.lng]}><Popup><strong>{origin}</strong></Popup></Marker>}
            {destCoords && <Marker position={[destCoords.lat, destCoords.lng]}><Popup><strong>{destination}</strong></Popup></Marker>}
            {activeRoute && <Polyline positions={activeRoute.coordinates} pathOptions={{ color: '#aa3bff', weight: 4 }} />}
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
            Fuel Efficient and Traffic Avoidance are approximated using the shortest/fastest routes available,
            since real-time traffic and fuel-consumption data require a paid API.
          </p>
        </>
      )}
    </div>
  )
}