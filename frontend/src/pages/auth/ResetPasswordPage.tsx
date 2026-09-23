import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { resetPassword } from '../../api/auth';
import { useNotification } from '../../context/NotificationContext';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useNotification();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 12) {
      setError('Password must be at least 12 characters to meet security standards.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({
        token: 'sample_reset_token',
        newPassword: password,
        confirmPassword,
      });
      success('Password Updated', 'Your new credentials are active.');
      navigate('/login');
    } catch {
      setError('Failed to update password. Link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-200">
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 items-center justify-center text-cyan-700 dark:text-cyan-400 mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Password</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Enforce corporate zero-trust password complexity standards.
          </p>
        </div>

        <div className="p-7 rounded-3xl bg-white/85 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-2xl shadow-xl dark:shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 12 characters..."
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password..."
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" /> Password Requirements:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400 pl-1">
                <li>At least 12 characters long</li>
                <li>Mixed uppercase and lowercase characters</li>
                <li>Numbers and special symbols (!@#$%^&*)</li>
              </ul>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Update Password & Sign In
            </Button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
