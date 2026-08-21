import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { Fuel, DollarSign, Activity, TrendingUp, Search, Plus, Calendar, Truck, Trash2, X } from 'lucide-react';
import api from '../api/axios'; // assuming this exists

const FuelDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [analytics, setAnalytics] = useState(null);
  const [monthlyChart, setMonthlyChart] = useState([]);
  const [vehicleChart, setVehicleChart] = useState([]);
  const [driverChart, setDriverChart] = useState([]);
  
  const [logs, setLogs] = useState([]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, monthlyRes, vehiclesRes, driversRes, logsRes] = await Promise.all([
        api.get('/fuel/analytics'),
        api.get('/fuel/charts/monthly'),
        api.get('/fuel/charts/vehicles'),
        api.get('/fuel/charts/drivers'),
        api.get('/fuel')
      ]);
      setAnalytics(analyticsRes.data);
      setMonthlyChart(monthlyRes.data);
      setVehicleChart(vehiclesRes.data);
      setDriverChart(driversRes.data);
      setLogs(logsRes.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mb-3"></div>
        <span>Loading Fuel Analytics...</span>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-12 text-center text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/20">
        {error || 'No data available.'}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Fuel Monitoring & Analytics</h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
            <Fuel size={16} className="text-emerald-500" />
            Track fleet fuel consumption, cost, and efficiency.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Fuel Consumed" value={`${analytics.total_fuel_consumed.toLocaleString()} L`} icon={<Fuel size={20}/>} color="sky" />
        <KpiCard title="Total Fuel Cost" value={formatCurrency(analytics.total_fuel_cost)} icon={<DollarSign size={20}/>} color="rose" />
        <KpiCard title="Avg Consumption / Trip" value={`${analytics.average_trip_consumption.toLocaleString()} L`} icon={<Activity size={20}/>} color="emerald" />
        <KpiCard title="Avg Cost / Trip" value={formatCurrency(analytics.average_cost_per_trip)} icon={<TrendingUp size={20}/>} color="amber" />
      </div>

      {/* Analytics Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Monthly Fuel Usage and Cost */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
            <Calendar className="text-sky-400" /> Monthly Fuel Trend
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis yAxisId="left" stroke="#38bdf8" />
                <YAxis yAxisId="right" orientation="right" stroke="#fb7185" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="fuel_usage" name="Usage (L)" stroke="#38bdf8" strokeWidth={3} />
                <Line yAxisId="right" type="monotone" dataKey="fuel_cost" name="Cost ($)" stroke="#fb7185" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle Fuel Ranking */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
            <Truck className="text-emerald-400" /> Vehicle Fuel Consumption
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleChart.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="license_plate" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                <Bar dataKey="fuel_consumed" name="Fuel Consumed (L)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-between text-sm text-slate-400">
            <span>Most Efficient: <strong className="text-white">{analytics.most_efficient_vehicle}</strong></span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
         {/* Driver Fuel Ranking */}
         <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
            <Activity className="text-amber-400" /> Top Driver Fuel Consumption
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={driverChart.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="driver_name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                <Bar dataKey="fuel_consumed" name="Fuel Consumed (L)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-between text-sm text-slate-400">
            <span>Highest Consuming: <strong className="text-white">{analytics.highest_consuming_driver}</strong></span>
          </div>
        </div>

        {/* Recent Fuel Logs List (Top 5) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col">
          <h2 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
            <Fuel className="text-sky-400" /> Recent Fuel Entries
          </h2>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {(logs || []).slice(0, 5).map((log, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 border-b border-slate-800/60 last:border-0 hover:bg-slate-800/40 rounded-lg transition-colors">
                <div>
                  <div className="font-bold text-white">{log.vehicle_license_plate}</div>
                  <div className="text-xs text-slate-400">{new Date(log.fuel_date).toLocaleDateString()} - {log.fuel_station || 'Unknown Station'}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-400">{log.fuel_quantity} L</div>
                  <div className="text-xs text-rose-400">{formatCurrency(log.fuel_cost)}</div>
                </div>
              </div>
            ))}
            {(logs || []).length === 0 && (
              <div className="text-center text-slate-500 text-sm mt-10">No recent logs found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon, color }) => {
  const colorMap = {
    sky: 'bg-sky-500/10 text-sky-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    rose: 'bg-rose-500/10 text-rose-400',
  };
  const valColorMap = {
    sky: 'text-sky-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
  };
  
  return (
    <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-slate-800/80 shadow-lg">
      <div className={`p-3.5 rounded-xl flex-shrink-0 ${colorMap[color] || colorMap.sky}`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{title}</p>
        <h3 className={`text-2xl font-black mt-1 ${valColorMap[color] || 'text-white'}`}>{value}</h3>
      </div>
    </div>
  );
};

export default FuelDashboard;
