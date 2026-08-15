import React, { useState, useEffect } from 'react';
import {
  Wrench, AlertTriangle, CheckCircle2, AlertCircle, Calendar, DollarSign,
  Search, Filter, Clock, Truck
} from 'lucide-react';
import api from '../api/axios';
import { getMaintenanceReportDetails, getMaintenanceSummary, getMaintenanceRecords, getVehicleMaintenanceHistory } from '../api/maintenance';

const MaintenanceReports = () => {
  const [report, setReport] = useState(null);
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [alertSearch, setAlertSearch] = useState('');
  const [alertFilter, setAlertFilter] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [reportRes, summaryRes, recordsRes, vehiclesRes] = await Promise.all([
        getMaintenanceReportDetails().catch(() => ({})),
        getMaintenanceSummary().catch(() => ({})),
        getMaintenanceRecords().catch(() => []),
        api.get('/vehicles')
      ]);
      const mergedReport = {
        ...(reportRes || {}),
        ...(summaryRes || {}),
        overdue: summaryRes?.overdue ?? reportRes?.overdue ?? 0
      };
      setReport(mergedReport);
      setRecords(recordsRes || []);
      setVehicles(vehiclesRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedVehicle) {
      fetchHistory(selectedVehicle);
    } else {
      setHistory([]);
    }
  }, [selectedVehicle]);

  const fetchHistory = async (vid) => {
    setLoadingHistory(true);
    try {
      const res = await getVehicleMaintenanceHistory(vid);
      setHistory(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getAlertStatusInfo = (a) => {
    const maintStatus = (a.maintenance_status || '').toLowerCase();
    const notes = (a.notes || '').toLowerCase();
    const alertType = (a.alert_type || '').toUpperCase();

    let diffDays = null;
    if (a.next_service_date) {
      const nextDate = new Date(a.next_service_date);
      const now = new Date();
      diffDays = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24));
    }

    if (alertType === 'OVERDUE' || notes.includes('overdue') || (diffDays !== null && diffDays < 0) || maintStatus === 'overdue') {
      return {
        key: 'OVERDUE',
        label: 'Overdue',
        className: 'bg-red-500/10 text-red-400 border border-red-500/20'
      };
    }
    if (alertType === 'DUE_SOON' || (diffDays !== null && diffDays >= 0 && diffDays <= 7) || maintStatus === 'due_soon') {
      return {
        key: 'DUE_SOON',
        label: 'Due Soon',
        className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
      };
    }
    if (alertType === 'IN_PROGRESS' || maintStatus === 'in_progress' || maintStatus === 'in progress') {
      return {
        key: 'IN_PROGRESS',
        label: 'In Progress',
        className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
      };
    }
    return {
      key: 'SCHEDULED',
      label: a.alert || a.category || 'Scheduled',
      className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
    };
  };

  const activeAlerts = (records || [])
    .filter(r => r.maintenance_status !== 'completed' && r.maintenance_status !== 'cancelled')
    .map(r => {
      const v = (vehicles || []).find(veh => veh.id === r.vehicle_id);
      const vehName = v ? `${v.make} ${v.model}` : `Vehicle #${r.vehicle_id}`;
      return {
        id: r.id,
        maintenance_id: r.id,
        vehicle_id: r.vehicle_id,
        vehicle: vehName,
        license_plate: v ? v.license_plate : '',
        category: r.maintenance_category,
        next_service_date: r.next_service_date,
        service_date: r.service_date,
        maintenance_status: r.maintenance_status,
        notes: r.notes,
        alert: r.notes || r.maintenance_category
      };
    });

  // Filter alerts based on search and filter type
  const filteredAlerts = activeAlerts.filter(a => {
    const matchesSearch =
      (a.vehicle || '').toLowerCase().includes(alertSearch.toLowerCase()) ||
      (a.license_plate || '').toLowerCase().includes(alertSearch.toLowerCase()) ||
      (a.category || '').toLowerCase().includes(alertSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (alertFilter === 'ALL') return true;

    const statusInfo = getAlertStatusInfo(a);
    return statusInfo.key === alertFilter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-md">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-400" />
          Maintenance Reports & Alerts
        </h1>
        <p className="text-slate-400 mt-1">Detailed statistics, active alerts, and vehicle histories</p>
      </div>

      {/* --- Task 5: Dashboard Cards (Summary) --- */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-panel rounded-xl border border-slate-800 p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Records</p>
            <h3 className="text-2xl font-bold text-white mt-1">{report.total_records}</h3>
          </div>
          <div className="glass-panel rounded-xl border border-slate-800 p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Scheduled</p>
            <h3 className="text-2xl font-bold text-yellow-400 mt-1">{report.scheduled}</h3>
          </div>
          <div className="glass-panel rounded-xl border border-slate-800 p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">In Progress</p>
            <h3 className="text-2xl font-bold text-blue-400 mt-1">{report.in_progress}</h3>
          </div>
          <div className="glass-panel rounded-xl border border-slate-800 p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-bold text-green-400 mt-1">{report.completed}</h3>
          </div>
          <div className="glass-panel rounded-xl border border-slate-800 p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overdue</p>
            <h3 className="text-2xl font-bold text-red-400 mt-1">{report.overdue}</h3>
          </div>
          <div className="glass-panel rounded-xl border border-slate-800 p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Cost</p>
            <h3 className="text-2xl font-bold text-indigo-400 mt-1">${(report.total_cost || 0).toFixed(2)}</h3>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* --- Task 3 & 6: Alerts Table with Search & Filters --- */}
        <div className="glass-panel rounded-xl border border-slate-800 flex flex-col min-h-[400px]">
          <div className="px-6 py-5 border-b border-slate-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Active Maintenance Alerts
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={alertSearch}
                  onChange={(e) => setAlertSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full md:w-48 bg-[#0a0f24] text-slate-200"
                />
              </div>
              <div className="relative">
                <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={alertFilter}
                  onChange={(e) => setAlertFilter(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 glass-panel cursor-pointer appearance-none text-white"
                >
                  <option value="ALL">All Alerts</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="DUE_SOON">Due Soon</option>
                  <option value="IN_PROGRESS">In Progress</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-slate-500">
                <CheckCircle2 className="w-12 h-12 text-slate-200 mb-2" />
                <p>No alerts found for the selected criteria.</p>
              </div>
            ) : (
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-900/40 border-b border-slate-800 sticky top-0 z-10">
                  <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-3">Vehicle</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Next Service</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(filteredAlerts || []).map((a, idx) => {
                    const statusInfo = getAlertStatusInfo(a);
                    return (
                      <tr key={idx} className="hover:bg-slate-900/40/50 transition-colors">
                        <td className="px-6 py-3">
                          <span className="font-semibold text-white">{a.vehicle}</span>
                          <span className="text-slate-500 text-xs ml-2 font-mono">{a.license_plate}</span>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-400">{a.category || 'N/A'}</td>
                        <td className="px-6 py-3 text-sm text-slate-400">
                          {a.next_service_date ? new Date(a.next_service_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* --- Task 4 & 6: Vehicle Maintenance History --- */}
        <div className="glass-panel rounded-xl border border-slate-800 flex flex-col min-h-[400px]">
          <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/40/50">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Vehicle History
            </h2>
            <div className="relative">
              <Truck className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="pl-9 pr-8 py-1.5 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm glass-panel cursor-pointer text-white"
              >
                <option value="" className="text-white">Select a vehicle</option>
                {(vehicles || []).map(v => (
                  <option key={v.id} value={v.id} className="text-white">{v.license_plate} - {v.make} {v.model}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 p-0 overflow-y-auto max-h-[500px]">
            {!selectedVehicle ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-slate-500">
                <Truck className="w-12 h-12 text-slate-200 mb-2" />
                <p>Select a vehicle to view its maintenance history.</p>
              </div>
            ) : loadingHistory ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-slate-500">
                <AlertCircle className="w-12 h-12 text-slate-200 mb-2" />
                <p>No maintenance history found for this vehicle.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {(history || []).map((record) => (
                  <div key={record.id} className="p-5 hover:bg-slate-900/40/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-white">{record.maintenance_category}</h4>
                        <p className="text-sm text-slate-400">{new Date(record.service_date).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${record.maintenance_status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          record.maintenance_status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            record.maintenance_status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-slate-800 text-slate-300'
                        }`}>
                        {record.maintenance_status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Provider</p>
                        <p className="text-slate-300 font-medium">{record.service_provider || 'Internal/Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Cost</p>
                        <p className="text-slate-300 font-medium">
                          {record.service_cost ? `$${record.service_cost.toFixed(2)}` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {record.notes && (
                      <div className="mt-3 bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                        <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-1">Notes</p>
                        <p className="text-sm text-slate-400 italic">"{record.notes}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceReports;
