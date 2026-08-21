import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getWebSocketUrl } from '../api/websocket';
import {
  Package, MapPin, ChevronLeft, RefreshCw, AlertCircle,
  User, Truck, Milestone, Calendar, Map, CheckCircle2
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
  }, [map, JSON.stringify(bounds), JSON.stringify(center)]);
  return null;
};

// Beautiful Tailwind CSS-styled markers
const pickupIcon = L.divIcon({
  html: `<div class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse"><div class="w-2.5 h-2.5 rounded-full bg-white"></div></div>`,
  className: 'custom-div-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const destIcon = L.divIcon({
  html: `<div class="w-6 h-6 rounded-full bg-rose-500 border-2 border-slate-900 flex items-center justify-center shadow-lg shadow-rose-500/30 animate-pulse"><div class="w-2.5 h-2.5 rounded-full bg-white"></div></div>`,
  className: 'custom-div-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const vehicleIcon = L.divIcon({
  html: `<div class="w-6 h-6 rounded-full bg-sky-500 border-2 border-slate-900 flex items-center justify-center shadow-lg shadow-sky-500/50 animate-pulse"><div class="w-2.5 h-2.5 rounded-full bg-white"></div></div>`,
  className: 'custom-div-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const ShipmentTracking = () => {
  const { shipmentId } = useParams();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [driver, setDriver] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentLocation, setCurrentLocation] = useState(null);
  const [liveETA, setLiveETA] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);
  const [gpsInput, setGpsInput] = useState({ lat: '', lng: '' });
  const [gpsStatus, setGpsStatus] = useState('');

  useEffect(() => {
    fetchTrackingData();
  }, [shipmentId]);

  useEffect(() => {
    if (!shipment?.tracking_number) return;

    const ws = new WebSocket(getWebSocketUrl(`/ws/shipment/${shipment.tracking_number}`));

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'location_update') {
          setCurrentLocation([message.data.latitude, message.data.longitude]);
          setLiveStatus(message.data.status);
          if (message.data.eta) {
            setLiveETA(new Date(message.data.eta).toLocaleString());
          }
        } else if (message.type === 'trip_completed') {
          setLiveStatus(message.data.status);
          if (message.data.latitude && message.data.longitude) {
            setCurrentLocation([message.data.latitude, message.data.longitude]);
          }
        }
      } catch (e) {
        console.error("WebSocket message error:", e);
      }
    };

    return () => {
      if (ws.readyState === 1) ws.close();
    };
  }, [shipment?.tracking_number]);

  const fetchTrackingData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Shipment details
      const shipmentRes = await api.get(`/shipments/${shipmentId}`);
      const shipmentData = shipmentRes.data;
      setShipment(shipmentData);

      // 2. Fetch driver and vehicle if assigned
      const driverId = shipmentData.assigned_driver_id || shipmentData.driver_id;
      const vehicleId = shipmentData.assigned_vehicle_id || shipmentData.vehicle_id;

      if (driverId) {
        try {
          const driverRes = await api.get(`/drivers`);
          const foundDriver = driverRes.data.find(d => d.id === driverId);
          setDriver(foundDriver);
        } catch (e) {
          console.error("Failed to load driver details:", e);
        }
      }

      if (vehicleId) {
        try {
          const vehicleRes = await api.get(`/vehicles`);
          const foundVehicle = vehicleRes.data.find(v => v.id === vehicleId);
          setVehicle(foundVehicle);
        } catch (e) {
          console.error("Failed to load vehicle details:", e);
        }
      }

      // 3. Fetch Route details if trip is assigned
      const tripId = shipmentData.trip_id;
      if (tripId) {
        try {
          const routeRes = await api.get(`/trip/${tripId}/route`);
          const routeData = routeRes.data;
          setRouteInfo(routeData);
          
          if (routeData.current_location && shipmentData.current_status !== 'delivered' && shipmentData.current_status !== 'completed') {
            setCurrentLocation([routeData.current_location.latitude, routeData.current_location.longitude]);
          } else if (routeData.pickup_coordinates && (shipmentData.current_status === 'created' || shipmentData.current_status === 'assigned')) {
            setCurrentLocation([routeData.pickup_coordinates.latitude, routeData.pickup_coordinates.longitude]);
          } else if (routeData.destination_coordinates && (shipmentData.current_status === 'delivered' || shipmentData.current_status === 'completed')) {
            setCurrentLocation([routeData.destination_coordinates.latitude, routeData.destination_coordinates.longitude]);
          }
        } catch (e) {
          console.error("Failed to load trip route details:", e);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 401 ? 'Please login again.' : err.response?.status === 403 ? 'You are not authorized to access this page.' : err.response?.data?.detail || 'Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    setGpsStatus('Updating...');
    try {
      const lat = parseFloat(gpsInput.lat);
      const lng = parseFloat(gpsInput.lng);
      if (isNaN(lat) || isNaN(lng)) throw new Error("Invalid coordinates");
      
      await api.put(`/trips/${shipment.trip_id}/location`, {
        latitude: lat,
        longitude: lng
      });
      setGpsStatus('Location Updated!');
      setTimeout(() => setGpsStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setGpsStatus('Update Failed');
      setTimeout(() => setGpsStatus(''), 3000);
    }
  };

  useEffect(() => {
    // Only use driver's location if we don't already have one from the trip/socket
    if (driver && driver.current_latitude && driver.current_longitude && !currentLocation) {
      setCurrentLocation([driver.current_latitude, driver.current_longitude]);
    }
  }, [driver]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 animate-fadeIn">
        <RefreshCw size={24} className="animate-spin mx-auto mb-4 text-sky-400" />
        Loading Live Tracking Map...
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm max-w-lg mx-auto mt-12 space-y-4">
        <div className="flex items-center gap-3">
          <AlertCircle size={24} className="shrink-0" />
          <span className="font-semibold">Error Loading Shipment</span>
        </div>
        <p>{error || 'An unexpected error occurred.'}</p>
        <button
          onClick={() => navigate('/shipments')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs transition-colors"
        >
          Back to Shipments
        </button>
      </div>
    );
  }

  // Set up map coordinates
  const pickupLatLng = routeInfo?.pickup_coordinates
    ? [routeInfo.pickup_coordinates.latitude, routeInfo.pickup_coordinates.longitude]
    : null;

  const destLatLng = routeInfo?.destination_coordinates
    ? [routeInfo.destination_coordinates.latitude, routeInfo.destination_coordinates.longitude]
    : null;

  const defaultCenter = currentLocation || pickupLatLng || destLatLng || [39.50, -98.35];
  const bounds = [];
  if (pickupLatLng) bounds.push(pickupLatLng);
  if (destLatLng) bounds.push(destLatLng);

  const routePoints = routeInfo?.route_geometry || [];

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm font-semibold mb-2"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Live Shipment Tracking</h1>
            <span className={`text-[10px] uppercase font-bold tracking-wide px-2.5 py-1 rounded-full border mt-1 ${(liveStatus || shipment.current_status) === 'created' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                (liveStatus || shipment.current_status) === 'assigned' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  (liveStatus || shipment.current_status) === 'in_transit' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                    (liveStatus || shipment.current_status) === 'out_for_delivery' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      (liveStatus || shipment.current_status) === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        (liveStatus || shipment.current_status) === 'delayed' ? 'bg-amber-600/10 text-amber-500 border-amber-600/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
              {liveStatus || shipment.current_status}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">Real-time status updates and routing path mapping</p>
        </div>
        <button
          onClick={fetchTrackingData}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold rounded-xl text-xs transition-colors border border-slate-750 h-fit"
        >
          <RefreshCw size={12} className="shrink-0" />
          Refresh Status
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Shipment and Trip specs */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 lg:col-span-1 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
              <Package className="text-sky-400" size={16} />
              Cargo Details
            </h3>

            <div className="space-y-4">
              {/* Tracking number & status */}
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Tracking Number</p>
                <p className="font-mono text-lg font-bold text-sky-400 mt-0.5">#{shipment.tracking_number}</p>
              </div>

              {/* Origin */}
              <div className="flex gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl h-fit">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Pickup Point</p>
                  <p className="text-sm text-slate-200 font-medium mt-0.5">{shipment.pickup_location || shipment.origin}</p>
                </div>
              </div>

              {/* Destination */}
              <div className="flex gap-3">
                <div className="p-2 bg-red-500/10 text-red-400 rounded-xl h-fit">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Destination Point</p>
                  <p className="text-sm text-slate-200 font-medium mt-0.5">{shipment.delivery_location || shipment.destination}</p>
                </div>
              </div>

              <hr className="border-slate-850" />

              {/* Driver */}
              <div className="flex gap-3">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl h-fit">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Assigned Driver</p>
                  <p className="text-sm text-slate-200 font-medium mt-0.5">{driver ? driver.user_name : 'No driver assigned'}</p>
                  {driver && <p className="text-[10px] text-slate-400 font-mono mt-0.5">Lic: {driver.license_number}</p>}

                  {driver && !currentLocation && (liveStatus || shipment.current_status) === 'in_transit' && (
                    <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 text-xs flex items-center gap-2">
                      <RefreshCw size={12} className="animate-spin" />
                      Waiting for driver's live location...
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle */}
              <div className="flex gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl h-fit">
                  <Truck size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Assigned Asset</p>
                  <p className="text-sm text-slate-200 font-medium mt-0.5">
                    {vehicle ? `${vehicle.make} ${vehicle.model}` : 'No vehicle assigned'}
                  </p>
                  {vehicle && <p className="text-[10px] text-slate-400 font-mono mt-0.5">Plate: {vehicle.license_plate}</p>}
                </div>
              </div>

              {routeInfo && (
                <>
                  <hr className="border-slate-850" />

                  {/* Distance */}
                  <div className="flex gap-3">
                    <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl h-fit">
                      <Milestone size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase">Trip Distance</p>
                      <p className="text-sm text-white font-bold mt-0.5">{routeInfo.distance}</p>
                    </div>
                  </div>

                  {/* ETA */}
                  <div className="flex gap-3">
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl h-fit">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase">Estimated Time</p>
                      <p className="text-sm text-white font-bold mt-0.5">{liveETA || routeInfo.estimated_time}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Development GPS Simulator */}
          {import.meta.env.MODE === 'development' && shipment?.trip_id && (
            <div className="mt-6 border border-sky-500/30 bg-sky-500/10 rounded-xl p-4">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3">🛠️ Dev GPS Simulator</h4>
              <form onSubmit={handleUpdateLocation} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Latitude</label>
                    <input 
                      type="text" 
                      value={gpsInput.lat}
                      onChange={(e) => setGpsInput({...gpsInput, lat: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500"
                      placeholder="e.g. 40.712"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Longitude</label>
                    <input 
                      type="text" 
                      value={gpsInput.lng}
                      onChange={(e) => setGpsInput({...gpsInput, lng: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500"
                      placeholder="e.g. -74.006"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button type="submit" className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold transition-colors">
                    Update Location
                  </button>
                  {gpsStatus && <span className={`text-xs ${gpsStatus.includes('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>{gpsStatus}</span>}
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right column - Leaflet Map */}
        <div className="lg:col-span-2 min-h-[400px]">
          {routeInfo ? (
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
                  <Marker position={pickupLatLng} icon={pickupIcon}>
                    <Popup>
                      <div className="text-slate-900 font-sans p-1">
                        <p className="font-bold text-xs uppercase text-slate-400">Pickup Location</p>
                        <p className="font-semibold text-sm">{shipment.pickup_location || shipment.origin}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {destLatLng && (
                  <Marker position={destLatLng} icon={destIcon}>
                    <Popup>
                      <div className="text-slate-900 font-sans p-1">
                        <p className="font-bold text-xs uppercase text-slate-400">Destination Location</p>
                        <p className="font-semibold text-sm">{shipment.delivery_location || shipment.destination}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {currentLocation && (
                  <Marker position={currentLocation} icon={vehicleIcon}>
                    <Popup>
                      <div className="text-slate-900 font-sans p-1">
                        <p className="font-bold text-xs uppercase text-slate-400">Live Location</p>
                        <p className="font-semibold text-sm capitalize">Status: {(liveStatus || shipment.current_status).replace('_', ' ')}</p>
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
          ) : (
            <div className="w-full h-full rounded-2xl border border-slate-800 bg-[#070b1e]/50 flex flex-col items-center justify-center p-12 text-slate-400 text-center min-h-[400px]">
              <Map size={48} className="text-slate-600 mb-4" />
              <h4 className="text-white font-bold mb-2">No Map Routing Available</h4>
              <p className="text-sm max-w-sm text-slate-400">
                This shipment is not currently assigned to a scheduled delivery trip. Plan a route on the Trips screen to enable live mapping.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipmentTracking;
