import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  MapPin, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, 
  RefreshCw, X, Calendar, User, Truck, Navigation, CheckSquare 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TripManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [trips, setTrips] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    shipment_id: '',
    driver_id: '',
    vehicle_id: '',
    pickup_location: '',
    destination: '',
    scheduled_start_time: '',
    scheduled_end_time: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const [tripsRes, shipmentsRes, driversRes, vehiclesRes] = await Promise.all([
        api.get('/trips'),
        api.get('/shipments'),
        api.get('/drivers'),
        api.get('/vehicles')
      ]);
      setTrips(tripsRes.data);
      setShipments(shipmentsRes.data);
      setDrivers(driversRes.data);
      setVehicles(vehiclesRes.data);
    } catch (err) {
      console.error(err);
      setError('Unable to connect to the server. Please verify your permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = async () => {
    // Determine shipments that are not already assigned to a trip
    const assignedShipmentIds = (trips || []).map(t => t.shipment_id);
    const unassignedShipments = shipments.filter(s => !assignedShipmentIds.includes(s.id));
    
    if (unassignedShipments.length === 0) {
      setError('All seeded shipments are already assigned to trips. Please create a new shipment first.');
      return;
    }

    try {
      const [availDriversRes, availVehiclesRes] = await Promise.all([
        api.get('/drivers/available'),
        api.get('/vehicles/available')
      ]);
      const availDrivers = availDriversRes.data;
      const availVehicles = availVehiclesRes.data;
      
      setAvailableDrivers(availDrivers);
      setAvailableVehicles(availVehicles);

      if (availDrivers.length === 0 || availVehicles.length === 0) {
        setError('No available drivers or vehicles to assign. Please check assets status.');
        return;
      }

      setFormData({
        shipment_id: unassignedShipments[0]?.id || '',
        driver_id: availDrivers[0]?.driver_id || '',
        vehicle_id: availVehicles[0]?.vehicle_id || '',
        pickup_location: unassignedShipments[0]?.pickup_location || unassignedShipments[0]?.origin || '',
        destination: unassignedShipments[0]?.delivery_location || unassignedShipments[0]?.destination || '',
        scheduled_start_time: new Date(Date.now() + 3600000).toISOString().slice(0, 16), // 1 hour from now
        scheduled_end_time: new Date(Date.now() + 86400000).toISOString().slice(0, 16) // 1 day from now
      });
      setError('');
      setShowForm(true);
    } catch (err) {
      console.error(err);
      setError('Unable to connect to the server.');
    }
  };

  const handleShipmentChange = (shipmentId) => {
    const shipment = shipments.find(s => s.id === parseInt(shipmentId));
    if (shipment) {
      setFormData({
        ...formData,
        shipment_id: shipmentId,
        pickup_location: shipment.pickup_location || shipment.origin || '',
        destination: shipment.delivery_location || shipment.destination || ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    
    setError('');
    setSuccess('');
    setSubmitting(true);

    const payload = {
      shipment_id: parseInt(formData.shipment_id),
      driver_id: parseInt(formData.driver_id),
      vehicle_id: parseInt(formData.vehicle_id),
      pickup_location: formData.pickup_location,
      destination: formData.destination,
      scheduled_start_time: new Date(formData.scheduled_start_time).toISOString(),
      scheduled_end_time: new Date(formData.scheduled_end_time).toISOString()
    };

    try {
      await api.post('/trips', payload);
      
      // Update driver status in frontend to on_trip if successful
      try {
        await api.put(`/drivers/${formData.driver_id}`, { status: 'on_trip' });
      } catch (e) {
        console.error("Driver status update failed: ", e);
      }

      setSuccess('Trip created and operator assigned successfully!');
      setShowForm(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 401 ? 'Please login again.' : err.response?.status === 403 ? 'You are not authorized to access this page.' : err.response?.data?.detail || 'Unable to connect to the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (tripId, newStatus) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/trips/${tripId}`, { trip_status: newStatus });
      setSuccess(`Trip status updated to '${newStatus}'!`);
      
      // If status is completed or cancelled, free the driver if needed
      const trip = trips.find(t => t.id === tripId);
      if (trip && (newStatus === 'completed' || newStatus === 'cancelled') && trip.driver_id) {
        try {
          await api.put(`/drivers/${trip.driver_id}`, { status: 'available' });
        } catch (e) {
          console.error("Driver status reset failed: ", e);
        }
      }

      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 401 ? 'Please login again.' : err.response?.status === 403 ? 'You are not authorized to access this page.' : err.response?.data?.detail || 'Unable to connect to the server.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trip assignment?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/trips/${id}`);
      setSuccess('Trip deleted successfully!');
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 401 ? 'Please login again.' : err.response?.status === 403 ? 'You are not authorized to access this page.' : err.response?.data?.detail || 'Unable to connect to the server.');
    }
  };

  // Resolvers
  const getDriverName = (driverId) => {
    const d = drivers.find(drv => drv.id === driverId);
    return d ? d.user_name : `Driver ID: ${driverId}`;
  };

  const getVehiclePlate = (vehicleId) => {
    const v = vehicles.find(veh => veh.id === vehicleId);
    return v ? `${v.make} ${v.model} (${v.license_plate})` : `Vehicle ID: ${vehicleId}`;
  };

  const getTrackingNumber = (shipmentId) => {
    const s = shipments.find(ship => ship.id === shipmentId);
    return s ? s.tracking_number : `Shipment ID: ${shipmentId}`;
  };

  const assignedShipmentIds = (trips || []).map(t => t.shipment_id);
  const unassignedShipments = shipments.filter(s => !assignedShipmentIds.includes(s.id));

  const isWriteAllowed = ['admin', 'manager', 'dispatcher'].includes(user?.role);
  const isDeleteAllowed = ['admin'].includes(user?.role);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Trip Management</h1>
          <p className="text-slate-400 text-sm mt-1">Assign drivers, route assets, and track active delivery trips</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchInitialData} 
            className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition-all"
            title="Refresh List"
          >
            <RefreshCw size={18} />
          </button>
          {isWriteAllowed && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-sky-600/10"
            >
              <Plus size={16} />
              Plan Route / Assign Trip
            </button>
          )}
        </div>
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

      {/* Plan Route / Create Trip Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowForm(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-white mb-6">Plan Route / Assign Trip</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Unassigned Shipment *
                </label>
                <select
                  required
                  value={formData.shipment_id}
                  onChange={(e) => handleShipmentChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-slate-200 text-sm"
                >
                  {(unassignedShipments || []).map(s => (
                    <option key={s.id} value={s.id}>
                      #{s.tracking_number} - {s.sender_name} to {s.receiver_name} ({s.pickup_location} → {s.delivery_location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Select Operator (Driver) *
                  </label>
                  <select
                    required
                    value={formData.driver_id}
                    onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-slate-200 text-sm"
                  >
                    {(availableDrivers || []).map(d => (
                      <option key={d.driver_id} value={d.driver_id}>
                        {d.name} ({d.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Select Fleet Asset (Vehicle) *
                  </label>
                  <select
                    required
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-slate-200 text-sm"
                  >
                    {(availableVehicles || []).map(v => (
                      <option key={v.vehicle_id} value={v.vehicle_id}>
                        {v.make} {v.model} ({v.license_plate})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Pickup Location (Geocoded) *
                  </label>
                  <input
                    type="text" required
                    value={formData.pickup_location}
                    onChange={(e) => setFormData({...formData, pickup_location: e.target.value})}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Destination Location (Geocoded) *
                  </label>
                  <input
                    type="text" required
                    value={formData.destination}
                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Scheduled Start *
                  </label>
                  <input
                    type="datetime-local" required
                    value={formData.scheduled_start_time}
                    onChange={(e) => setFormData({...formData, scheduled_start_time: e.target.value})}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Scheduled End *
                  </label>
                  <input
                    type="datetime-local" required
                    value={formData.scheduled_end_time}
                    onChange={(e) => setFormData({...formData, scheduled_end_time: e.target.value})}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm text-slate-300"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-800 pt-4 mt-6">
                <button
                  type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 text-white font-semibold rounded-xl text-xs transition-colors ${
                    submitting ? 'bg-sky-600/50 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-500'
                  }`}
                >
                  {submitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trips list */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading trips database...</div>
        ) : trips.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No trips assignments found. Create a trip to assign assets.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <th className="px-6 py-4">Shipment Tracking</th>
                  <th className="px-6 py-4">Route Info</th>
                  <th className="px-6 py-4">Allocated Driver / Vehicle</th>
                  <th className="px-6 py-4">Schedule</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(trips || []).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/20 transition-colors">
                    {/* Shipment Tracking */}
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-sky-400 text-sm">
                        #{getTrackingNumber(t.shipment_id)}
                      </span>
                    </td>

                    {/* Route Info */}
                    <td className="px-6 py-4">
                      <div className="text-slate-200 text-sm font-medium">
                        {t.pickup_location} → {t.destination}
                      </div>
                      <button
                        onClick={() => navigate(`/trips/${t.id}/route`)}
                        className="text-[10px] text-sky-400 font-semibold hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        <Navigation size={10} />
                        View Live Google Map Route
                      </button>
                    </td>

                    {/* Assigned operator / asset */}
                    <td className="px-6 py-4 text-slate-300 text-xs">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-400" />
                        <span>{getDriverName(t.driver_id)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Truck size={13} className="text-slate-400" />
                        <span>{getVehiclePlate(t.vehicle_id)}</span>
                      </div>
                    </td>

                    {/* Schedule */}
                    <td className="px-6 py-4 text-slate-300 text-xs">
                      <div><span className="text-slate-500">Start:</span> {new Date(t.scheduled_start_time).toLocaleString()}</div>
                      <div className="mt-1"><span className="text-slate-500">End:</span> {new Date(t.scheduled_end_time).toLocaleString()}</div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase font-bold tracking-wide px-2.5 py-1 rounded-full border ${
                        t.trip_status === 'created' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                        t.trip_status === 'in_transit' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                        t.trip_status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {t.trip_status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {t.trip_status === 'created' && (
                          <button
                            onClick={() => handleUpdateStatus(t.id, 'in_transit')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-600/80 hover:bg-sky-500 text-white text-[11px] font-semibold rounded-lg transition-colors border border-sky-600"
                            title="Start Transit"
                          >
                            <Navigation size={11} />
                            Start
                          </button>
                        )}
                        {t.trip_status === 'in_transit' && (
                          <button
                            onClick={() => handleUpdateStatus(t.id, 'completed')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-lg transition-colors border border-emerald-650"
                            title="Complete Trip"
                          >
                            <CheckSquare size={11} />
                            Complete
                          </button>
                        )}
                        {isDeleteAllowed && (
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 bg-slate-800 hover:bg-red-500/10 text-red-400 hover:border-red-500/20 rounded-lg transition-colors border border-slate-750"
                            title="Delete Assignment"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripManagement;
