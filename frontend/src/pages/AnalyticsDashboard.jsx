import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, BarChart3, Truck, Users, Package, Navigation, 
  CheckCircle2, AlertCircle, Calendar, RefreshCw
} from 'lucide-react';
import { 
  getAnalyticsOverview, getDriverAnalytics, 
  getVehicleAnalytics, getShipmentAnalytics, getTripAnalytics 
} from '../api/analytics';

const AnalyticsDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [drivers, setDrivers] = useState(null);
  const [vehicles, setVehicles] = useState(null);
  const [shipments, setShipments] = useState(null);
  const [trips, setTrips] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const [o, d, v, s, t] = await Promise.all([
        getAnalyticsOverview(),
        getDriverAnalytics(),
        getVehicleAnalytics(),
        getShipmentAnalytics(),
        getTripAnalytics()
      ]);
      setOverview(o);
      setDrivers(d);
      setVehicles(v);
      setShipments(s);
      setTrips(t);
      setLastRefreshed(new Date());
      setError('');
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('No data available at this time.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto Refresh every 30 seconds
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => {
      fetchData(true);
    }, 30000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  if (loading && !overview) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-3"></div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-md">
        <p className="text-red-400">{error || 'Data unavailable.'}</p>
      </div>
    );
  }

  const formatTime = (date) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(date);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            Operational Analytics
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
            <Activity size={16} className="text-emerald-500" />
            Live Analytics Feed • Last updated: {formatTime(lastRefreshed)}
          </p>
        </div>
        <button 
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            refreshing ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
          }`}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* KPI Cards (Overview) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <KpiCard title="Total Trips" value={overview.total_trips} color="indigo" />
        <KpiCard title="Active Trips" value={overview.active_trips} color="blue" />
        <KpiCard title="Shipments" value={overview.total_shipments} color="purple" />
        <KpiCard title="Delivered" value={overview.delivered_shipments} color="emerald" />
        <KpiCard title="Total Drivers" value={overview.total_drivers} color="sky" />
        <KpiCard title="Available" value={overview.available_drivers} color="emerald" />
        <KpiCard title="Vehicles" value={overview.total_vehicles} color="slate" />
      </div>

      {/* Analytics Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Driver Analytics */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="font-bold text-white text-lg mb-6 flex items-center gap-2 border-b pb-4">
            <Users className="text-sky-500" /> Driver Analytics
          </h2>
          <div className="space-y-5">
            <StatRow label="Total Drivers" value={drivers.total_drivers} />
            <StatRow label="Available" value={drivers.available} color="text-emerald-400" />
            <StatRow label="On Trip" value={drivers.on_trip} color="text-blue-400" />
            <StatRow label="On Leave" value={drivers.on_leave} color="text-amber-400" />
            <StatRow label="Attendance Today" value={drivers.attendance_today} color="text-indigo-400" />
            
            <div className="pt-4 mt-2 border-t border-slate-800">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-slate-400">Utilization Rate</span>
                <span className="font-bold text-sky-400">{drivers.utilization_percentage}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-sky-500/100 h-2 rounded-full" style={{ width: `${drivers.utilization_percentage}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Analytics */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="font-bold text-white text-lg mb-6 flex items-center gap-2 border-b pb-4">
            <Truck className="text-emerald-500" /> Vehicle Analytics
          </h2>
          <div className="space-y-5">
            <StatRow label="Total Vehicles" value={overview.total_vehicles} />
            <StatRow label="Active Vehicles" value={vehicles.active_vehicles} color="text-emerald-400" />
            <StatRow label="Maintenance Vehicles" value={vehicles.maintenance_vehicles} color="text-amber-400" />
            <StatRow label="Inactive Vehicles" value={vehicles.inactive_vehicles} color="text-slate-500" />
            
            <div className="pt-4 mt-2 border-t border-slate-800">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-slate-400">Utilization Rate</span>
                <span className="font-bold text-emerald-400">{vehicles.utilization_percentage}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-emerald-500/100 h-2 rounded-full" style={{ width: `${vehicles.utilization_percentage}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipment Analytics */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="font-bold text-white text-lg mb-6 flex items-center gap-2 border-b pb-4">
            <Package className="text-purple-500" /> Shipment Analytics
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <StatRow label="Pending" value={shipments.pending} />
            <StatRow label="Assigned" value={shipments.assigned} color="text-sky-400" />
            <StatRow label="Picked Up" value={shipments.picked_up} color="text-indigo-400" />
            <StatRow label="In Transit" value={shipments.in_transit} color="text-blue-400" />
            <StatRow label="Out for Delivery" value={shipments.out_for_delivery} color="text-purple-400" />
            <StatRow label="Delivered" value={shipments.delivered} color="text-emerald-400" />
            <StatRow label="Delayed" value={shipments.delayed} color="text-amber-400" />
            <StatRow label="Cancelled" value={shipments.cancelled} color="text-red-400" />
          </div>
        </div>

        {/* Trip Analytics */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="font-bold text-white text-lg mb-6 flex items-center gap-2 border-b pb-4">
            <Navigation className="text-blue-500" /> Trip Analytics
          </h2>
          <div className="space-y-5">
            <StatRow label="Total Trips" value={trips.total_trips} />
            <StatRow label="Active Trips" value={trips.active} color="text-blue-400" />
            <StatRow label="Completed Trips" value={trips.completed} color="text-emerald-400" />
            <StatRow label="Cancelled Trips" value={trips.cancelled} color="text-red-400" />
            
            <div className="pt-4 mt-2 border-t border-slate-800">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-slate-400">Completion Rate</span>
                <span className="font-bold text-blue-400">{trips.completion_rate}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-blue-500/100 h-2 rounded-full" style={{ width: `${trips.completion_rate}%` }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const KpiCard = ({ title, value, color }) => {
  const bgColors = {
    indigo: 'bg-indigo-500/10 border-indigo-100',
    blue: 'bg-blue-500/10 border-blue-100',
    purple: 'bg-purple-500/10 border-purple-100',
    emerald: 'bg-emerald-500/10 border-emerald-100',
    sky: 'bg-sky-500/10 border-sky-500/20',
    slate: 'bg-slate-500/10 border-slate-200',
  };
  const textColors = {
    indigo: 'text-indigo-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    emerald: 'text-emerald-400',
    sky: 'text-sky-400',
    slate: 'text-slate-300',
  };
  
  return (
    <div className={`p-4 rounded-xl border ${bgColors[color] || 'bg-slate-900/40 border-slate-800'}`}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      <h3 className={`text-2xl font-black ${textColors[color] || 'text-white'}`}>{value}</h3>
    </div>
  );
};

const StatRow = ({ label, value, color = "text-white" }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-400 font-medium">{label}</span>
    <span className={`font-bold ${color} text-base`}>{value}</span>
  </div>
);

export default AnalyticsDashboard;
