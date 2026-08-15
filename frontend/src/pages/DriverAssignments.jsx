import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { 
  Users, Search, Plus, Navigation, Truck, X, Trash2, Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DriverAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [newAssignment, setNewAssignment] = useState({
    driver_id: '',
    vehicle_id: '',
    trip_id: '',
    remarks: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const canManage = ['admin', 'manager', 'dispatcher'].includes(user?.role);
      
      const requests = [api.get('/driver-assignments')];
      
      if (canManage) {
        requests.push(
          api.get('/drivers'),
          api.get('/vehicles'),
          api.get('/trips')
        );
      }
      
      const results = await Promise.allSettled(requests);
      
      // Always process assignments (first request)
      if (results[0].status === 'fulfilled') {
        setAssignments(results[0].value.data || []);
      } else {
        throw new Error('Failed to load driver assignments');
      }
      
      // Process management data if requested
      if (canManage) {
        setDrivers(results[1]?.status === 'fulfilled' ? results[1].value.data : []);
        setVehicles(results[2]?.status === 'fulfilled' ? results[2].value.data : []);
        setTrips(results[3]?.status === 'fulfilled' ? results[3].value.data : []);
      }
      
      setError('');
    } catch (err) {
      console.error('Failed to load assignments:', err);
      setError('No data available at this time. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/driver-assignments', {
        driver_id: parseInt(newAssignment.driver_id),
        vehicle_id: parseInt(newAssignment.vehicle_id),
        trip_id: parseInt(newAssignment.trip_id),
        remarks: newAssignment.remarks || null
      });
      setShowAddModal(false);
      setNewAssignment({ driver_id: '', vehicle_id: '', trip_id: '', remarks: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to assign driver.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/driver-assignments/${id}`, { assignment_status: status });
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.delete(`/driver-assignments/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete assignment');
    }
  };

  if (loading) {
    return <div className="flex-1 min-h-screen flex items-center justify-center text-slate-400">Loading assignments...</div>;
  }

  const getStatusColor = (status) => {
    const colors = {
      'ASSIGNED': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      'ACTIVE': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'COMPLETED': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      'CANCELLED': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };
    return colors[status] || 'bg-slate-800 text-slate-300';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Driver Assignments</h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
            <Users size={16} className="text-emerald-500" /> Manage active trip and vehicle allocations
          </p>
        </div>
        {['admin', 'manager', 'dispatcher'].includes(user?.role) && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/20"
          >
            <Plus size={18} /> New Assignment
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 mb-6">{error}</div>
      )}

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0a0f24]">
              <tr className="text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <th className="px-6 py-4">Assignment ID</th>
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Trip ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                {['admin', 'manager', 'dispatcher'].includes(user?.role) && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(assignments || []).map(a => (
                <tr key={a.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-slate-300">#ASN-{a.id}</td>
                  <td className="px-6 py-4 text-sm font-bold text-white flex items-center gap-2">
                    <Users size={14} className="text-slate-500" /> {a.driver_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-sky-400 font-mono flex items-center gap-2">
                    <Truck size={14} /> {a.vehicle_plate}
                  </td>
                  <td className="px-6 py-4 text-sm text-emerald-400 font-mono">
                    Trip #{a.trip_id}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusColor(a.assignment_status)}`}>
                      {a.assignment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(a.assignment_date).toLocaleDateString()}
                  </td>
                  {['admin', 'manager', 'dispatcher'].includes(user?.role) && (
                    <td className="px-6 py-4 text-right space-x-2">
                      {a.assignment_status === 'ASSIGNED' && (
                        <button onClick={() => handleStatusUpdate(a.id, 'ACTIVE')} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded">Start</button>
                      )}
                      {a.assignment_status === 'ACTIVE' && (
                        <button onClick={() => handleStatusUpdate(a.id, 'COMPLETED')} className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded">Complete</button>
                      )}
                      {(a.assignment_status === 'ASSIGNED' || a.assignment_status === 'ACTIVE') && (
                        <button onClick={() => handleStatusUpdate(a.id, 'CANCELLED')} className="text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2 py-1 rounded">Cancel</button>
                      )}
                      {user?.role === 'admin' && (
                        <button onClick={() => handleDelete(a.id)} className="text-slate-500 hover:text-rose-400 p-1"><Trash2 size={16}/></button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-slate-500">No assignments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/30">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">Assign Driver</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Select Driver</label>
                <select
                  required
                  value={newAssignment.driver_id}
                  onChange={e => setNewAssignment({...newAssignment, driver_id: e.target.value})}
                  className="w-full bg-[#0a0f24] border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm"
                >
                  <option value="">Choose an available driver</option>
                  {(drivers || []).filter(d => d.status?.toUpperCase() === 'AVAILABLE' && d.id > 0).map(d => (
                    <option key={d.id} value={d.id}>{d.user?.full_name || d.user?.first_name || 'Driver ' + d.id} (Lic: {d.license_number})</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Select Vehicle</label>
                <select
                  required
                  value={newAssignment.vehicle_id}
                  onChange={e => setNewAssignment({...newAssignment, vehicle_id: e.target.value})}
                  className="w-full bg-[#0a0f24] border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm"
                >
                  <option value="">Choose an active vehicle</option>
                  {(vehicles || []).filter(v => v.status?.toUpperCase() === 'ACTIVE' && v.id > 0).map(v => (
                    <option key={v.id} value={v.id}>{v.make} {v.model} - {v.license_plate}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Select Trip</label>
                <select
                  required
                  value={newAssignment.trip_id}
                  onChange={e => setNewAssignment({...newAssignment, trip_id: e.target.value})}
                  className="w-full bg-[#0a0f24] border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm"
                >
                  {(() => {
                    const availableTrips = (trips || []).filter(t => !t.driver_id && t.trip_status?.toLowerCase() !== 'completed' && t.trip_status?.toLowerCase() !== 'cancelled');
                    if (availableTrips.length === 0) {
                      return <option value="" disabled>No eligible trips</option>;
                    }
                    return [
                      <option key="empty" value="">Choose a trip</option>,
                      ...availableTrips.map(t => (
                        <option key={t.id} value={t.id}>Trip #{t.id} ({t.pickup_location} to {t.destination})</option>
                      ))
                    ];
                  })()}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Remarks (Optional)</label>
                <textarea
                  value={newAssignment.remarks}
                  onChange={e => setNewAssignment({...newAssignment, remarks: e.target.value})}
                  className="w-full bg-[#0a0f24] border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm"
                  rows="2"
                ></textarea>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-300 hover:bg-slate-700">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg disabled:opacity-50">
                  {submitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverAssignments;
