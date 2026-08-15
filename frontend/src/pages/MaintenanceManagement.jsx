import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  Wrench, Calendar, DollarSign, Plus, Edit2, Trash2, CheckCircle2, 
  AlertCircle, RefreshCw, X, Truck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  getMaintenanceAlerts,
  getMaintenanceSummary,
  getMaintenanceReportDetails
} from '../api/maintenance';

const MaintenanceManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [summary, setSummary] = useState(null);
  const [report, setReport] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    maintenance_category: 'General Inspection',
    service_date: '',
    next_service_date: '',
    service_cost: '',
    service_provider: '',
    maintenance_status: 'scheduled',
    notes: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const [recordsRes, vehiclesRes, summaryRes, reportRes, alertsRes] = await Promise.all([
        getMaintenanceRecords(),
        api.get('/vehicles'),
        getMaintenanceSummary(),
        getMaintenanceReportDetails(),
        getMaintenanceAlerts()
      ]);
      setRecords(recordsRes);
      setVehicles(vehiclesRes.data);
      setSummary(summaryRes);
      setReport(reportRes);
      setAlerts(alertsRes);
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
      vehicle_id: '',
      maintenance_category: 'General Inspection',
      service_date: new Date().toISOString().slice(0, 16),
      next_service_date: '',
      service_cost: '',
      service_provider: '',
      maintenance_status: 'scheduled',
      notes: ''
    });
    setShowForm(true);
  };

  const handleOpenEdit = (record) => {
    setEditingId(record.id);
    setFormData({
      vehicle_id: record.vehicle_id || '',
      maintenance_category: record.maintenance_category || 'General Inspection',
      service_date: record.service_date ? new Date(record.service_date).toISOString().slice(0, 16) : '',
      next_service_date: record.next_service_date ? new Date(record.next_service_date).toISOString().slice(0, 16) : '',
      service_cost: record.service_cost || '',
      service_provider: record.service_provider || '',
      maintenance_status: record.maintenance_status || 'scheduled',
      notes: record.notes || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      vehicle_id: parseInt(formData.vehicle_id),
      maintenance_category: formData.maintenance_category,
      service_date: new Date(formData.service_date).toISOString(),
      maintenance_status: formData.maintenance_status,
      notes: formData.notes
    };
    
    if (formData.next_service_date) {
        payload.next_service_date = new Date(formData.next_service_date).toISOString();
    }
    if (formData.service_cost) {
        payload.service_cost = parseFloat(formData.service_cost);
    }
    if (formData.service_provider) {
        payload.service_provider = formData.service_provider;
    }

    try {
      if (editingId) {
        // vehicle_id is read-only on update typically, but we'll include if API allows
        const updatePayload = { ...payload };
        delete updatePayload.vehicle_id; // prevent updating vehicle id just in case
        await updateMaintenanceRecord(editingId, updatePayload);
        setSuccess('Record updated successfully!');
      } else {
        await createMaintenanceRecord(payload);
        setSuccess('Record created successfully!');
      }
      setShowForm(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Operation failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this maintenance record?')) return;
    setError('');
    setSuccess('');
    try {
      await deleteMaintenanceRecord(id);
      setSuccess('Record deleted successfully!');
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 401 ? 'Please login again.' : err.response?.status === 403 ? 'You are not authorized to access this page.' : err.response?.data?.detail || 'Unable to connect to the server.');
    }
  };

  const getVehiclePlate = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})` : `Vehicle ID: ${vehicleId}`;
  };

  const isWriteAllowed = ['admin', 'manager'].includes(user?.role);
  
  // Calculate stats (Now using API summary)
  
  const getAlertStatus = (nextDate) => {
      if (!nextDate) return { text: '', color: '' };
      const next = new Date(nextDate);
      const now = new Date();
      const diffTime = next - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return { text: 'Service Overdue', color: 'text-red-400 bg-red-500/10 border border-red-500/20' };
      if (diffDays <= 7) return { text: 'Service Due Soon', color: 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20' };
      return { text: 'Normal', color: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' };
  };

  if (loading && records.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-indigo-400" />
            Maintenance Management
          </h1>
          <p className="text-slate-400 mt-1">Manage and track fleet maintenance</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchInitialData}
            className="p-2 glass-panel text-slate-400 rounded-lg hover:bg-slate-900/40 border"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {isWriteAllowed && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Record
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-start">
          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-green-400">{success}</p>
        </div>
      )}

      {/* Stats Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-panel rounded-xl border border-slate-800 p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Records</p>
            <h3 className="text-2xl font-bold text-white mt-1">{summary.total_records}</h3>
          </div>
          <div className="glass-panel rounded-xl border border-slate-800 p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-bold text-green-400 mt-1">{summary.completed}</h3>
          </div>
          <div className="glass-panel rounded-xl border border-slate-800 p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">In Progress</p>
            <h3 className="text-2xl font-bold text-blue-400 mt-1">{summary.in_progress}</h3>
          </div>
          <div className="glass-panel rounded-xl border border-slate-800 p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overdue</p>
            <h3 className="text-2xl font-bold text-red-400 mt-1">{summary.overdue}</h3>
          </div>
          <div className="glass-panel rounded-xl border border-slate-800 p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Due Soon</p>
            <h3 className="text-2xl font-bold text-yellow-400 mt-1">{summary.due_soon}</h3>
          </div>
          <div className="glass-panel rounded-xl border border-slate-800 p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Cost</p>
            <h3 className="text-2xl font-bold text-indigo-400 mt-1">${summary.total_cost.toFixed(2)}</h3>
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <div className="glass-panel rounded-xl border border-slate-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            Maintenance Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(alerts || []).filter(a => ['OVERDUE', 'DUE_SOON', 'IN_PROGRESS'].includes(a.alert_type)).map((alert, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${
                alert.alert_type === 'OVERDUE' ? 'bg-red-500/10 border-red-100' :
                alert.alert_type === 'DUE_SOON' ? 'bg-yellow-500/10 border-yellow-100' :
                'bg-blue-500/10 border-blue-100'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm text-white">{alert.vehicle}</span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    alert.alert_type === 'OVERDUE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    alert.alert_type === 'DUE_SOON' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {alert.alert_type === 'OVERDUE' ? '🔴 Overdue' :
                     alert.alert_type === 'DUE_SOON' ? '🟡 Due Soon' :
                     '🔵 In Progress'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mb-1">{alert.license_plate}</p>
                {alert.next_service_date && (
                  <p className="text-xs text-slate-400 mt-2">Due: {new Date(alert.next_service_date).toLocaleDateString()}</p>
                )}
              </div>
            ))}
            {(alerts || []).filter(a => ['OVERDUE', 'DUE_SOON', 'IN_PROGRESS'].includes(a.alert_type)).length === 0 && (
              <p className="text-sm text-slate-400">No urgent maintenance alerts.</p>
            )}
          </div>
        </div>
      )}

      {/* Reports Section */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Maintenance by Category</h2>
            <div className="space-y-3">
              {(report.category_summary || []).map((cat, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 hover:bg-slate-900/40 rounded-lg border border-transparent hover:border-slate-800 transition-colors">
                  <span className="text-sm font-medium text-slate-300">{cat.category}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{cat.count} records</p>
                    <p className="text-xs text-slate-400">${cat.total_cost.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Top Cost by Vehicle</h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {[...(report.vehicle_summary || [])].sort((a,b) => b.total_cost - a.total_cost).slice(0, 5).map((veh, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 hover:bg-slate-900/40 rounded-lg border border-transparent hover:border-slate-800 transition-colors">
                  <div>
                    <span className="text-sm font-medium text-slate-300 block">{veh.vehicle}</span>
                    <span className="text-xs text-slate-400 block">{veh.maintenance_count} services</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-400">${veh.total_cost.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Status Distribution</h2>
            <div className="space-y-3">
              {(report.status_summary || []).map((stat, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 hover:bg-slate-900/40 rounded-lg border border-transparent hover:border-slate-800 transition-colors">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    stat.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ' :
                    stat.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 ' :
                    stat.status === 'scheduled' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 ' :
                    'bg-slate-800 text-slate-300 border-slate-800'
                  }`}>
                    {stat.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{stat.count} records</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-slate-900/40 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Alerts</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                {isWriteAllowed && (
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(records || []).map((record) => {
                const alert = getAlertStatus(record.next_service_date);
                return (
                  <tr key={record.id} className="hover:bg-slate-900/40/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Truck className="w-4 h-4 text-slate-500 mr-2" />
                        <span className="font-medium text-white">{getVehiclePlate(record.vehicle_id)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{record.maintenance_category}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(record.service_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {alert.text && (
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${alert.color}`}>
                          {alert.text}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {record.service_cost ? `$${record.service_cost.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${record.maintenance_status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                          record.maintenance_status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          record.maintenance_status === 'scheduled' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                          'bg-slate-800 text-slate-200'}`}>
                        {record.maintenance_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    {isWriteAllowed && (
                      <td className="px-6 py-4 text-right space-x-3">
                        <button
                          onClick={() => handleOpenEdit(record)}
                          className="text-indigo-400 hover:text-indigo-400 transition-colors"
                          title="Edit Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-red-400 hover:text-red-400 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr>
                  <td colSpan={isWriteAllowed ? 7 : 6} className="px-6 py-12 text-center text-slate-400 bg-slate-900/40/50">
                    <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-white">No maintenance records found</p>
                    <p className="text-sm">Get started by creating a new maintenance record.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 sticky top-0 glass-panel">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Edit Maintenance Record' : 'Create Maintenance Record'}
              </h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-slate-500 hover:text-slate-400 hover:bg-slate-800 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {!editingId && (
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-slate-300">Vehicle</label>
                    <select
                      required
                      value={formData.vehicle_id}
                      onChange={e => setFormData({...formData, vehicle_id: e.target.value})}
                      className="w-full bg-[#0a0f24] border-slate-700 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 text-white"
                    >
                      <option value="" className="text-white">Select a vehicle...</option>
                      {(vehicles || []).map(v => (
                        <option key={v.id} value={v.id} className="text-white">
                          {v.make} {v.model} ({v.license_plate})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Category</label>
                  <select
                    required
                    value={formData.maintenance_category}
                    onChange={e => setFormData({...formData, maintenance_category: e.target.value})}
                    className="w-full bg-[#0a0f24] border-slate-700 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 text-white"
                  >
                    <option value="Oil Change" className="text-white">Oil Change</option>
                    <option value="Tyre Replacement" className="text-white">Tire Replacement</option>
                    <option value="Brake Service" className="text-white">Brake Service</option>
                    <option value="Engine Service" className="text-white">Engine Service</option>
                    <option value="General Inspection" className="text-white">General Inspection</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Status</label>
                  <select
                    required
                    value={formData.maintenance_status}
                    onChange={e => setFormData({...formData, maintenance_status: e.target.value})}
                    className="w-full bg-[#0a0f24] border-slate-700 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 text-white"
                  >
                    <option value="scheduled" className="text-white">Scheduled</option>
                    <option value="in_progress" className="text-white">In Progress</option>
                    <option value="completed" className="text-white">Completed</option>
                    <option value="cancelled" className="text-white">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Service Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.service_date}
                    onChange={e => setFormData({...formData, service_date: e.target.value})}
                    className="w-full bg-[#0a0f24] border-slate-700 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Next Service Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.next_service_date}
                    onChange={e => setFormData({...formData, next_service_date: e.target.value})}
                    className="w-full bg-[#0a0f24] text-white placeholder-slate-400 border-slate-700 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Service Cost (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.service_cost}
                      onChange={e => setFormData({...formData, service_cost: e.target.value})}
                      className="w-full bg-[#0a0f24] text-white placeholder-slate-400 pl-10 border-slate-700 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Service Provider (Optional)</label>
                  <input
                    type="text"
                    value={formData.service_provider}
                    onChange={e => setFormData({...formData, service_provider: e.target.value})}
                    className="w-full bg-[#0a0f24] text-white placeholder-slate-400 border-slate-700 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3"
                    placeholder="e.g. QuickLube"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-slate-300">Notes (Optional)</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="w-full bg-[#0a0f24] text-white placeholder-slate-400 border-slate-700 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3"
                    placeholder="Additional details..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-900/40 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  {editingId ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceManagement;
