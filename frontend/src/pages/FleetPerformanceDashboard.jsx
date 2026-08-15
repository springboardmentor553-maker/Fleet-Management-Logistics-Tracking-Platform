import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, BarChart3, Truck, Users, Package, 
  RefreshCw, TrendingUp, HeartPulse, CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { getFleetPerformance, getFleetSummary, getFleetCharts } from '../api/fleet';

const FleetPerformanceDashboard = () => {
  const [performance, setPerformance] = useState(null);
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const [perfData, summaryData, chartsData] = await Promise.all([
        getFleetPerformance(),
        getFleetSummary(),
        getFleetCharts()
      ]);
      setPerformance(perfData);
      setSummary(summaryData);
      setCharts(chartsData);
      setLastRefreshed(new Date());
      setError('');
    } catch (err) {
      console.error('Failed to fetch fleet performance data:', err);
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

  if (loading && !performance) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-white font-medium tracking-wide">Loading Fleet Analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !performance) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border-l-4 border-red-500 p-6 rounded-r-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" />
            <p className="text-red-400 font-medium text-lg">{error || 'Data unavailable.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (date) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(date);

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#0a0f24] text-slate-200 min-h-screen pb-20 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <Activity className="w-8 h-8 text-indigo-400" />
            Fleet Performance Dashboard
          </h1>
          <p className="text-white mt-2 flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 size={16} className="text-emerald-500" />
            Live System Status • Last updated: {formatTime(lastRefreshed)}
          </p>
        </div>
        <button 
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            refreshing ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
          }`}
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Fleet Health Score" 
          value={`${summary.fleet_health}%`} 
          icon={<HeartPulse size={24} />} 
          color="emerald" 
          subtitle={`${summary.maintenance_due} vehicles need maintenance soon`}
        />
        <MetricCard 
          title="Delivery Success Rate" 
          value={`${performance.delivery_success_rate}%`} 
          icon={<Package size={24} />} 
          color="indigo" 
          subtitle={`${summary.deliveries_today} deliveries completed today`}
        />
        <MetricCard 
          title="Vehicle Utilization" 
          value={`${performance.vehicle_utilization}%`} 
          icon={<Truck size={24} />} 
          color="blue" 
          subtitle={`${performance.active_vehicles} of ${performance.fleet_size} vehicles active`}
        />
        <MetricCard 
          title="Driver Utilization" 
          value={`${performance.driver_utilization}%`} 
          icon={<Users size={24} />} 
          color="purple" 
          subtitle={`${summary.active_drivers} drivers currently active/on-trip`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Trend Charts Section */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="text-indigo-500" /> Performance Trends (Current Year)
            </h2>
            
            <div className="space-y-8">
              {/* Monthly Deliveries Bar Chart */}
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Monthly Deliveries</h3>
                <div className="h-48 flex items-end gap-2 md:gap-4">
                  {(charts.monthly_deliveries || []).map((point, idx) => {
                    const maxVal = Math.max(...(charts.monthly_deliveries || []).map(d => d.value), 1);
                    const heightPct = (point.value / maxVal) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full">
                        <div className="w-full bg-slate-800 rounded-t-md relative flex-1 flex items-end justify-center transition-all">
                          <div 
                            className="w-full bg-indigo-500/100 rounded-t-md transition-all duration-500 group-hover:bg-indigo-600" 
                            style={{ height: `${heightPct}%` }}
                          ></div>
                          <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded font-bold pointer-events-none">
                            {point.value}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-white">{point.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Monthly Trips Bar Chart */}
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Monthly Trips</h3>
                <div className="h-48 flex items-end gap-2 md:gap-4">
                  {(charts.monthly_trips || []).map((point, idx) => {
                    const maxVal = Math.max(...(charts.monthly_trips || []).map(d => d.value), 1);
                    const heightPct = (point.value / maxVal) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full">
                        <div className="w-full bg-slate-800 rounded-t-md relative flex-1 flex items-end justify-center transition-all">
                          <div 
                            className="w-full bg-blue-400 rounded-t-md transition-all duration-500 group-hover:bg-blue-500/100" 
                            style={{ height: `${heightPct}%` }}
                          ></div>
                          <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded font-bold pointer-events-none">
                            {point.value}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-white">{point.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <h2 className="text-lg font-bold text-white mb-6 border-b pb-3">Shipment Status</h2>
              <div className="space-y-4">
                {(charts.shipment_status || []).map((item, idx) => (
                  <ProgressBar key={idx} label={item.name} value={item.value} total={(charts.shipment_status || []).reduce((a,b)=>a+b.value, 0)} colorClass={['bg-purple-500/100', 'bg-sky-500/100', 'bg-emerald-500/100', 'bg-rose-500/100'][idx % 4]} textColorClass={['text-purple-400', 'text-sky-400', 'text-emerald-400', 'text-rose-400'][idx % 4]} />
                ))}
              </div>
            </div>
            
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <h2 className="text-lg font-bold text-white mb-6 border-b pb-3">Vehicle Status</h2>
              <div className="space-y-4">
                {(charts.vehicle_status || []).map((item, idx) => (
                  <ProgressBar key={idx} label={item.name} value={item.value} total={(charts.vehicle_status || []).reduce((a,b)=>a+b.value, 0)} colorClass={['bg-emerald-500/100', 'bg-amber-500/100', 'bg-slate-400'][idx % 3]} textColorClass={['text-emerald-400', 'text-amber-400', 'text-slate-400'][idx % 3]} />
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Detailed Stats */}
        <div className="space-y-8">
          
          {/* Driver Availability Donut (Simulated with Bars for layout consistency) */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
             <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Users className="text-purple-500" /> Driver Overview
            </h2>
            <div className="space-y-6">
              {(charts.driver_availability || []).map((item, idx) => {
                const total = (charts.driver_availability || []).reduce((a,b)=>a+b.value,0);
                const pct = total > 0 ? Math.round((item.value/total)*100) : 0;
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span className="text-white">{item.name}</span>
                      <span className={['text-emerald-400', 'text-blue-400', 'text-slate-400'][idx%3]}>{item.value} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${['bg-emerald-500/100', 'bg-blue-500/100', 'bg-slate-400'][idx%3]}`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Metrics List */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-white mb-6 border-b pb-3">Quick Summary</h2>
            <div className="space-y-4">
              <SummaryRow label="Active Trips" value={performance.active_trips} colorClass="text-sky-400" />
              <SummaryRow label="Completed Trips" value={performance.completed_trips} colorClass="text-emerald-400" />
              <SummaryRow label="Vehicles On Trip" value={performance.on_trip} colorClass="text-indigo-400" />
              <SummaryRow label="Maintenance Vehicles" value={performance.maintenance} colorClass="text-rose-400" />
              <SummaryRow label="Fuel Usage (est.)" value={`${summary.fuel_usage_summary} L`} colorClass="text-amber-400" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subtitle, icon, color }) => {
  const bgColors = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  };
  
  return (
    <div className={`p-6 rounded-2xl border flex flex-col justify-between ${bgColors[color] || 'bg-slate-900/40 border-slate-800'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl glass-panel bg-opacity-60 backdrop-blur-sm`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-[2.5rem] font-black leading-none mb-2 text-white">{value}</h3>
        <p className="text-sm font-bold uppercase tracking-wider opacity-80 text-slate-300">{title}</p>
        <p className="text-xs mt-3 opacity-70 font-medium text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
};

const ProgressBar = ({ label, value, total, colorClass, textColorClass }) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-semibold text-white">{label}</span>
        <span className={`font-bold ${textColorClass || 'text-white'}`}>{value}</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2">
        <div className={`${colorClass} h-2 rounded-full`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
};

const SummaryRow = ({ label, value, colorClass }) => (
  <div className="flex justify-between items-center text-sm py-1">
    <span className="text-white font-medium">{label}</span>
    <span className={`font-bold text-base ${colorClass || 'text-white'}`}>{value}</span>
  </div>
);

export default FleetPerformanceDashboard;
