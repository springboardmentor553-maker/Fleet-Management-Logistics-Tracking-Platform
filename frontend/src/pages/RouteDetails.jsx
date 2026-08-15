import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  MapPin, Navigation, Calendar, RefreshCw, ChevronLeft, 
  Map, Milestone, Compass, AlertCircle 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Dynamic map view centering component
const ChangeMapView = ({ center, bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, bounds, map]);
  return null;
};

// Beautiful Tailwind CSS-styled markers
const createPickupIcon = () => L.divIcon({
  html: `<div class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse"><div class="w-2.5 h-2.5 rounded-full bg-white"></div></div>`,
  className: 'custom-div-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const createDestIcon = () => L.divIcon({
  html: `<div class="w-6 h-6 rounded-full bg-rose-500 border-2 border-slate-900 flex items-center justify-center shadow-lg shadow-rose-500/30 animate-pulse"><div class="w-2.5 h-2.5 rounded-full bg-white"></div></div>`,
  className: 'custom-div-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const RouteDetails = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [routeInfo, setRouteInfo] = useState(null);
  const [tripInfo, setTripInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRouteData();
  }, [tripId]);

  const fetchRouteData = async () => {
    setLoading(true);
    setError('');
    try {
      const [routeRes, tripRes] = await Promise.all([
        api.get(`/trip/${tripId}/route`),
        api.get(`/trips/${tripId}`)
      ]);
      setRouteInfo(routeRes.data);
      setTripInfo(tripRes.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 401 ? 'Please login again.' : err.response?.status === 403 ? 'You are not authorized to access this page.' : err.response?.data?.detail || 'Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 animate-fadeIn">
        <RefreshCw size={24} className="animate-spin mx-auto mb-4 text-sky-400" />
        Loading route maps database...
      </div>
    );
  }

  if (error || !routeInfo) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm max-w-lg mx-auto mt-12 space-y-4">
        <div className="flex items-center gap-3">
          <AlertCircle size={24} className="shrink-0" />
          <span className="font-semibold">Error Loading Route Details</span>
        </div>
        <p>{error || 'An unexpected error occurred.'}</p>
        <button 
          onClick={() => navigate('/dispatcher')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs transition-colors"
        >
          Back to Workspace
        </button>
      </div>
    );
  }

  // Render OpenStreetMap interactive Leaflet Map
  const renderLeafletMap = () => {
    const pickupCo = routeInfo.pickup_coordinates;
    const destCo = routeInfo.destination_coordinates;
    
    const pickupLatLng = pickupCo ? [pickupCo.latitude, pickupCo.longitude] : null;
    const destLatLng = destCo ? [destCo.latitude, destCo.longitude] : null;
    
    const defaultCenter = pickupLatLng || destLatLng || [39.50, -98.35];
    const bounds = [];
    if (pickupLatLng) bounds.push(pickupLatLng);
    if (destLatLng) bounds.push(destLatLng);
    
    const routePoints = routeInfo.route_geometry || [];
    
    return (
      <div className="w-full h-full rounded-2xl border border-slate-800 overflow-hidden relative shadow-2xl min-h-[400px] z-10">
        <MapContainer
          center={defaultCenter}
          zoom={6}
          scrollWheelZoom={true}
          className="w-full h-full"
          style={{ background: '#0a0f24' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {pickupLatLng && (
            <Marker position={pickupLatLng} icon={createPickupIcon()}>
              <Popup>
                <div className="text-slate-900 font-sans p-1">
                  <p className="font-bold text-xs uppercase text-slate-400">Pickup Location</p>
                  <p className="font-semibold text-sm">{routeInfo.pickup_location}</p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {destLatLng && (
            <Marker position={destLatLng} icon={createDestIcon()}>
              <Popup>
                <div className="text-slate-900 font-sans p-1">
                  <p className="font-bold text-xs uppercase text-slate-400">Destination Location</p>
                  <p className="font-semibold text-sm">{routeInfo.destination}</p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {routePoints.length > 0 && (
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: '#38bdf8',
                weight: 4,
                opacity: 0.85,
                lineJoin: 'round',
                lineCap: 'round'
              }}
            />
          )}
          
          <ChangeMapView center={defaultCenter} bounds={bounds} />
        </MapContainer>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Back navigation */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm font-semibold mb-2"
      >
        <ChevronLeft size={16} />
        Back to Workspace
      </button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Route Details</h1>
        <p className="text-slate-400 text-sm mt-1">Live OpenStreetMap Leaflet routing, geocoded coordinates, and OSRM distance metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Details Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 lg:col-span-1 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
              <Compass className="text-sky-400" size={16} />
              Routing Metrics
            </h3>

            <div className="space-y-4">
              {/* Pickup location */}
              <div className="flex gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl h-fit">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Pickup Point</p>
                  <p className="text-sm text-slate-200 font-medium mt-0.5">{routeInfo.pickup_location}</p>
                  {tripInfo?.pickup_latitude && (
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Lat: {tripInfo.pickup_latitude.toFixed(4)}, Lng: {tripInfo.pickup_longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>

              {/* Destination location */}
              <div className="flex gap-3">
                <div className="p-2 bg-red-500/10 text-red-400 rounded-xl h-fit">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Destination Point</p>
                  <p className="text-sm text-slate-200 font-medium mt-0.5">{routeInfo.destination}</p>
                  {tripInfo?.destination_latitude && (
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Lat: {tripInfo.destination_latitude.toFixed(4)}, Lng: {tripInfo.destination_longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>

              <hr className="border-slate-800" />

              {/* Distance */}
              <div className="flex gap-3">
                <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl h-fit">
                  <Milestone size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Total Distance</p>
                  <p className="text-lg text-white font-bold mt-0.5">{routeInfo.distance}</p>
                </div>
              </div>

              {/* ETA */}
              <div className="flex gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl h-fit">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Estimated Time</p>
                  <p className="text-lg text-white font-bold mt-0.5">{routeInfo.estimated_travel_time}</p>
                </div>
              </div>

              {/* Route Summary */}
              <div className="flex gap-3">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl h-fit">
                  <Map size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Highway / Route Summary</p>
                  <p className="text-sm text-slate-200 font-medium mt-0.5">{routeInfo.route_summary}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={fetchRouteData}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold rounded-xl text-xs transition-colors border border-slate-750"
            >
              <RefreshCw size={12} />
              Re-Calculate Route
            </button>
          </div>
        </div>

        {/* Map Visualization */}
        <div className="lg:col-span-2 min-h-[400px]">
          {renderLeafletMap()}
        </div>
      </div>
    </div>
  );
};

export default RouteDetails;
