import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Fuel, Search, Plus, Trash2, Edit, Activity, Truck, AlertCircle
} from 'lucide-react';

const FuelMonitoring = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [fleetDashboard, setFleetDashboard] = useState(null);
  const [operations, setOperations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    fuel_quantity: '',
    fuel_cost: '',
    odometer_reading: '',
    fuel_date: '',
    fuel_station: '',
    remarks: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsRes, analyticsRes, fleetRes, opsRes, vehiclesRes, driversRes] = await Promise.all([
        api.get('/fuel-records'),
        api.get('/analytics/fuel'),
        api.get('/dashboard/fleet'),
        api.get('/analytics/operations'),
        api.get('/vehicles'),
        api.get('/drivers')
      ]);
      setRecords(recordsRes.data);
      setAnalytics(analyticsRes.data);
      setFleetDashboard(fleetRes.data);
      setOperations(opsRes.data);
      setVehicles(vehiclesRes.data);
      setDrivers(driversRes.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (record = null) => {
    if (record) {
      setEditingId(record.id);
      setFormData({
        vehicle_id: record.vehicle_id,
        driver_id: record.driver_id,
        fuel_quantity: record.fuel_quantity,
        fuel_cost: record.fuel_cost,
        odometer_reading: record.odometer_reading,
        fuel_date: new Date(record.fuel_date).toISOString().slice(0, 16),
        fuel_station: record.fuel_station || '',
        remarks: record.remarks || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        vehicle_id: '',
        driver_id: '',
        fuel_quantity: '',
        fuel_cost: '',
        odometer_reading: '',
        fuel_date: '',
        fuel_station: '',
        remarks: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        vehicle_id: parseInt(formData.vehicle_id),
        driver_id: parseInt(formData.driver_id),
        fuel_quantity: parseFloat(formData.fuel_quantity),
        fuel_cost: parseFloat(formData.fuel_cost),
        odometer_reading: parseFloat(formData.odometer_reading)
      };

      if (editingId) {
        await api.put(`/fuel-records/${editingId}`, payload);
      } else {
        await api.post('/fuel-records', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to save fuel record.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/fuel-records/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete fuel record.');
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  if (loading && !records.length) {
    return (
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mb-3"></div>
        <span>Loading Fleet Analytics...</span>
      </div>
    );
  }

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Fuel Monitoring & Analytics</h1>
          <p className="text-slate-400 mt-1">Comprehensive view of fuel records and fleet performance.</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-all font-bold"
          >
            <Plus size={18} /> Add Fuel Record
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Analytics Dashboards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fuel Analytics */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="font-bold text-white text-lg mb-4 flex items-center gap-2 text-sky-400">
            <Fuel /> Fuel Analytics
          </h2>
          {analytics ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">Total Consumed</span> <span className="font-bold text-white">{analytics.total_fuel_consumed.toLocaleString()} L</span></div>
              <div className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">Total Cost</span> <span className="font-bold text-rose-400">{formatCurrency(analytics.total_fuel_cost)}</span></div>
              <div className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">Avg Consumption</span> <span className="font-bold text-white">{analytics.average_fuel_consumption.toFixed(2)} L/Record</span></div>
              <div className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">Highest Usage Vehicle</span> <span className="font-bold text-white">{analytics.highest_fuel_usage_vehicle}</span></div>
              <div className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">Lowest Usage Vehicle</span> <span className="font-bold text-white">{analytics.lowest_fuel_usage_vehicle}</span></div>
            </div>
          ) : <div className="text-slate-500">No data.</div>}
        </div>

        {/* Fleet Dashboard */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="font-bold text-white text-lg mb-4 flex items-center gap-2 text-emerald-400">
            <Truck /> Fleet Dashboard
          </h2>
          {fleetDashboard ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">Total Vehicles</span> <span className="font-bold text-white">{fleetDashboard.total_vehicles}</span></div>
              <div className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">Active / Maintenance</span> <span className="font-bold text-white">{fleetDashboard.active_vehicles} / <span className="text-rose-400">{fleetDashboard.vehicles_under_maintenance}</span></span></div>
              <div className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">Total Drivers</span> <span className="font-bold text-white">{fleetDashboard.total_drivers}</span></div>
              <div className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">Available / Assigned Drivers</span> <span className="font-bold text-white">{fleetDashboard.available_drivers} / {fleetDashboard.assigned_drivers}</span></div>
              <div className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">Total / Completed Trips</span> <span className="font-bold text-white">{fleetDashboard.total_trips} / {fleetDashboard.completed_trips}</span></div>
            </div>
          ) : <div className="text-slate-500">No data.</div>}
        </div>

        {/* Operational Analytics */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="font-bold text-white text-lg mb-4 flex items-center gap-2 text-indigo-400">
            <Activity /> Operational Analytics
          </h2>
          {operations ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">Total Deliveries</span> <span className="font-bold text-white">{operations.total_deliveries}</span></div>
              <div className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">Successful Deliveries</span> <span className="font-bold text-emerald-400">{operations.successful_deliveries}</span></div>
              <div className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">Delayed Deliveries</span> <span className="font-bold text-amber-400">{operations.delayed_deliveries}</span></div>
              <div className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">Cancelled Deliveries</span> <span className="font-bold text-rose-400">{operations.cancelled_deliveries}</span></div>
              <div className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">Avg Trip Distance</span> <span className="font-bold text-white">{operations.average_trip_distance.toFixed(1)} km</span></div>
              <div className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">Avg Delivery Time</span> <span className="font-bold text-white">{operations.average_delivery_time}</span></div>
            </div>
          ) : <div className="text-slate-500">No data.</div>}
        </div>

      </div>

      {/* Records Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden mt-8">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-bold text-white text-lg">Fuel Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4 text-right">Qty (L)</th>
                <th className="px-6 py-4 text-right">Cost ($)</th>
                {canEdit && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-slate-800/30 transition-colors text-slate-300">
                  <td className="px-6 py-4 whitespace-nowrap">#{record.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(record.fuel_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{record.vehicle_license_plate || record.vehicle_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.driver_name || record.driver_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-emerald-400">{record.fuel_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-rose-400">{formatCurrency(record.fuel_cost)}</td>
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openModal(record)} className="text-sky-400 hover:text-sky-300"><Edit size={16} /></button>
                        {user?.role === 'admin' && (
                          <button onClick={() => handleDelete(record.id)} className="text-rose-400 hover:text-rose-300"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">No fuel records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c1228] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Fuel Record' : 'Add Fuel Record'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vehicle ID</label>
                  <select required name="vehicle_id" value={formData.vehicle_id} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all outline-none">
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.make} {v.model} ({v.license_plate})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Driver ID</label>
                  <select required name="driver_id" value={formData.driver_id} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all outline-none">
                    <option value="">Select Driver</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.user_name || 'Driver ' + d.id} ({d.license_number})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quantity (Liters)</label>
                  <input required type="number" step="0.1" name="fuel_quantity" value={formData.fuel_quantity} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cost ($)</label>
                  <input required type="number" step="0.01" name="fuel_cost" value={formData.fuel_cost} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Odometer</label>
                  <input required type="number" step="0.1" name="odometer_reading" value={formData.odometer_reading} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fuel Date</label>
                  <input required type="datetime-local" name="fuel_date" value={formData.fuel_date} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fuel Station</label>
                  <input type="text" name="fuel_station" value={formData.fuel_station} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Remarks</label>
                  <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all outline-none h-24 resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20">{editingId ? 'Update Record' : 'Save Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FuelMonitoring;
