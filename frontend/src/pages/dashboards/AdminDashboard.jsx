import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { Users, UserCheck, ShieldAlert, BarChart3, Plus, ShieldCheck, Mail, Calendar, AlertTriangle } from 'lucide-react';
import { getMaintenanceAlerts } from '../../api/maintenance';
import AnalyticsPanel from '../../components/AnalyticsPanel';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsersAndAlerts = async () => {
      try {
        const [usersRes, alertsRes] = await Promise.all([
          api.get('/auth/users'),
          getMaintenanceAlerts()
        ]);
        setUsers(usersRes.data);
        setMaintenanceAlerts(alertsRes);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Unable to connect to the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsersAndAlerts();
  }, []);

  // Compute metrics
  const totalUsers = users.length;
  const countRole = (role) => users.filter(u => u.role === role).length;
  const activeCount = users.filter(u => u.is_active).length;

  const urgentAlertsCount = maintenanceAlerts.filter(a => ['OVERDUE', 'DUE_SOON', 'IN_PROGRESS'].includes(a.alert_type)).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Maintenance Alerts Banner */}
      {urgentAlertsCount > 0 && (
        <a href="/maintenance" className="block bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between hover:bg-yellow-500/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-yellow-400 font-bold text-sm uppercase tracking-wider">Maintenance Attention Required</h3>
              <p className="text-yellow-500/80 text-xs mt-0.5">⚠ {urgentAlertsCount} vehicles require maintenance attention. Click to view details.</p>
            </div>
          </div>
        </a>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">System Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Global administrative console and user governance</p>
        </div>
        <Link
          to="/register"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-600/10 hover:shadow-sky-600/25 text-sm"
        >
          <Plus size={18} />
          Register Operator
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Operators</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{loading ? '...' : totalUsers}</h3>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <Users size={24} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Staff</p>
            <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{loading ? '...' : activeCount}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Managers & Dispatchers</p>
            <h3 className="text-3xl font-extrabold text-amber-400 mt-1">
              {loading ? '...' : countRole('manager') + countRole('dispatcher')}
            </h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Drivers</p>
            <h3 className="text-3xl font-extrabold text-indigo-400 mt-1">{loading ? '...' : countRole('driver')}</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <BarChart3 size={24} />
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-white text-lg">User Governance List</h2>
          <span className="text-xs text-slate-400 font-medium">Showing {totalUsers} registers</span>
        </div>

        {error && (
          <div className="m-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <ShieldAlert size={20} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent mb-3"></div>
            <span>Fetching user registries...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No users found. Register a new user to populate this list.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <th className="px-6 py-4">Name / Email</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Registered On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-sky-400">
                          {item.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{item.full_name || 'N/A'}</p>
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-0.5">
                            <Mail size={12} />
                            <span>{item.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border tracking-wide ${
                        item.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        item.role === 'manager' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        item.role === 'dispatcher' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-sky-500/10 text-sky-400 border-sky-500/20'
                      }`}>
                        {item.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${item.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
                        {item.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Calendar size={13} />
                        <span>{new Date(item.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fleet Performance Analytics */}
      <AnalyticsPanel />
    </div>
  );
};

export default AdminDashboard;
