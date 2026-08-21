import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { 
  Server, Activity, Clock, Play, AlertCircle, CheckCircle2, Terminal, RefreshCw, XCircle, Settings, History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SystemMonitoring = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const [triggering, setTriggering] = useState({});

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        api.get('/background/status'),
        api.get('/background/history').catch(() => ({ data: { history: [] } }))
      ]);
      setStatus(statusRes.data || null);
      setHistory(historyRes.data?.history || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch system monitoring data:', err);
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleTrigger = async (endpoint, taskName) => {
    try {
      setTriggering(prev => ({ ...prev, [taskName]: true }));
      await api.post(`/background/trigger/${endpoint}`);
      alert(`Task ${taskName} triggered successfully!`);
      fetchData(true);
    } catch (err) {
      console.error(`Failed to trigger ${taskName}:`, err);
      alert(`Failed to trigger ${taskName}.`);
    } finally {
      setTriggering(prev => ({ ...prev, [taskName]: false }));
    }
  };

  if (loading && !status && !error) {
    return (
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mb-3"></div>
        <span>Loading System Status...</span>
      </div>
    );
  }

  const celeryStatus = status?.celery === 'running' ? 'Running' : 'Stopped';
  const redisStatus = status?.redis === 'connected' ? 'Connected' : 'Disconnected';
  
  const isCeleryRunning = celeryStatus === 'Running';
  const isRedisConnected = redisStatus === 'Connected';

  const tasksMeta = [
    { id: 'maintenance_reminder', name: 'Maintenance Reminder', interval: 'Daily @ 08:00', endpoint: 'maintenance' },
    { id: 'eta_refresh', name: 'ETA Refresh', interval: 'Every 5 Mins', endpoint: 'eta' },
    { id: 'shipment_monitor', name: 'Shipment Monitor', interval: 'Every 2 Mins', endpoint: 'shipment' },
    { id: 'fuel_analytics', name: 'Fuel Analytics', interval: 'Daily @ 00:00', endpoint: 'fuel' },
    { id: 'fleet_dashboard_refresh', name: 'Dashboard Refresh', interval: 'Every 1 Min', endpoint: 'dashboard' }
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Settings className="text-indigo-400" size={32} />
            System Monitoring
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
            <Terminal size={16} className="text-emerald-500" />
            Live view of background workers, task queues, and health
          </p>
        </div>
        <button 
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 bg-[#0a0f24] hover:bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2 rounded-xl transition-all"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin text-indigo-400' : ''} /> 
          {refreshing ? 'Refreshing...' : 'Live Refresh'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Infrastructure Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`glass-panel p-6 rounded-2xl border ${isCeleryRunning ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-rose-500/30'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isCeleryRunning ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                <Activity size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Celery Worker Status</h3>
                <p className="text-slate-400 text-sm">Background Task Execution Engine</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isCeleryRunning ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {isCeleryRunning ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {celeryStatus}
            </div>
          </div>
        </div>

        <div className={`glass-panel p-6 rounded-2xl border ${isRedisConnected ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-rose-500/30'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isRedisConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                <Server size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Redis Broker Status</h3>
                <p className="text-slate-400 text-sm">Message Queue & Task Result Backend</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isRedisConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {isRedisConnected ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {redisStatus}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Scheduled Tasks Grid */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="text-indigo-400" /> Scheduled Tasks Health
          </h2>
          <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {(tasksMeta || []).map(task => {
              const taskHealth = (status?.task_health || []).find(t => t.name === task.id);
              const isConfigured = !!taskHealth;
              const isSuccess = taskHealth?.status === "SUCCESS";
              const isFailed = taskHealth?.status === "FAILED";

              return (
                <div key={task.id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-white font-bold">{task.name}</h3>
                      <p className="text-slate-400 text-xs mt-1">{task.interval}</p>
                    </div>
                    {isSuccess && <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-1 rounded-full uppercase font-bold">Passing</span>}
                    {isFailed && <span className="bg-rose-500/10 text-rose-400 text-[10px] px-2 py-1 rounded-full uppercase font-bold">Failing</span>}
                    {!isSuccess && !isFailed && <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-1 rounded-full uppercase font-bold">Pending</span>}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 border-t border-slate-800 pt-3">
                    <div className="text-xs text-slate-500">
                      Last Run: {taskHealth?.last_execution ? new Date(taskHealth.last_execution).toLocaleString() : 'Never'}
                    </div>
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleTrigger(task.endpoint, task.name)}
                        disabled={triggering[task.name]}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-indigo-900/20 disabled:opacity-50"
                      >
                        {triggering[task.name] ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                        Run
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Execution History */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <History className="text-sky-400" /> Recent Execution Logs
          </h2>
          <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[500px] pr-2">
            {history.length > 0 ? (
              <div className="space-y-3">
                {(history || []).map((log, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/60 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs text-sky-400 font-bold">{log.task_name}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span>{log.last_execution ? new Date(log.last_execution).toLocaleString() : 'N/A'}</span>
                      <span>{log.execution_time_seconds || 0}s</span>
                    </div>
                    {log.error && (
                      <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded mt-1 border border-rose-500/20">
                        {log.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-slate-500">No recent execution logs found in cache.</div>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default SystemMonitoring;
