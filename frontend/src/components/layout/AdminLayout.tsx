import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  ShieldAlert,
  LayoutDashboard,
  Files,
  Users,
  KeyRound,
  ShieldCheck,
  ClipboardList,
  UserCheck,
  Cpu,
  AlertTriangle,
  Database,
  BarChart3,
  Sliders,
  ArrowLeft,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Radio,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const adminNavSections = [
    {
      title: 'Command & Knowledge',
      items: [
        { to: '/admin/overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
        { to: '/admin/documents', label: 'Document Governance', icon: <Files className="w-4 h-4" /> },
        { to: '/admin/analytics', label: 'Analytics & Insights', icon: <BarChart3 className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Identity & Access',
      items: [
        { to: '/admin/users', label: 'User Directory', icon: <Users className="w-4 h-4" /> },
        { to: '/admin/roles', label: 'Roles & Permissions', icon: <KeyRound className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Security & Observability',
      items: [
        { to: '/admin/security', label: 'Security Dashboard', icon: <ShieldCheck className="w-4 h-4" /> },
        { to: '/admin/security-alerts', label: 'Security Alerts', icon: <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />, badge: '3' },
        { to: '/admin/audit-logs', label: 'Audit Logs', icon: <ClipboardList className="w-4 h-4" /> },
        { to: '/admin/login-activity', label: 'Login Activity', icon: <UserCheck className="w-4 h-4" /> },
        { to: '/admin/api-activity', label: 'API Telemetry', icon: <Cpu className="w-4 h-4" /> },
        { to: '/admin/data-access', label: 'Data Access History', icon: <Database className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Platform System',
      items: [
        { to: '/admin/settings', label: 'System Settings', icon: <Sliders className="w-4 h-4" /> },
      ],
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100/80 dark:bg-[#040810] text-slate-900 dark:text-slate-100 antialiased font-sans transition-colors duration-200">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-72 border-r border-slate-200/90 dark:border-cyan-950/40 bg-white/90 dark:bg-[#070d18]/90 backdrop-blur-2xl shadow-[8px_0_30px_rgba(15,23,42,0.04)] dark:shadow-none transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200 dark:border-cyan-950/50 bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-600/20 border border-purple-300 dark:border-purple-500/40 flex items-center justify-center shadow-xs dark:shadow-lg dark:shadow-purple-500/20">
              <ShieldAlert className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Control Center
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Security & Governance</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white lg:hidden p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Return to Assistant Button */}
        <div className="p-3 border-b border-slate-200 dark:border-cyan-950/40">
          <button
            onClick={() => navigate('/app/chat')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-50 dark:bg-slate-900/90 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 hover:bg-cyan-100 dark:hover:bg-cyan-500/15 transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Launch AI Assistant</span>
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {adminNavSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {section.title}
              </p>
              {section.items.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all select-none ${
                      isActive
                        ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-500/30 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* System Telemetry Pill */}
        <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-100/90 dark:bg-slate-950/80 border border-slate-200 dark:border-cyan-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Cluster Status</span>
          </div>
          <Badge variant="emerald" size="sm">
            Nominal
          </Badge>
        </div>

        {/* Admin User Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-cyan-950/50 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-600/40 flex items-center justify-center font-bold text-xs text-purple-700 dark:text-purple-300 flex-shrink-0">
              {user?.name.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold tracking-wider">SUPER ADMIN</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200/90 dark:border-cyan-950/50 bg-white/75 dark:bg-[#060b16]/80 backdrop-blur-xl px-6 flex items-center justify-between flex-shrink-0 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white lg:hidden p-1 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">ZONE: ENTERPRISE-SEC-01</span>
              <span className="text-slate-400 dark:text-slate-600">•</span>
              <span className="hidden sm:inline">Role Governance Active</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer shadow-xs"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
            <Badge variant="purple" size="md">
              ADMIN CLEARANCE
            </Badge>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="admin-content flex-1 overflow-y-auto p-6 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
