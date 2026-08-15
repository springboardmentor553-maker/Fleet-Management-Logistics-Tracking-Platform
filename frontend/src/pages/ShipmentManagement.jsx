import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  Package, MapPin, Plus, Edit2, Trash2, CheckCircle2, 
  AlertCircle, RefreshCw, X, Calendar, User, Truck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ShipmentManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    sender_name: '',
    receiver_name: '',
    pickup_location: '',
    delivery_location: '',
    weight: '',
    assigned_driver_id: '',
    assigned_vehicle_id: '',
    current_status: 'created'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const [shipmentsRes, driversRes, vehiclesRes] = await Promise.all([
        api.get('/shipments'),
        api.get('/drivers'),
        api.get('/vehicles')
      ]);
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

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      sender_name: '',
      receiver_name: '',
      pickup_location: '',
      delivery_location: '',
      weight: '',
      assigned_driver_id: '',
      assigned_vehicle_id: '',
      current_status: 'created'
    });
    setShowForm(true);
  };

  const handleOpenEdit = (shipment) => {
    setEditingId(shipment.id);
    setFormData({
      sender_name: shipment.sender_name || '',
      receiver_name: shipment.receiver_name || '',
      pickup_location: shipment.pickup_location || shipment.origin || '',
      delivery_location: shipment.delivery_location || shipment.destination || '',
      weight: shipment.weight || '',
      assigned_driver_id: shipment.assigned_driver_id || shipment.driver_id || '',
      assigned_vehicle_id: shipment.assigned_vehicle_id || shipment.vehicle_id || '',
      current_status: shipment.current_status || shipment.status || 'created'
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      sender_name: formData.sender_name,
      receiver_name: formData.receiver_name,
      pickup_location: formData.pickup_location,
      delivery_location: formData.delivery_location,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      assigned_driver_id: formData.assigned_driver_id ? parseInt(formData.assigned_driver_id) : null,
      assigned_vehicle_id: formData.assigned_vehicle_id ? parseInt(formData.assigned_vehicle_id) : null,
    };

    if (editingId) {
      payload.current_status = formData.current_status;
    }

    try {
      if (editingId) {
        await api.put(`/shipments/${editingId}`, payload);
        setSuccess('Shipment updated successfully!');
      } else {
        await api.post('/shipments', payload);
        setSuccess('Shipment created successfully!');
      }
      setShowForm(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Operation failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shipment?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/shipments/${id}`);
      setSuccess('Shipment deleted successfully!');
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 401 ? 'Please login again.' : err.response?.status === 403 ? 'You are not authorized to access this page.' : err.response?.data?.detail || 'Unable to connect to the server.');
    }
  };

  // Helper to resolve driver names
  const getDriverName = (driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.user_name : `Driver ID: ${driverId}`;
  };

  // Helper to resolve vehicle plates
  const getVehiclePlate = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})` : `Vehicle ID: ${vehicleId}`;
  };

  const isWriteAllowed = ['admin', 'manager', 'dispatcher'].includes(user?.role);
  const isDeleteAllowed = ['admin'].includes(user?.role);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Shipment Management</h1>
          <p className="text-slate-400 text-sm mt-1">Register, edit, delete and track logistics shipments</p>
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
              New Shipment
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

      {/* CRUD Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowForm(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-white mb-6">
              {editingId ? 'Edit Logistics Shipment' : 'Create Logistics Shipment'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Sender Name *
                  </label>
                  <input
                    type="text" required
                    value={formData.sender_name}
                    onChange={(e) => setFormData({...formData, sender_name: e.target.value})}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
                    placeholder="E.g. Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Receiver Name *
                  </label>
                  <input
                    type="text" required
                    value={formData.receiver_name}
                    onChange={(e) => setFormData({...formData, receiver_name: e.target.value})}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
                    placeholder="E.g. Bob Retailers"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Pickup Location *
                  </label>
                  <input
                    type="text" required
                    value={formData.pickup_location}
                    onChange={(e) => setFormData({...formData, pickup_location: e.target.value})}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
                    placeholder="E.g. New York, NY"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Delivery Location *
                  </label>
                  <input
                    type="text" required
                    value={formData.delivery_location}
                    onChange={(e) => setFormData({...formData, delivery_location: e.target.value})}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
                    placeholder="E.g. Boston, MA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Cargo Weight (kg)
                  </label>
                  <input
                    type="number" step="any"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
                    placeholder="Weight in kg"
                  />
                </div>
                {editingId && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Shipment Status
                    </label>
                    <select
                      value={formData.current_status}
                      onChange={(e) => setFormData({...formData, current_status: e.target.value})}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-white text-sm"
                    >
                      <option value="created">Created</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_transit">In Transit</option>
                      <option value="delayed">Delayed</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Assign Driver (Optional)
                  </label>
                  <select
                    value={formData.assigned_driver_id}
                    onChange={(e) => setFormData({...formData, assigned_driver_id: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-slate-200 text-sm"
                  >
                    <option value="">-- Unassigned --</option>
                    {(drivers || []).map(d => (
                      <option key={d.id} value={d.id}>{d.user_name} ({d.license_number})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Assign Vehicle (Optional)
                  </label>
                  <select
                    value={formData.assigned_vehicle_id}
                    onChange={(e) => setFormData({...formData, assigned_vehicle_id: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-slate-200 text-sm"
                  >
                    <option value="">-- Unassigned --</option>
                    {(vehicles || []).map(v => (
                      <option key={v.id} value={v.id}>{v.make} {v.model} ({v.license_plate})</option>
                    ))}
                  </select>
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
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs transition-colors"
                >
                  {editingId ? 'Save Changes' : 'Create Shipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipment List Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading shipments...</div>
        ) : shipments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No shipments found. Create one to start.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <th className="px-6 py-4">Tracking Number</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Assignments</th>
                  <th className="px-6 py-4">Status</th>
                  {isWriteAllowed && <th className="px-6 py-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(shipments || []).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/20 transition-colors">
                    {/* Tracking Number */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/shipments/${s.id}/track`)}
                        className="font-mono font-bold text-sky-400 text-sm hover:underline cursor-pointer focus:outline-none"
                      >
                        #{s.tracking_number}
                      </button>
                    </td>

                    {/* Details (Sender / Receiver / Weight) */}
                    <td className="px-6 py-4">
                      <div className="text-slate-200 text-sm font-medium">
                        {s.sender_name} <span className="text-slate-500 font-normal">to</span> {s.receiver_name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Weight: {s.weight ? `${s.weight} kg` : 'N/A'}
                      </div>
                    </td>

                    {/* Route */}
                    <td className="px-6 py-4">
                      <div className="text-slate-200 text-sm font-medium">
                        {s.pickup_location} → {s.delivery_location}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                        <Calendar size={11} />
                        <span>Created: {new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Assigned Driver & Vehicle */}
                    <td className="px-6 py-4 text-slate-300 text-xs">
                      {s.assigned_driver_id || s.driver_id ? (
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-slate-400" />
                          <span>{getDriverName(s.assigned_driver_id || s.driver_id)}</span>
                        </div>
                      ) : (
                        <div className="text-slate-500 italic text-[11px]">No driver assigned</div>
                      )}
                      {s.assigned_vehicle_id || s.vehicle_id ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Truck size={13} className="text-slate-400" />
                          <span>{getVehiclePlate(s.assigned_vehicle_id || s.vehicle_id)}</span>
                        </div>
                      ) : (
                        <div className="text-slate-500 italic text-[11px] mt-0.5">No vehicle assigned</div>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase font-bold tracking-wide px-2.5 py-1 rounded-full border ${
                        s.current_status === 'created' || s.status === 'pending' || s.status === 'created' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                        s.current_status === 'assigned' || s.status === 'assigned' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        s.current_status === 'in_transit' || s.status === 'in_transit' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                        s.current_status === 'delivered' || s.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        s.current_status === 'delayed' || s.status === 'delayed' ? 'bg-amber-600/10 text-amber-500 border-amber-600/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {s.current_status || s.status}
                      </span>
                    </td>

                    {/* CRUD Operations buttons */}
                    {isWriteAllowed && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-750 text-sky-400 rounded-lg transition-colors border border-slate-750"
                            title="Edit Shipment"
                          >
                            <Edit2 size={13} />
                          </button>
                          {isDeleteAllowed && (
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="p-1.5 bg-slate-800 hover:bg-red-500/10 text-red-400 hover:border-red-500/20 rounded-lg transition-colors border border-slate-750"
                              title="Delete Shipment"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
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

export default ShipmentManagement;
