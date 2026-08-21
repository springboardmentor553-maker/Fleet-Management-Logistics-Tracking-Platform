import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Truck, MapPin, Search, Filter, 
  CheckCircle2, Clock, AlertCircle, RefreshCw
} from 'lucide-react';

const DriverMonitoring = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, available, on_trip, off_duty
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/drivers/status');
      setDrivers(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold tracking-wide uppercase">
            <CheckCircle2 size={12} />
            Available
          </span>
        );
      case 'on_trip':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold tracking-wide uppercase">
            <Truck size={12} />
            On Trip
          </span>
        );
      case 'off_duty':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-bold tracking-wide uppercase">
            <Clock size={12} />
            Off Duty
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold tracking-wide uppercase">
            <AlertCircle size={12} />
            {status}
          </span>
        );
    }
  };

  const filteredDrivers = (drivers || []).filter(d => {
    const matchesFilter = filter === 'all' || d.status === filter;
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          d.email.toLowerCase().includes(search.toLowerCase()) ||
                          d.license_number.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const availableCount = (drivers || []).filter(d => d.status === 'available').length;
  const onTripCount = (drivers || []).filter(d => d.status === 'on_trip').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit flex items-center gap-3">
            <Users className="text-sky-400" size={32} />
            Driver Monitoring
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time status and assignment tracking for all fleet drivers</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{availableCount}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Available</div>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-sky-400">{onTripCount}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">On Trip</div>
            </div>
          </div>
          <button 
            onClick={fetchDrivers} 
            className="p-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition-all h-full"
            title="Refresh List"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters and Search */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter size={16} className="text-slate-500 mr-1 shrink-0" />
          {['all', 'available', 'on_trip', 'off_duty'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                filter === f 
                  ? 'bg-sky-600 text-white' 
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
        
        <div className="relative max-w-xs w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search drivers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <RefreshCw size={32} className="animate-spin mb-4 text-sky-500" />
            <p>Loading driver monitoring data...</p>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p>No drivers match your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <th className="px-6 py-4">Driver Profile</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">License</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Current Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDrivers.map((d) => (
                  <tr key={d.driver_id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-sky-400">
                          {d.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{d.name}</div>
                          <div className="text-xs text-slate-500">ID: #{d.driver_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-300">{d.email}</div>
                      <div className="text-xs text-slate-500 mt-1">{d.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-slate-300">{d.license_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(d.status)}
                    </td>
                    <td className="px-6 py-4">
                      {d.status === 'on_trip' && d.active_trip_id ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <MapPin size={14} className="text-sky-400" />
                            <span>Trip #{d.active_trip_id}</span>
                          </div>
                          {d.assigned_vehicle_id && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Truck size={12} />
                              <span>Vehicle #{d.assigned_vehicle_id}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-600 italic">No active assignment</span>
                      )}
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

export default DriverMonitoring;
