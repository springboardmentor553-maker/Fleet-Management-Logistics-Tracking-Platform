import React, { useState } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, X, LogOut, LayoutDashboard, Truck, Users, 
  Package, MapPin, Wrench, Shield, ClipboardList, Activity, BarChart3, Fuel, Terminal, Navigation, Calendar, FileText, TrendingUp
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => {
    if (path === '' || path === '/') {
      return location.pathname === '/' || (user && location.pathname === `/${user.role}`);
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };


  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define sidebar navigation items based on roles
  const getNavItems = () => {
    const common = [
      { name: 'Dashboard', path: '', icon: <LayoutDashboard size={20} /> },
    ];

    if (!user) return common;

    switch (user.role) {
      case 'admin':
        return [
          ...common,
          { name: 'Performance Dashboard', path: '/performance', icon: <BarChart3 size={20} /> },
          { name: 'Operational Analytics', path: '/analytics-dashboard', icon: <Activity size={20} /> },
          { name: 'Fleet Performance', path: '/fleet-performance', icon: <TrendingUp size={20} /> },
          { name: 'Fuel Monitoring', path: '/fuel-records', icon: <Fuel size={20} /> },
          { name: 'System Monitoring', path: '/system-monitoring', icon: <Terminal size={20} /> },
          { name: 'Register User', path: '/register', icon: <Users size={20} /> },
          { name: 'Driver Monitoring', path: '/drivers/monitor', icon: <Activity size={20} /> },
          { name: 'Driver Assignments', path: '/driver-assignments', icon: <Navigation size={20} /> },
          { name: 'Attendance', path: '/attendance', icon: <Calendar size={20} /> },
          { name: 'Shipments', path: '/shipments', icon: <Package size={20} /> },
          { name: 'Trips & Routes', path: '/trips', icon: <MapPin size={20} /> },
          { name: 'Fleet Workspace', path: '/manager', icon: <Truck size={20} /> },
          { name: 'Maintenance', path: '/maintenance', icon: <Wrench size={20} /> },
          { name: 'Maintenance Reports', path: '/maintenance-reports', icon: <FileText size={20} /> },
        ];
      case 'manager':
        return [
          ...common,
          { name: 'Performance Dashboard', path: '/performance', icon: <BarChart3 size={20} /> },
          { name: 'Operational Analytics', path: '/analytics-dashboard', icon: <Activity size={20} /> },
          { name: 'Fleet Performance', path: '/fleet-performance', icon: <TrendingUp size={20} /> },
          { name: 'Fuel Monitoring', path: '/fuel-records', icon: <Fuel size={20} /> },
          { name: 'System Monitoring', path: '/system-monitoring', icon: <Terminal size={20} /> },
          { name: 'Driver Monitoring', path: '/drivers/monitor', icon: <Activity size={20} /> },
          { name: 'Driver Assignments', path: '/driver-assignments', icon: <Navigation size={20} /> },
          { name: 'Attendance', path: '/attendance', icon: <Calendar size={20} /> },
          { name: 'Shipments', path: '/shipments', icon: <Package size={20} /> },
          { name: 'Trips & Routes', path: '/trips', icon: <MapPin size={20} /> },
          { name: 'Fleet Workspace', path: '/manager', icon: <Truck size={20} /> },
          { name: 'Maintenance', path: '/maintenance', icon: <Wrench size={20} /> },
          { name: 'Maintenance Reports', path: '/maintenance-reports', icon: <FileText size={20} /> },
        ];
      case 'dispatcher':
        return [
          ...common,
          { name: 'Operational Analytics', path: '/analytics-dashboard', icon: <Activity size={20} /> },
          { name: 'Fleet Performance', path: '/fleet-performance', icon: <TrendingUp size={20} /> },
          { name: 'Driver Assignments', path: '/driver-assignments', icon: <Navigation size={20} /> },
          { name: 'Attendance', path: '/attendance', icon: <Calendar size={20} /> },
          { name: 'Shipments', path: '/shipments', icon: <Package size={20} /> },
          { name: 'Trips & Routes', path: '/trips', icon: <MapPin size={20} /> },
          { name: 'Fuel Monitoring', path: '/fuel-records', icon: <Fuel size={20} /> },
          { name: 'Maintenance Reports', path: '/maintenance-reports', icon: <FileText size={20} /> },
        ];
      case 'driver':
        return [
          ...common,
          { name: 'My Trips', path: '/driver', icon: <ClipboardList size={20} /> },
          { name: 'My Assignments', path: '/driver-assignments', icon: <Navigation size={20} /> },
          { name: 'My Attendance', path: '/attendance', icon: <Calendar size={20} /> },
        ];
      default:
        return common;
    }
  };

  const navItems = getNavItems();
  
  // Format role label for display
  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      manager: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      dispatcher: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      driver: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    };
    return (
      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${styles[role] || 'bg-slate-500/10 text-slate-400'}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#070b19] flex">
      {/* --- Sidebar Desktop --- */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-[#0c1228] shrink-0">
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-800">
          <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-extrabold text-lg text-white font-outfit tracking-wide">FleetFlow</span>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm ${
                isActive(item.path) 
                  ? 'bg-sky-500/10 text-sky-400 font-semibold' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User Card footer */}
        {user && (
          <div className="p-4 border-t border-slate-800 bg-[#0a0f21]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center font-bold text-white uppercase text-sm">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                <div className="mt-0.5">{getRoleBadge(user.role)}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-slate-300 font-medium rounded-xl border border-slate-700/50 transition-all text-xs"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* --- Mobile Sidebar Drawer --- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}></div>
          <aside className="relative flex flex-col w-64 max-w-xs bg-[#0c1228] h-full border-r border-slate-800 animate-slideRight">
            <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
              <span className="font-extrabold text-lg text-white font-outfit">FleetFlow</span>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1">
              {navItems.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm ${
                    isActive(item.path) 
                      ? 'bg-sky-500/10 text-sky-400 font-semibold' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>
            {user && (
              <div className="p-4 border-t border-slate-800 bg-[#0a0f21]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center font-bold text-white uppercase text-sm">
                    {user.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                    <div className="mt-0.5">{getRoleBadge(user.role)}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-slate-300 font-medium rounded-xl border border-slate-700/50 transition-all text-xs"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* --- Main Area --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-[#0c1228]/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-bold text-white font-outfit uppercase tracking-wider hidden sm:block">
              {user ? `${user.role} workspace` : 'FleetFlow Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-slate-300 text-sm hidden sm:inline-block">Welcome, <span className="font-semibold text-white">{user.full_name}</span></span>
                {getRoleBadge(user.role)}
              </div>
            )}
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto bg-[#070b19] p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
