import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { 
  Users, Plus, Calendar, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Attendance = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    driver_id: '',
    date: new Date().toISOString().split('T')[0],
    attendance_status: 'Present',
    check_in_time: '',
    check_out_time: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance').catch(() => ({ data: [] }));
      setRecords(res.data || []);
      if (['admin', 'manager'].includes(user?.role)) {
        const dRes = await api.get('/drivers').catch(() => ({ data: [] }));
        setDrivers(dRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newRecord,
        driver_id: parseInt(newRecord.driver_id),
        check_in_time: newRecord.check_in_time ? new Date(`${newRecord.date}T${newRecord.check_in_time}`).toISOString() : null,
        check_out_time: newRecord.check_out_time ? new Date(`${newRecord.date}T${newRecord.check_out_time}`).toISOString() : null,
      };
      await api.post('/attendance', payload);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to mark attendance.');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'Present': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'Absent': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      'Leave': 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${map[status] || 'bg-slate-800'}`}>{status}</span>;
  };

  if (loading) return <div className="flex-1 min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Driver Attendance</h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
            <Calendar size={16} className="text-indigo-500" /> Track daily attendance and availability
          </p>
        </div>
        {['admin', 'manager'].includes(user?.role) && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20"
          >
            <Plus size={18} /> Mark Attendance
          </button>
        )}
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0a0f24]">
              <tr className="text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(records || []).map(r => (
                <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-white">{r.date}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{r.driver_name}</td>
                  <td className="px-6 py-4">{getStatusBadge(r.attendance_status)}</td>
                  <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                    {r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                    {r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : '-'}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-slate-500">No attendance records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">Mark Attendance</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Driver</label>
                <select required value={newRecord.driver_id} onChange={e => setNewRecord({...newRecord, driver_id: e.target.value})} className="w-full bg-[#0a0f24] border border-slate-700 rounded-lg px-4 py-2 text-white">
                  <option value="">Select Driver</option>
                  {(drivers || []).map(d => (
                    <option key={d.id} value={d.id}>{d.user_name || 'Unknown Driver'}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                <input type="date" required value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} className="w-full bg-[#0a0f24] border border-slate-700 rounded-lg px-4 py-2 text-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Status</label>
                <select value={newRecord.attendance_status} onChange={e => setNewRecord({...newRecord, attendance_status: e.target.value})} className="w-full bg-[#0a0f24] border border-slate-700 rounded-lg px-4 py-2 text-white">
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Check In</label>
                  <input type="time" value={newRecord.check_in_time} onChange={e => setNewRecord({...newRecord, check_in_time: e.target.value})} className="w-full bg-[#0a0f24] border border-slate-700 rounded-lg px-4 py-2 text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Check Out</label>
                  <input type="time" value={newRecord.check_out_time} onChange={e => setNewRecord({...newRecord, check_out_time: e.target.value})} className="w-full bg-[#0a0f24] border border-slate-700 rounded-lg px-4 py-2 text-white" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 font-bold text-slate-300 hover:text-white">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white shadow-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
