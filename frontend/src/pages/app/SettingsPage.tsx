import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Shield, Sun, Moon, Laptop, Lock, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success } = useNotification();

  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    success('Settings Saved', 'Profile configuration updated.');
  };

  return (
    <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Platform Settings</h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Manage your organizational profile, theme preferences, and security credentials.
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Identity & Clearance</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Work Email (Managed)"
              value={user?.email || ''}
              disabled
              helperText="Managed by corporate directory"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide block mb-1.5">
                Current Role Clearance
              </label>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">{user?.role}</span>
                <Badge variant={user?.role === 'Admin' ? 'purple' : user?.role === 'Manager' ? 'blue' : 'cyan'} size="sm">
                  Active Clearance
                </Badge>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Theme Card */}
      <Card>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Sun className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Appearance & Visual Theme</span>
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 shadow-md shadow-cyan-500/10 font-bold'
                : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Moon className="w-5 h-5" />
            <span className="text-xs font-bold">Cyber Dark</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 shadow-md shadow-cyan-500/10 font-bold'
                : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span className="text-xs font-bold">Clean Light</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all cursor-pointer ${
              theme === 'system'
                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 shadow-md shadow-cyan-500/10 font-bold'
                : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Laptop className="w-5 h-5" />
            <span className="text-xs font-bold">System Default</span>
          </button>
        </div>
      </Card>

      {/* Security Status Card */}
      <Card>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Zero-Trust Security Parameters</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Hardware MFA Token</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">FIDO2 / WebAuthn security key bound to session</p>
            </div>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" /> Enforced
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">URL Credential Sanitizer</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Automatic scrubbing of sensitive query parameters and basic auth</p>
            </div>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" /> Active
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
