import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UserRole } from '../../api/types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success, error: notifyError } = useNotification();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@enterprise.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRoleLogin = async (role: UserRole) => {
    const testEmail = `${role.toLowerCase()}@enterprise.ai`;
    setEmail(testEmail);
    setPassword('password');
    setErrorMessage('');
    setIsLoading(true);

    try {
      await login({ email: testEmail, password: 'password' });
      success(`Logged in as ${role}`, `Session established with ${role} permissions.`);
      navigate(role === 'Admin' ? '/admin/overview' : '/app/chat');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setErrorMessage(msg);
      notifyError('Authentication Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both work email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      success('Authentication Successful', 'Welcome to Secure AI Assistant.');
      navigate('/app/chat');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      setErrorMessage(msg);
      notifyError('Authentication Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-200">
      {/* Background Cybernetic Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 items-center justify-center shadow-xl shadow-cyan-500/25 border border-cyan-400/40 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Secure AI Assistant
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
            Zero-Trust Enterprise Knowledge & AI Governance
          </p>
        </div>

        {/* Login Card */}
        <div className="p-7 rounded-3xl bg-white/85 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-2xl shadow-xl dark:shadow-2xl">
          {/* Demo account access and RBAC context share one compact surface. */}
          <div className="mb-6 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3.5 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950/45 dark:shadow-none">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 mt-0.5 text-cyan-700 dark:text-cyan-300 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-100">Role-based access control enforced</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Your permissions and workspace are loaded from your authenticated organization account.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3" aria-label="Demo account access">
              {([
                { role: 'Admin', detail: 'Control Center', style: 'border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-200 dark:hover:bg-purple-500/20' },
                { role: 'Manager', detail: 'Team workspace', style: 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20' },
                { role: 'Employee', detail: 'Knowledge base', style: 'border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20' },
              ] as const).map(({ role, detail, style }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleLogin(role)}
                  disabled={isLoading}
                  className={`min-w-0 rounded-xl border px-2 py-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50 ${style}`}
                >
                  <span className="block text-[11px] font-bold">{role}</span>
                  <span className="block mt-0.5 truncate text-[9px] font-medium opacity-75">{detail}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@enterprise.ai"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-cyan-500 focus:ring-cyan-400"
                />
                <span>Remember session</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-cyan-700 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 font-medium transition-colors"
              >
                Forgot credentials?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Organization
            </Button>
          </form>

          {/* Security Assurance Badges */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-4 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" /> AES-256 Encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" /> RBAC Enforced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
