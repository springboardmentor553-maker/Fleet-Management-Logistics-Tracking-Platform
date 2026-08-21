import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
  BarChart3, Truck, Users, Package, Navigation,
  CheckCircle2, AlertCircle, AlertTriangle,
  Wrench, Activity, Search, RefreshCw, Calendar, Clock, Fuel, DollarSign, TrendingUp
} from 'lucide-react';

const PerformanceDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [activities, setActivities] = useState([]);
  const [fuel, setFuel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Search/Filters
  const [driverSearch, setDriverSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState('all');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState('all');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [analyticsRes, maintenanceRes, activitiesRes, fuelRecordsRes] = await Promise.all([
        api.get('/analytics'),
        api.get('/maintenance/summary'),
        api.get('/dashboard/activities'),
        api.get('/fuel-records').catch(() => ({ data: [] }))
      ]);
      setAnalytics(analyticsRes.data);
      
      setMaintenance({
        totalRecords: maintenanceRes.data.total_records || 0,
        completed: maintenanceRes.data.completed || 0,
        inProgress: maintenanceRes.data.in_progress || 0,
        overdue: maintenanceRes.data.overdue || 0,
        upcoming: maintenanceRes.data.due_soon || 0,
        totalCost: maintenanceRes.data.total_cost || 0
      });
      
      setActivities(activitiesRes.data);

      const fuelRecords = fuelRecordsRes.data || [];
      const totalFuel = fuelRecords.reduce((sum, r) => sum + (r.fuel_quantity || 0), 0);
      const totalCost = fuelRecords.reduce((sum, r) => sum + (r.fuel_cost || 0), 0);
      const averageCost = fuelRecords.length ? totalCost / fuelRecords.length : 0;
      const highestExpense = fuelRecords.length ? Math.max(...fuelRecords.map(r => r.fuel_cost || 0)) : 0;
      
      const vehicleSummaryMap = {};
      fuelRecords.forEach(r => {
        if (!vehicleSummaryMap[r.vehicle_license_plate]) {
          vehicleSummaryMap[r.vehicle_license_plate] = {
            vehicleId: r.vehicle_id,
            licensePlate: r.vehicle_license_plate,
            totalFuel: 0,
            totalCost: 0
          };
        }
        vehicleSummaryMap[r.vehicle_license_plate].totalFuel += (r.fuel_quantity || 0);
        vehicleSummaryMap[r.vehicle_license_plate].totalCost += (r.fuel_cost || 0);
      });

      setFuel({
        totalFuel: totalFuel,
        totalCost: totalCost,
        averageCost: averageCost,
        highestExpense: highestExpense,
        vehicleSummary: Object.values(vehicleSummaryMap)
      });
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
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

  const handleManualRefresh = () => {
    fetchData(true);
  };

  if (loading && !analytics) {
    return (
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent mb-3"></div>
        <span>Loading Fleet Performance Dashboard...</span>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-12 text-center text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
        {error || 'No data available.'}
      </div>
    );
  }

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  const formatTime = (date) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(date);

  // Filter Data
  const filteredDrivers = (analytics.driverPerformance || []).filter(d =>
    (driverStatusFilter === 'all' || d.status === driverStatusFilter) &&
    d.driver.toLowerCase().includes(driverSearch.toLowerCase())
  );

  const filteredVehicles = (analytics.vehicleUtilization || []).filter(v =>
    (vehicleStatusFilter === 'all' || v.status === vehicleStatusFilter) &&
    (v.vehicleName.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.licensePlate.toLowerCase().includes(vehicleSearch.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Fleet Performance Dashboard</h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
            <Activity size={16} className="text-emerald-500" />
            Live Analytics Feed • Last updated: {formatTime(lastRefreshed)}
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${refreshing ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg'
            }`}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* --- TASK 2: KPI CARDS --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Vehicles */}
        <KpiCard title="Total Vehicles" value={analytics.fleet.totalVehicles} icon={<Truck size={18} />} color="sky" />
        <KpiCard title="Active Vehicles" value={analytics.fleet.activeVehicles} icon={<CheckCircle2 size={18} />} color="emerald" />
        <KpiCard title="Under Maintenance" value={analytics.fleet.vehiclesUnderMaintenance} icon={<Wrench size={18} />} color="amber" />
        <KpiCard title="Available Vehicles" value={analytics.fleet.totalVehicles - analytics.fleet.activeVehicles - analytics.fleet.vehiclesUnderMaintenance} icon={<CheckCircle2 size={18} />} color="emerald" />
        {/* Drivers */}
        <KpiCard title="Total Drivers" value={analytics.drivers.totalDrivers} icon={<Users size={18} />} color="indigo" />
        <KpiCard title="Assigned Drivers" value={analytics.drivers.driversAssigned} icon={<Navigation size={18} />} color="sky" />
        <KpiCard title="Available Drivers" value={analytics.drivers.availableDrivers} icon={<CheckCircle2 size={18} />} color="emerald" />
        <KpiCard title="Drivers On Leave" value={analytics.drivers.driversOnLeave} icon={<Calendar size={18} />} color="amber" />
        <KpiCard title="Present Today" value={analytics.drivers.driversPresent} icon={<Activity size={18} />} color="emerald" />
        <KpiCard title="Absent Today" value={analytics.drivers.driversAbsent} icon={<AlertCircle size={18} />} color="rose" />
        {/* Shipments */}
        <KpiCard title="Total Shipments" value={analytics.shipments.totalShipments} icon={<Package size={18} />} color="purple" />
        <KpiCard title="Active Deliveries" value={analytics.shipments.assignedShipments + analytics.shipments.inTransitShipments} icon={<Navigation size={18} />} color="sky" />
        <KpiCard title="Delivered" value={analytics.shipments.deliveredShipments} icon={<CheckCircle2 size={18} />} color="emerald" />
        <KpiCard title="Delayed Shipments" value={analytics.shipments.delayedShipments} icon={<AlertCircle size={18} />} color="rose" />
        {/* Trips */}
        <KpiCard title="Total Trips" value={analytics.trips.totalTrips} icon={<Navigation size={18} />} color="sky" />
        {/* Fuel */}
        {fuel && (
          <>
            <KpiCard title="Total Fuel Used" value={`${(fuel.totalFuel || 0).toLocaleString()} L`} icon={<Fuel size={18} />} color="sky" />
            <KpiCard title="Total Fuel Cost" value={formatCurrency(fuel.totalCost || 0)} icon={<DollarSign size={18} />} color="rose" />
            <KpiCard title="Average Fuel Cost" value={formatCurrency(fuel.averageCost || 0)} icon={<Activity size={18} />} color="emerald" />
            <KpiCard title="Highest Expense" value={formatCurrency(fuel.highestExpense || 0)} icon={<TrendingUp size={18} />} color="amber" />
          </>
        )}
      </div>

      {fuel && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h2 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
              <Activity className="text-sky-400" /> Fuel Usage by Vehicle (Liters)
            </h2>
            <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {(fuel.vehicleSummary || []).map(v => (
                <div key={v.vehicleId} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300 font-medium">{v.licensePlate}</span>
                    <span className="text-sky-400 font-bold">{(v.totalFuel || 0).toLocaleString()} L</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5">
                    <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${((v.totalFuel || 0) / Math.max(...(fuel.vehicleSummary || []).map(x => x.totalFuel || 0), 1)) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h2 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
              <DollarSign className="text-rose-400" /> Fuel Cost by Vehicle
            </h2>
            <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {(fuel.vehicleSummary || []).map(v => (
                <div key={v.vehicleId} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300 font-medium">{v.licensePlate}</span>
                    <span className="text-rose-400 font-bold">{formatCurrency(v.totalCost || 0)}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5">
                    <div className="bg-rose-500 h-2.5 rounded-full" style={{ width: `${((v.totalCost || 0) / Math.max(...(fuel.vehicleSummary || []).map(x => x.totalCost || 0), 1)) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* --- TASK 3: SHIPMENT ANALYTICS --- */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
            <Package className="text-purple-400" /> Shipment Overview
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-medium">Pending</span><span className="font-bold text-slate-300">{analytics.shipments.pendingShipments}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-medium">Assigned</span><span className="font-bold text-sky-400">{analytics.shipments.assignedShipments}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-medium">In Transit</span><span className="font-bold text-indigo-400">{analytics.shipments.inTransitShipments}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-medium">Delivered</span><span className="font-bold text-emerald-400">{analytics.shipments.deliveredShipments}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-medium">Cancelled</span><span className="font-bold text-rose-400">{analytics.shipments.cancelledShipments}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-medium">Delayed</span><span className="font-bold text-amber-400">{analytics.shipments.delayedShipments}</span></div>
            <div className="pt-4 mt-2 border-t border-slate-800/60 flex justify-between items-center">
              <span className="text-slate-300 font-bold">Success Rate</span>
              <span className="font-black text-emerald-400 text-lg">{analytics.deliveryPerformance.successRate}%</span>
            </div>
          </div>
        </div>

        {/* --- TASK 6: MAINTENANCE SUMMARY --- */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
            <Wrench className="text-amber-400" /> Maintenance Summary
          </h2>
          {maintenance ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-medium">Total Records</span><span className="font-bold text-slate-300">{maintenance.totalRecords}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-medium">Vehicles Under Maintenance</span><span className="font-bold text-amber-400">{analytics.fleet.vehiclesUnderMaintenance}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-medium">Overdue Services</span><span className="font-bold text-rose-400">{maintenance.overdue}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-medium">Upcoming Services</span><span className="font-bold text-sky-400">{maintenance.upcoming}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-medium">Completed Services</span><span className="font-bold text-emerald-400">{maintenance.completed}</span></div>
              <div className="pt-4 mt-2 border-t border-slate-800/60 flex justify-between items-center">
                <span className="text-slate-300 font-bold">Total Cost</span>
                <span className="font-black text-rose-400 text-lg">{formatCurrency(maintenance.totalCost)}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 text-center py-8">Maintenance data unavailable</div>
          )}
        </div>

        {/* --- TASK 7: RECENT ACTIVITIES --- */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col h-[320px]">
          <h2 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
            <Clock className="text-sky-400" /> Recent Activities
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {(activities || []).length > 0 ? (activities || []).map((act, i) => (
              <div key={`${act.id}-${i}`} className="flex gap-3">
                <div className="mt-1">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${act.type.includes('Vehicle') ? 'bg-emerald-400' :
                      act.type.includes('Driver') ? 'bg-indigo-400' :
                        act.type.includes('Shipment') ? 'bg-purple-400' :
                          act.type.includes('Trip') ? 'bg-sky-400' : 'bg-amber-400'
                    }`}></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">{act.type}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{act.description}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{new Date(act.timestamp).toLocaleString()}</p>
                </div>
              </div>
            )) : (
              <div className="text-sm text-slate-500 text-center py-8">No recent activities</div>
            )}
          </div>
        </div>
      </div>

      {/* --- TASK 4: DRIVER PERFORMANCE (Data Grid) --- */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <Users className="text-indigo-400" /> Driver Performance
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input type="text" placeholder="Search drivers..." value={driverSearch} onChange={e => setDriverSearch(e.target.value)} className="bg-[#0a0f24] border border-slate-700 text-white text-sm rounded-lg pl-9 pr-4 py-2 w-full focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            <select 
              value={driverStatusFilter}
              onChange={e => setDriverStatusFilter(e.target.value)}
              className="bg-[#0a0f24] border border-slate-700 text-white text-sm rounded-lg px-4 py-2 w-full sm:w-auto focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="on_trip">On Trip</option>
              <option value="off_duty">Off Duty</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#0a0f24] z-10">
              <tr className="text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <th className="px-6 py-4">Driver Name</th>
                <th className="px-6 py-4">Current Status</th>
                <th className="px-6 py-4">Completed Trips</th>
                <th className="px-6 py-4">Active Trips</th>
                <th className="px-6 py-4">Assigned Vehicle</th>
                <th className="px-6 py-4">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(filteredDrivers || []).map((d, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-white">{d.driver}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                      d.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      d.status === 'on_trip' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {d.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-emerald-400 font-bold">{d.completedTrips}</td>
                  <td className="px-6 py-4 text-sm text-sky-400 font-bold">{d.activeTrips}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{d.assignedVehicle || 'Unassigned'}</td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                    {d.lastUpdated ? new Date(d.lastUpdated).toLocaleString() : 'N/A'}
                  </td>
                </tr>
              ))}
              {(filteredDrivers || []).length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-slate-500 text-sm">No driver records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

  {/* --- TASK 5: VEHICLE UTILIZATION (Data Grid) --- */ }
  <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <Truck className="text-sky-400" /> Vehicle Utilization
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input type="text" placeholder="Search vehicles..." value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)} className="bg-[#0a0f24] border border-slate-700 text-white text-sm rounded-lg pl-9 pr-4 py-2 w-full focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            <select value={vehicleStatusFilter} onChange={e => setVehicleStatusFilter(e.target.value)} className="bg-[#0a0f24] border border-slate-700 text-white text-sm rounded-lg px-4 py-2 w-full sm:w-auto focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#0a0f24] z-10">
              <tr className="text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">License Plate</th>
                <th className="px-6 py-4">Current Status</th>
                <th className="px-6 py-4">Total Trips</th>
                <th className="px-6 py-4">Maintenance Count</th>
                <th className="px-6 py-4">Capacity</th>
                <th className="px-6 py-4">Current Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(filteredVehicles || []).map((v, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-white">{v.vehicleName}</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-400 bg-slate-900/50 px-3 py-1 rounded inline-block mt-2">{v.licensePlate}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                      v.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      v.status === 'maintenance' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-sky-400 font-bold">{v.totalTrips}</td>
                  <td className="px-6 py-4 text-sm text-amber-400 font-bold">{v.maintenanceCount}</td>
                  <td className="px-6 py-4 text-xs text-slate-300 font-mono">{v.capacity || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{v.currentAssignment || 'Unassigned'}</td>
                </tr>
              ))}
              {(filteredVehicles || []).length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-slate-500 text-sm">No vehicle records found</td>
                </tr>
              )}
            </tbody>
          </table>
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
    indigo: 'bg-indigo-500/10 text-indigo-400',
    purple: 'bg-purple-500/10 text-purple-400',
    rose: 'bg-rose-500/10 text-rose-400',
  };
  const valColorMap = {
    sky: 'text-sky-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    indigo: 'text-indigo-400',
    purple: 'text-purple-400',
    rose: 'text-rose-400',
  };

  return (
    <div className="glass-panel p-4 rounded-xl flex items-center gap-4 border border-slate-800/80 shadow-md">
      <div className={`p-3 rounded-lg flex-shrink-0 ${colorMap[color] || colorMap.sky}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{title}</p>
        <h3 className={`text-xl font-black mt-0.5 ${valColorMap[color] || 'text-white'}`}>{value}</h3>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
