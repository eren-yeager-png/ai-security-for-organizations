import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Shield,
  MessageSquare,
  FileText,
  Clock,
  Settings,
  ShieldAlert,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/app/chat', label: 'AI Assistant', icon: <MessageSquare className="w-4 h-4" /> },
    { to: '/app/documents', label: 'Knowledge Base', icon: <FileText className="w-4 h-4" /> },
    { to: '/app/activity', label: 'My Activity', icon: <Clock className="w-4 h-4" /> },
    { to: '/app/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 antialiased font-sans transition-colors duration-200">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/70 backdrop-blur-2xl transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20 border border-cyan-400/40">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                Secure AI
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-wider text-cyan-600 dark:text-cyan-400">Enterprise Core</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white lg:hidden p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Workspace</p>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all select-none ${
                  isActive
                    ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <span className={isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {/* Admin Control Center Link (Only visible to Admin) */}
          {user?.role === 'Admin' && (
            <div className="pt-5 mt-4 border-t border-slate-200 dark:border-slate-800/80">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2">Governance</p>
              <NavLink
                to="/admin/overview"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/25 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-all select-none"
              >
                <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Admin Control Center</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-transparent">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-700 dark:text-cyan-300 flex-shrink-0">
              {user?.name.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.department}</p>
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
        <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/60 backdrop-blur-xl px-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white lg:hidden p-1 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span>Zero-Trust Session Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer shadow-xs"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Profile Dropdown */}
            <Dropdown
              trigger={
                <div className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900/60 transition-all select-none">
                  <div className="text-right hidden md:block">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user?.name}</p>
                    <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">{user?.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                </div>
              }
              items={[
                {
                  id: 'profile_info',
                  label: (
                    <div className="py-0.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{user?.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{user?.email}</p>
                    </div>
                  ),
                },
                { id: 'div1', label: '', divider: true },
                {
                  id: 'settings',
                  label: 'Account Settings',
                  icon: <Settings className="w-4 h-4" />,
                  onClick: () => navigate('/app/settings'),
                },
                { id: 'div2', label: '', divider: true },
                {
                  id: 'logout',
                  label: 'Sign Out',
                  icon: <LogOut className="w-4 h-4" />,
                  danger: true,
                  onClick: handleLogout,
                },
              ]}
            />
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
