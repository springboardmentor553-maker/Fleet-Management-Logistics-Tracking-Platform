import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { getWebSocketUrl } from '../../api/websocket';
import { useAuth } from '../../context/AuthContext';
import { 
  Truck, Users, Package, Plus, Trash2, Edit3, 
  MapPin, CheckCircle2, AlertCircle, Phone, FileText,
  Wrench, Navigation, Map, RefreshCw, AlertTriangle, Activity
} from 'lucide-react';
import { getMaintenanceAlerts } from '../../api/maintenance';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AnalyticsPanel from '../../components/AnalyticsPanel';

// Dynamic map view centering component
const ChangeMapView = ({ center, bounds }) => {
  const map = useMap();
  
  const boundsStr = JSON.stringify(bounds);

  useEffect(() => {
    if (bounds && bounds.length === 2 && bounds[0][0] != null && bounds[1][0] != null) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [boundsStr, map]);

  const centerStr = JSON.stringify(center);
  useEffect(() => {
    if ((!bounds || bounds.length === 0) && center && center[0] != null && center[1] != null) {
      map.setView(center, 13);
    }
  }, [centerStr, boundsStr, map]);

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

const createVehicleIcon = () => L.divIcon({
  html: `<div class="w-6 h-6 rounded-full bg-sky-500 border-2 border-slate-900 flex items-center justify-center shadow-lg shadow-sky-500/50 animate-pulse"><div class="w-2.5 h-2.5 rounded-full bg-white"></div></div>`,
  className: 'custom-div-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [selectedTripRoute, setSelectedTripRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  
  const [currentLocation, setCurrentLocation] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);

  useEffect(() => {
    if (selectedTripId) {
      fetchTripRoute(selectedTripId);
    } else {
      setSelectedTripRoute(null);
      setCurrentLocation(null);
      setLiveStatus(null);
    }
  }, [selectedTripId]);

  const fetchTripRoute = async (tripId) => {
    setLoadingRoute(true);
    try {
      const res = await api.get(`/trip/${tripId}/route`);
      setSelectedTripRoute(res.data);
      const trip = trips.find(t => t.id === tripId);
      const status = trip?.trip_status;
      if (res.data.current_location && status !== 'completed' && status !== 'delivered') {
        setCurrentLocation([res.data.current_location.latitude, res.data.current_location.longitude]);
      } else if (res.data.destination_coordinates && (status === 'completed' || status === 'delivered')) {
        setCurrentLocation([res.data.destination_coordinates.latitude, res.data.destination_coordinates.longitude]);
      } else if (res.data.pickup_coordinates) {
        setCurrentLocation([res.data.pickup_coordinates.latitude, res.data.pickup_coordinates.longitude]);
      }
    } catch (e) {
      console.error("Failed to fetch selected trip route:", e);
    } finally {
      setLoadingRoute(false);
    }
  };

  useEffect(() => {
    if (!selectedTripId || !trips.length) return;
    const trip = trips.find(t => t.id === selectedTripId);
    if (!trip) return;
    
    // Find tracking number from shipments to connect to WS
    const shipment = shipments.find(s => s.id === trip.shipment_id);
    if (!shipment?.tracking_number) return;

    const ws = new WebSocket(getWebSocketUrl(`/ws/shipment/${shipment.tracking_number}`));

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'location_update') {
          setCurrentLocation([message.data.latitude, message.data.longitude]);
          setLiveStatus(message.data.status);
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
  }, [selectedTripId, trips, shipments]);

  const [stats, setStats] = useState({
    totalVehicles: 0,
    active: 0,
    maintenance: 0,
    available: 0,
    onTrip: 0,
    inactive: 0,
    totalShipments: 0,
    deliveredShipments: 0,
    delayedShipments: 0,
    activeDeliveries: 0,
    totalDrivers: 0,
    assignedDrivers: 0,
    availableDrivers: 0,
    driversOnLeave: 0,
    presentToday: 0,
    absentToday: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states for creating a Vehicle
  const [newVehicle, setNewVehicle] = useState({
    make: '', model: '', year: new Date().getFullYear(),
    license_plate: '', vin: '', status: 'active',
    capacity_weight: '', capacity_volume: ''
  });
  const [showVehicleForm, setShowVehicleForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const data = await getMaintenanceAlerts();
      setMaintenanceAlerts(data);
    } catch (err) {
      console.error('Failed to fetch maintenance alerts:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await Promise.all([fetchStats(), fetchAlerts()]);
      if (activeTab === 'vehicles') {
        const response = await api.get('/vehicles');
        setVehicles(response.data);
      } else if (activeTab === 'drivers') {
        const response = await api.get('/drivers');
        setDrivers(response.data);
      } else if (activeTab === 'shipments') {
        const response = await api.get('/shipments');
        setShipments(response.data);
      } else if (activeTab === 'trips') {
        const [tripsRes, shipmentsRes] = await Promise.all([
          api.get('/trips'),
          api.get('/shipments')
        ]);
        setTrips(tripsRes.data);
        setShipments(shipmentsRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const payload = {
      ...newVehicle,
      year: parseInt(newVehicle.year),
      capacity_weight: newVehicle.capacity_weight ? parseFloat(newVehicle.capacity_weight) : null,
      capacity_volume: newVehicle.capacity_volume ? parseFloat(newVehicle.capacity_volume) : null,
    };

    try {
      await api.post('/vehicles', payload);
      setSuccess('Vehicle registered successfully!');
      setShowVehicleForm(false);
      setNewVehicle({
        make: '', model: '', year: new Date().getFullYear(),
        license_plate: '', vin: '', status: 'active',
        capacity_weight: '', capacity_volume: ''
      });
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 401 ? 'Please login again.' : err.response?.status === 403 ? 'You are not authorized to access this page.' : err.response?.data?.detail || 'Unable to connect to the server.');
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/vehicles/${id}`);
      setSuccess('Vehicle deleted successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete vehicle.');
    }
  };

  const handleToggleVehicleStatus = async (vehicle) => {
    const nextStatusMap = {
      active: 'maintenance',
      maintenance: 'inactive',
      inactive: 'active',
    };
    const nextStatus = nextStatusMap[vehicle.status] || 'active';
    setError('');
    setSuccess('');
    try {
      await api.put(`/vehicles/${vehicle.id}`, { status: nextStatus });
      setSuccess(`Vehicle ${vehicle.license_plate} status updated to ${nextStatus}!`);
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 401 ? 'Please login again.' : err.response?.status === 403 ? 'You are not authorized to access this page.' : err.response?.data?.detail || 'Unable to connect to the server.');
    }
  };

  const handleUpdateDriverStatus = async (id, currentStatus) => {
    const nextStatusMap = {
      available: 'off_duty',
      off_duty: 'available',
      on_trip: 'available',
    };
    const nextStatus = nextStatusMap[currentStatus] || 'available';
    setError('');
    setSuccess('');
    try {
      await api.put(`/drivers/${id}`, { status: nextStatus });
      setSuccess('Driver status updated successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to update driver status.');
    }
  };

  const urgentAlertsCount = maintenanceAlerts.filter(a => ['OVERDUE', 'DUE_SOON', 'IN_PROGRESS'].includes(a.alert_type)).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Maintenance Alerts Banner */}
      {urgentAlertsCount > 0 && (
        <a href="/maintenance" className="block bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between hover:bg-yellow-500/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-yellow-400 font-bold text-sm uppercase tracking-wider">Maintenance Attention Required</h3>
              <p className="text-yellow-500/80 text-xs mt-0.5">⚠ {urgentAlertsCount} vehicles require maintenance attention. Click to view details.</p>
            </div>
          </div>
        </a>
      )}

      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Fleet Manager Workspace</h1>
          <p className="text-slate-400 text-sm mt-1">Supervise vehicles, drivers, and cargo logistics</p>
        </div>
      </div>

      {/* KPI Stats Grid - Vehicles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Vehicles */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Vehicles</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{stats.totalVehicles}</h3>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <Truck size={20} />
          </div>
        </div>

        {/* Available Vehicles */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Vehicles</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.available}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* On Trip Vehicles */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">On Trip Vehicles</p>
            <h3 className="text-2xl font-extrabold text-sky-400 mt-1">{stats.onTrip}</h3>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <Navigation size={20} />
          </div>
        </div>

        {/* Maintenance Vehicles */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Maintenance</p>
            <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{stats.maintenance}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Wrench size={20} />
          </div>
        </div>

        {/* Inactive Vehicles */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inactive</p>
            <h3 className="text-2xl font-extrabold text-rose-400 mt-1">{stats.inactive}</h3>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <AlertCircle size={20} />
          </div>
        </div>
      </div>

      {/* KPI Stats Grid - Shipments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        {/* Total Shipments */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Shipments</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{stats.totalShipments}</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Package size={20} />
          </div>
        </div>

        {/* Delivered Shipments */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivered</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.deliveredShipments}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Delayed Shipments */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delayed</p>
            <h3 className="text-2xl font-extrabold text-rose-400 mt-1">{stats.delayedShipments}</h3>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <AlertCircle size={20} />
          </div>
        </div>

        {/* Active Deliveries */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Deliveries</p>
            <h3 className="text-2xl font-extrabold text-sky-400 mt-1">{stats.activeDeliveries}</h3>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <Navigation size={20} />
          </div>
        </div>
      </div>

      {/* KPI Stats Grid - Drivers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-2">
        {/* Total Drivers */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Drivers</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{stats.totalDrivers}</h3>
          </div>
        </div>

        {/* Assigned Drivers */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned</p>
            <h3 className="text-2xl font-extrabold text-sky-400 mt-1">{stats.assignedDrivers}</h3>
          </div>
        </div>

        {/* Available Drivers */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.availableDrivers}</h3>
          </div>
        </div>

        {/* Drivers On Leave */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">On Leave</p>
            <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{stats.driversOnLeave}</h3>
          </div>
        </div>
        
        {/* Present Today */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present Today</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.presentToday}</h3>
          </div>
        </div>
        
        {/* Absent Today */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absent Today</p>
            <h3 className="text-2xl font-extrabold text-rose-400 mt-1">{stats.absentToday}</h3>
          </div>
        </div>
      </div>


      {/* Tabs list */}
      <div className="flex border-b border-slate-800 bg-[#0c1228]/40 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'vehicles' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Truck size={16} />
          Vehicles
        </button>
        <button
          onClick={() => setActiveTab('drivers')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'drivers' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users size={16} />
          Drivers
        </button>
        <button
          onClick={() => setActiveTab('shipments')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'shipments' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package size={16} />
          Shipments
        </button>
        <button
          onClick={() => setActiveTab('trips')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'trips' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Navigation size={16} />
          Active Trips
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'analytics' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity size={16} />
          Analytics
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

      {/* --- Tab 1: Vehicles Panel --- */}
      {activeTab === 'vehicles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-[#0c1228]/25 p-4 rounded-xl border border-slate-800">
            <h2 className="text-lg font-bold text-white">Active Fleets</h2>
            <button
              onClick={() => setShowVehicleForm(!showVehicleForm)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-sky-600/10"
            >
              <Plus size={14} />
              Add Vehicle
            </button>
          </div>

          {/* Create Vehicle Form Dropdown */}
          {showVehicleForm && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 animate-slideDown">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                Register New Vehicle
              </h3>
              <form onSubmit={handleCreateVehicle} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text" required placeholder="Make (e.g. Ford)"
                  value={newVehicle.make} onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})}
                  className="px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
                />
                <input
                  type="text" required placeholder="Model (e.g. F-150)"
                  value={newVehicle.model} onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                  className="px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
                />
                <input
                  type="number" required placeholder="Year"
                  value={newVehicle.year} onChange={(e) => setNewVehicle({...newVehicle, year: e.target.value})}
                  className="px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
                />
                <input
                  type="text" required placeholder="License Plate"
                  value={newVehicle.license_plate} onChange={(e) => setNewVehicle({...newVehicle, license_plate: e.target.value})}
                  className="px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
                />
                <input
                  type="text" placeholder="VIN (Optional)"
                  value={newVehicle.vin} onChange={(e) => setNewVehicle({...newVehicle, vin: e.target.value})}
                  className="px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
                />
                <select
                  value={newVehicle.status} onChange={(e) => setNewVehicle({...newVehicle, status: e.target.value})}
                  className="px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
                <input
                  type="number" placeholder="Weight Capacity (kg)"
                  value={newVehicle.capacity_weight} onChange={(e) => setNewVehicle({...newVehicle, capacity_weight: e.target.value})}
                  className="px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
                />
                <input
                  type="number" placeholder="Volume Capacity (m³)"
                  value={newVehicle.capacity_volume} onChange={(e) => setNewVehicle({...newVehicle, capacity_volume: e.target.value})}
                  className="px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
                />
                <div className="flex gap-2 justify-end md:col-span-3 border-t border-slate-800 pt-4">
                  <button
                    type="button" onClick={() => setShowVehicleForm(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs transition-colors"
                  >
                    Register
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Vehicles list */}
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading vehicles...</div>
          ) : vehicles.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No vehicles registered yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(Array.isArray(vehicles) ? vehicles : []).map((v) => (
                <div key={v?.id || Math.random()} className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-slate-800 hover:border-slate-700 transition-all relative">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                        v.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        v.status === 'maintenance' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {v.status}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleVehicleStatus(v)}
                          title="Toggle Vehicle Status"
                          className="text-slate-500 hover:text-sky-400 transition-colors p-1"
                        >
                          <Edit3 size={15} />
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteVehicle(v.id)}
                            title="Delete Vehicle"
                            className="text-slate-500 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white">{v.make} {v.model}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Year: {v.year} | Plate: <span className="font-mono text-slate-300 font-semibold">{v.license_plate}</span></p>
                    {v.vin && <p className="text-[10px] text-slate-500 font-mono mt-1">VIN: {v.vin}</p>}
                  </div>

                  <div className="mt-6 border-t border-slate-800/80 pt-4 grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-slate-900/40 rounded-xl">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Weight cap</p>
                      <p className="text-sm font-semibold text-slate-200 mt-0.5">{v.capacity_weight ? `${v.capacity_weight} kg` : 'N/A'}</p>
                    </div>
                    <div className="p-2 bg-slate-900/40 rounded-xl">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Volume cap</p>
                      <p className="text-sm font-semibold text-slate-200 mt-0.5">{v.capacity_volume ? `${v.capacity_volume} m³` : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Tab 2: Drivers Panel --- */}
      {activeTab === 'drivers' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="px-6 py-5 border-b border-slate-800">
            <h2 className="font-bold text-white text-lg">Active Drivers Registry</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading drivers list...</div>
          ) : drivers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No driver registry records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                    <th className="px-6 py-4">Driver Profile</th>
                    <th className="px-6 py-4">License Number</th>
                    <th className="px-6 py-4">Phone Number</th>
                    <th className="px-6 py-4">Work Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(drivers || []).map((d) => (
                    <tr key={d.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-sky-400">
                            {d.user_name?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">{d.user_name || 'Driver'}</p>
                            <span className="text-slate-400 text-xs">{d.user_email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-mono text-sm">{d.license_number}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        <div className="flex items-center gap-1">
                          <Phone size={12} />
                          <span>{d.phone_number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] uppercase font-bold tracking-wide px-2.5 py-1 rounded-full border ${
                          d.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          d.status === 'on_trip' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                          d.status === 'off_duty' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleUpdateDriverStatus(d.id, d.status)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700/60"
                        >
                          Toggle Off-Duty
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- Tab 3: Shipments Panel --- */}
      {activeTab === 'shipments' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="px-6 py-5 border-b border-slate-800">
            <h2 className="font-bold text-white text-lg">Active Shipments Ledger</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading shipments...</div>
          ) : shipments.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No shipments found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                    <th className="px-6 py-4">Shipment Number</th>
                    <th className="px-6 py-4">Route (Origin / Destination)</th>
                    <th className="px-6 py-4">Cargo Weight</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(shipments || []).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-sky-400 text-sm">#{s.shipment_number}</td>
                      <td className="px-6 py-4">
                        <div className="text-slate-200 text-sm">
                          {s.origin} <span className="text-sky-500 font-bold">→</span> {s.destination}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- Tab 4: Active Trips & Mapping Panel --- */}
      {activeTab === 'trips' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Active Trips list */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 lg:col-span-1 flex flex-col">
            <div className="px-6 py-5 border-b border-slate-800">
              <h2 className="font-bold text-white text-lg">Active Delivery Trips</h2>
            </div>
            <div className="p-4 flex-1 overflow-y-auto max-h-[400px] space-y-2">
              {loading ? (
                <p className="text-slate-400 text-sm text-center py-6">Loading active trips...</p>
              ) : trips.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">No scheduled trips found.</p>
              ) : (
                (trips || []).map(trip => {
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
                    
                    {currentLocation && (
                      <Marker position={currentLocation} icon={createVehicleIcon()}>
                        <Popup>
                          <div className="text-slate-900 font-sans p-1 text-xs">
                            <p className="font-bold uppercase text-slate-400">Live Location</p>
                            <p className="font-semibold capitalize">Status: {(liveStatus || 'in transit').replace('_', ' ')}</p>
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
                        currentLocation || (selectedTripRoute.pickup_coordinates 
                          ? [selectedTripRoute.pickup_coordinates.latitude, selectedTripRoute.pickup_coordinates.longitude] 
                          : null)
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
      )}

      {/* --- Tab 5: Analytics Panel --- */}
      {activeTab === 'analytics' && (
        <AnalyticsPanel />
      )}
    </div>
  );
};

export default ManagerDashboard;
