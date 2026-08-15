import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  ClipboardList, Navigation, CheckCircle, Package, 
  MapPin, CheckCircle2, AlertCircle, RefreshCw, Calendar 
} from 'lucide-react';

const DriverDashboard = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.get('/shipments');
      setTrips(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (shipmentId, currentStatus) => {
    let nextStatus = 'in_transit';
    if (currentStatus === 'assigned') {
      nextStatus = 'in_transit';
    } else if (currentStatus === 'in_transit') {
      nextStatus = 'delivered';
    } else {
      return; // Already delivered or cancelled
    }

    setError('');
    setSuccess('');
    try {
      await api.put(`/shipments/${shipmentId}`, { status: nextStatus });
      setSuccess(`Shipment status updated to ${nextStatus}!`);
      fetchTrips();
    } catch (err) {
      console.error(err);
      setError('Failed to update shipment status.');
    }
  };

  // Real browser GPS Implementation
  const [gpsError, setGpsError] = useState('');
  const [lastLocationUpdateTime, setLastLocationUpdateTime] = useState(0);

  useEffect(() => {
    let watchId;
    // Check if there is an active trip
    const activeTrip = trips.find(t => t.status === 'in_transit');
    
    if (activeTrip && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          setGpsError('');
          const currentTime = Date.now();
          // Throttle updates to every 10 seconds (10000 ms)
          if (currentTime - lastLocationUpdateTime >= 10000) {
            setLastLocationUpdateTime(currentTime);
            try {
              await api.post('/drivers/location', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            } catch (err) {
              console.error('Failed to send location update to backend', err);
            }
          }
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setGpsError('Location permission is required for live driver tracking.');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setGpsError('GPS location is currently unavailable.');
          } else if (error.code === error.TIMEOUT) {
            setGpsError('GPS location request timed out.');
          }
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    } else if (activeTrip && !navigator.geolocation) {
      setGpsError('Your browser does not support geolocation.');
    }

    return () => {
      if (watchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [trips, lastLocationUpdateTime]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">My Trips Workspace</h1>
          <p className="text-slate-400 text-sm mt-1">Review assigned deliveries and update execution status</p>
        </div>
        <button
          onClick={fetchTrips}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-all border border-slate-700"
        >
          <RefreshCw size={14} />
          Refresh
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

      {gpsError && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Profile Overview */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-sm font-bold text-sky-400 uppercase tracking-wider mb-4 border-b border-sky-900/30 pb-2">
          Driver Credentials Card
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase">Operator Name</p>
            <p className="font-semibold text-white mt-0.5">{user?.full_name || 'Driver'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase">Email Registry</p>
            <p className="font-semibold text-slate-200 mt-0.5">{user?.email}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase">Workspace Role</p>
            <span className="inline-block mt-1 text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full uppercase">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Trips list */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="px-6 py-5 border-b border-slate-800">
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <ClipboardList className="text-sky-400" size={20} />
            My Active Delivery Trips
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading delivery ledger...</div>
        ) : (trips || []).length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No active trips assigned to you. Contact dispatchers to request an assignment.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {(trips || []).map((trip) => (
              <div key={trip.id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 hover:bg-slate-900/10 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-sky-400 text-sm">#{trip.shipment_number}</span>
                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                      trip.status === 'assigned' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      trip.status === 'in_transit' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {trip.status}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <MapPin size={16} className="text-slate-500" />
                      <span>{trip.origin} <span className="text-sky-500 font-bold">→</span> {trip.destination}</span>
                    </div>
                    {trip.weight && (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Package size={15} />
                        <span>{trip.weight} kg cargo weight</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {trip.status === 'assigned' && (
                    <button
                      onClick={() => handleUpdateStatus(trip.id, trip.status)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-md shadow-sky-600/15"
                    >
                      <Navigation size={14} />
                      Start Transit
                    </button>
                  )}
                  {trip.status === 'in_transit' && (
                    <button
                      onClick={() => handleUpdateStatus(trip.id, trip.status)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/15"
                    >
                      <CheckCircle size={14} />
                      Mark Delivered
                    </button>
                  )}
                  {trip.status === 'delivered' && (
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-950/20 px-3 py-1.5 rounded-lg border border-emerald-900/30">
                      <CheckCircle size={14} />
                      Completed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
