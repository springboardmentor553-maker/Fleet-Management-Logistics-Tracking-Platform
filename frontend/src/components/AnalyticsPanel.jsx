import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  BarChart3, Truck, Users, Package, Navigation, 
  CheckCircle2, AlertCircle, AlertTriangle, 
  Wrench, ShieldCheck, Activity, Map
} from 'lucide-react';

const AnalyticsPanel = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/analytics');
        setAnalytics(response.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError('Failed to load performance analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent mb-3"></div>
        <span>Crunching analytics...</span>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-12 text-center text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
        {error || 'Failed to load data.'}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. KPI Cards */}
      <h2 className="text-xl font-bold text-white mb-2">Fleet Performance Overview</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vehicles */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Vehicles</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{analytics.fleet.totalVehicles}</h3>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl"><Truck size={20} /></div>
        </div>
        
        {/* Active Vehicles */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Vehicles</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{analytics.fleet.activeVehicles}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><CheckCircle2 size={20} /></div>
        </div>
        
        {/* Drivers */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drivers</p>
            <h3 className="text-2xl font-extrabold text-indigo-400 mt-1">{analytics.drivers.totalDrivers}</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl"><Users size={20} /></div>
        </div>

        {/* Trips */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Trips</p>
            <h3 className="text-2xl font-extrabold text-sky-400 mt-1">{analytics.trips.totalTrips}</h3>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl"><Navigation size={20} /></div>
        </div>

        {/* Shipments */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shipments</p>
            <h3 className="text-2xl font-extrabold text-purple-400 mt-1">{analytics.shipments.totalShipments}</h3>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl"><Package size={20} /></div>
        </div>

        {/* Completed Deliveries */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Del.</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{analytics.deliveryPerformance.completed}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><CheckCircle2 size={20} /></div>
        </div>

        {/* Delayed Deliveries */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delayed Del.</p>
            <h3 className="text-2xl font-extrabold text-rose-400 mt-1">{analytics.deliveryPerformance.delayed}</h3>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl"><AlertCircle size={20} /></div>
        </div>

        {/* Maintenance Vehicles */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Maintenance</p>
            <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{analytics.fleet.vehiclesUnderMaintenance}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Wrench size={20} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Delivery Performance */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 flex flex-col">
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-white text-lg">Delivery Performance</h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-emerald-400">{analytics.deliveryPerformance.successRate}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Success Rate</span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Total Assigned Deliveries</span>
              <span className="font-bold text-white">{analytics.deliveryPerformance.totalDeliveries}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Completed Successfully</span>
              <span className="font-bold text-emerald-400">{analytics.deliveryPerformance.completed}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Delayed Deliveries</span>
              <span className="font-bold text-rose-400">{analytics.deliveryPerformance.delayed}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Cancelled Deliveries</span>
              <span className="font-bold text-amber-400">{analytics.deliveryPerformance.cancelled}</span>
            </div>
          </div>
        </div>

        {/* Fleet Statistics Details */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 flex flex-col">
          <div className="px-6 py-5 border-b border-slate-800">
            <h2 className="font-bold text-white text-lg">Fleet & Driver Statistics</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Vehicle States</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-300">Active</span><span className="font-bold text-emerald-400">{analytics.fleet.activeVehicles}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-300">Maintenance</span><span className="font-bold text-amber-400">{analytics.fleet.vehiclesUnderMaintenance}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-300">Inactive</span><span className="font-bold text-rose-400">{analytics.fleet.inactiveVehicles}</span></div>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Driver States</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-300">Available</span><span className="font-bold text-emerald-400">{analytics.drivers.availableDrivers}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-300">On Trip</span><span className="font-bold text-sky-400">{analytics.drivers.driversOnTrip}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-300">Off Duty</span><span className="font-bold text-amber-400">{analytics.drivers.offDutyDrivers}</span></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Driver Performance */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="px-6 py-5 border-b border-slate-800">
            <h2 className="font-bold text-white text-lg">Driver Performance</h2>
          </div>
          <div className="overflow-x-auto max-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#0a0f24] z-10">
                <tr className="text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <th className="px-6 py-3">Driver Name</th>
                  <th className="px-6 py-3">Completed</th>
                  <th className="px-6 py-3">Active</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {analytics.driverPerformance.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-3 text-sm font-semibold text-white">{d.driver}</td>
                    <td className="px-6 py-3 text-sm text-emerald-400 font-bold">{d.completedTrips}</td>
                    <td className="px-6 py-3 text-sm text-sky-400 font-bold">{d.activeTrips}</td>
                    <td className="px-6 py-3">
                      <span className={`text-[9px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full border ${
                        d.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        d.status === 'on_trip' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {analytics.driverPerformance.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center p-6 text-slate-500 text-sm">No driver stats available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Utilization */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="px-6 py-5 border-b border-slate-800">
            <h2 className="font-bold text-white text-lg">Vehicle Utilization</h2>
          </div>
          <div className="overflow-x-auto max-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#0a0f24] z-10">
                <tr className="text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <th className="px-6 py-3">Vehicle</th>
                  <th className="px-6 py-3">Total Trips</th>
                  <th className="px-6 py-3">Maintenance</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {analytics.vehicleUtilization.map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-3">
                      <div className="font-semibold text-white text-sm">{v.vehicleName}</div>
                      <div className="text-slate-400 text-xs font-mono">{v.licensePlate}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-sky-400 font-bold">{v.totalTrips}</td>
                    <td className="px-6 py-3 text-sm text-amber-400 font-bold">{v.maintenanceCount}</td>
                    <td className="px-6 py-3">
                      <span className={`text-[9px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full border ${
                        v.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        v.status === 'maintenance' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {analytics.vehicleUtilization.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center p-6 text-slate-500 text-sm">No vehicle stats available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AnalyticsPanel;
