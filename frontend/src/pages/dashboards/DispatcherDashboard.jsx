import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Package, MapPin, Plus, UserCheck, Truck, 
  CheckCircle2, AlertCircle, RefreshCw, Calendar, Map
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

const DispatcherDashboard = () => {
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states for creating a Shipment
  const [newShipment, setNewShipment] = useState({
    sender_name: '', receiver_name: '', pickup_location: '', delivery_location: '',
    weight: ''
  });
  const [showShipmentForm, setShowShipmentForm] = useState(false);

  // States for assignment and active trips routing
  const [assigningShipment, setAssigningShipment] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [selectedTripRoute, setSelectedTripRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedTripId) {
      fetchTripRoute(selectedTripId);
    } else {
      setSelectedTripRoute(null);
    }
  }, [selectedTripId]);

  const fetchTripRoute = async (tripId) => {
    setLoadingRoute(true);
    try {
      const res = await api.get(`/trip/${tripId}/route`);
      setSelectedTripRoute(res.data);
    } catch (e) {
      console.error("Failed to fetch selected trip route:", e);
    } finally {
      setLoadingRoute(false);
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const [shipmentsRes, driversRes, vehiclesRes, tripsRes] = await Promise.all([
        api.get('/shipments'),
        api.get('/drivers'),
        api.get('/vehicles'),
        api.get('/trips')
      ]);
      setShipments(shipmentsRes.data);
      setDrivers(driversRes.data.filter(d => d.status === 'available'));
      setVehicles(vehiclesRes.data.filter(v => v.status === 'active'));
      setTrips(tripsRes.data);
    } catch (err) {
      console.error(err);
      setError('Unable to connect to the server. Please verify your permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      ...newShipment,
      weight: newShipment.weight ? parseFloat(newShipment.weight) : null
    };

    try {
      await api.post('/shipments', payload);
      setSuccess('Shipment created successfully!');
      setShowShipmentForm(false);
      setNewShipment({
        sender_name: '', receiver_name: '', pickup_location: '', delivery_location: '',
        weight: ''
      });
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 401 ? 'Please login again.' : err.response?.status === 403 ? 'You are not authorized to access this page.' : err.response?.data?.detail || 'Unable to connect to the server.');
    }
  };

  const handleAssignTrip = async (e) => {
    e.preventDefault();
    if (!assigningShipment) return;
    setError('');
    setSuccess('');

    const payload = {
      driver_id: selectedDriver ? parseInt(selectedDriver) : null,
      vehicle_id: selectedVehicle ? parseInt(selectedVehicle) : null,
      status: 'assigned'
    };

    try {
      await api.put(`/shipments/${assigningShipment.id}`, payload);
      
      // Update Driver status to on_trip if assigned
      if (selectedDriver) {
        await api.put(`/drivers/${selectedDriver}`, { status: 'on_trip' });
      }

      setSuccess(`Shipment #${assigningShipment.shipment_number} assigned successfully!`);
      setAssigningShipment(null);
      setSelectedDriver('');
      setSelectedVehicle('');
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 401 ? 'Please login again.' : err.response?.status === 403 ? 'You are not authorized to access this page.' : err.response?.data?.detail || 'Unable to connect to the server.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Dispatcher Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Assign operators, route cargo, and track shipments</p>
        </div>
        <button
          onClick={() => setShowShipmentForm(!showShipmentForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-sky-600/10"
        >
          <Plus size={16} />
          Create Shipment
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 size={20} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Create Shipment Form */}
      {showShipmentForm && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 animate-slideDown">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            Create Logistics Shipment
          </h3>
          <form onSubmit={handleCreateShipment} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text" required placeholder="Sender Name"
              value={newShipment.sender_name} onChange={(e) => setNewShipment({...newShipment, sender_name: e.target.value})}
              className="px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
            />
            <input
              type="text" required placeholder="Receiver Name"
              value={newShipment.receiver_name} onChange={(e) => setNewShipment({...newShipment, receiver_name: e.target.value})}
              className="px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
            />
            <input
              type="text" required placeholder="Pickup Location (e.g. Origin)"
              value={newShipment.pickup_location} onChange={(e) => setNewShipment({...newShipment, pickup_location: e.target.value})}
              className="px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
            />
            <input
              type="text" required placeholder="Delivery Location (e.g. Destination)"
              value={newShipment.delivery_location} onChange={(e) => setNewShipment({...newShipment, delivery_location: e.target.value})}
              className="px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
            />
            <input
              type="number" placeholder="Cargo Weight (kg)"
              value={newShipment.weight} onChange={(e) => setNewShipment({...newShipment, weight: e.target.value})}
              className="px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
            />
            <div className="flex gap-2 justify-end md:col-span-3 border-t border-slate-800 pt-4">
              <button
                type="button" onClick={() => setShowShipmentForm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assignment Modal Panel */}
      {assigningShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Assign Operator & Asset</h3>
            <p className="text-slate-400 text-xs mb-6">Shipment #{assigningShipment.shipment_number} ({assigningShipment.origin} → {assigningShipment.destination})</p>

            <form onSubmit={handleAssignTrip} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Available Driver
                </label>
                <select
                  required
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-slate-200 text-sm focus:outline-none"
                >
                  <option value="">-- Choose Available Driver --</option>
                  {(drivers || []).map(d => (
                    <option key={d.id} value={d.id}>{d.user_name} ({d.license_number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Active Vehicle
                </label>
                <select
                  required
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-slate-200 text-sm focus:outline-none"
                >
                  <option value="">-- Choose Active Vehicle --</option>
                  {(vehicles || []).map(v => (
                    <option key={v.id} value={v.id}>{v.make} {v.model} ({v.license_plate})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setAssigningShipment(null)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs transition-colors"
                >
                  Confirm Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipments List */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-white text-lg">Active Shipments Tracking</h2>
          <button onClick={fetchInitialData} className="text-slate-400 hover:text-white p-1 transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading shipments database...</div>
        ) : shipments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No shipments found. Create a shipment to start.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <th className="px-6 py-4">Shipment #</th>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Weight</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {shipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-sky-400 text-sm">#{s.shipment_number}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-200 text-sm font-medium">{s.origin} → {s.destination}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Sender: {s.sender_name || 'N/A'} | Recipient: {s.receiver_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-xs">{s.weight ? `${s.weight} kg` : 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase font-bold tracking-wide px-2.5 py-1 rounded-full border ${
                        s.status === 'created' || s.status === 'pending' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                        s.status === 'assigned' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        s.status === 'in_transit' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                        s.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {s.status === 'created' || s.status === 'pending' ? (
                        <button
                          onClick={() => setAssigningShipment(s)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded-lg transition-colors border border-slate-750"
                        >
                          <UserCheck size={12} />
                          Assign
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">Assigned (ID: {s.driver_id})</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Trips & Route Mapping */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Active Trips list */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 lg:col-span-1 flex flex-col">
          <div className="px-6 py-5 border-b border-slate-800">
            <h2 className="font-bold text-white text-lg">Active Delivery Trips</h2>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px] space-y-2">
            {trips.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">No scheduled trips found.</p>
            ) : (
              trips.map(trip => {
                const isSelected = selectedTripId === trip.id;
                return (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTripId(trip.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-sky-500/10 border-sky-500/30 text-white' 
                        : 'bg-slate-900/40 border-slate-850 hover:border-slate-805 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-xs font-bold text-sky-400">Trip #{trip.id}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-bold tracking-wider ${
                        trip.trip_status === 'created' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                        trip.trip_status === 'in_transit' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                        trip.trip_status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {trip.trip_status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold">{trip.pickup_location} → {trip.destination}</p>
                    {trip.distance_km && (
                      <div className="flex justify-between items-center mt-3 text-[10px] text-slate-400 font-medium">
                        <span>Distance: {trip.distance_km} km</span>
                        <span>ETA: {trip.estimated_duration}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Route Map container */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 lg:col-span-2 flex flex-col justify-between min-h-[450px] relative">
          {loadingRoute ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw size={24} className="animate-spin text-sky-400 mb-2" />
              Retrieving live route geometry...
            </div>
          ) : selectedTripRoute ? (
            <div className="flex-1 flex flex-col h-full space-y-4">
              <div className="flex justify-between items-center bg-[#070b1e]/60 p-3 rounded-xl border border-slate-850">
                <div>
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider">Live Path Tracking</h4>
                  <p className="text-slate-400 text-xs mt-0.5">{selectedTripRoute.pickup_location} → {selectedTripRoute.destination}</p>
                </div>
                <div className="text-right">
                  <p className="text-sky-400 text-sm font-black">{selectedTripRoute.distance}</p>
                  <p className="text-slate-400 text-[10px]">{selectedTripRoute.estimated_time}</p>
                </div>
              </div>
              
              <div className="flex-1 rounded-xl border border-slate-850 overflow-hidden relative shadow-inner min-h-[280px] z-10">
                <MapContainer
                  center={
                    selectedTripRoute.pickup_coordinates 
                      ? [selectedTripRoute.pickup_coordinates.latitude, selectedTripRoute.pickup_coordinates.longitude] 
                      : [39.50, -98.35]
                  }
                  zoom={6}
                  scrollWheelZoom={true}
                  className="w-full h-full"
                  style={{ background: '#0a0f24' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {selectedTripRoute.pickup_coordinates && (
                    <Marker 
                      position={[selectedTripRoute.pickup_coordinates.latitude, selectedTripRoute.pickup_coordinates.longitude]} 
                      icon={createPickupIcon()}
                    >
                      <Popup>
                        <div className="text-slate-900 font-sans p-1 text-xs">
                          <p className="font-bold uppercase text-slate-400">Pickup</p>
                          <p>{selectedTripRoute.pickup_location}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {selectedTripRoute.destination_coordinates && (
                    <Marker 
                      position={[selectedTripRoute.destination_coordinates.latitude, selectedTripRoute.destination_coordinates.longitude]} 
                      icon={createDestIcon()}
                    >
                      <Popup>
                        <div className="text-slate-900 font-sans p-1 text-xs">
                          <p className="font-bold uppercase text-slate-400">Destination</p>
                          <p>{selectedTripRoute.destination}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {selectedTripRoute.route_geometry && selectedTripRoute.route_geometry.length > 0 && (
                    <Polyline
                      positions={selectedTripRoute.route_geometry}
                      pathOptions={{
                        color: '#38bdf8',
                        weight: 4,
                        opacity: 0.85,
                        lineJoin: 'round',
                        lineCap: 'round'
                      }}
                    />
                  )}
                  
                  <ChangeMapView 
                    center={
                      selectedTripRoute.pickup_coordinates 
                        ? [selectedTripRoute.pickup_coordinates.latitude, selectedTripRoute.pickup_coordinates.longitude] 
                        : null
                    } 
                    bounds={
                      selectedTripRoute.pickup_coordinates && selectedTripRoute.destination_coordinates 
                        ? [
                            [selectedTripRoute.pickup_coordinates.latitude, selectedTripRoute.pickup_coordinates.longitude],
                            [selectedTripRoute.destination_coordinates.latitude, selectedTripRoute.destination_coordinates.longitude]
                          ] 
                        : []
                    } 
                  />
                </MapContainer>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8">
              <Map size={40} className="text-slate-600 mb-3" />
              <h4 className="text-white font-bold text-sm mb-1.5">No Route Selected</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Select an active delivery trip from the panel on the left to map its route path.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DispatcherDashboard;
