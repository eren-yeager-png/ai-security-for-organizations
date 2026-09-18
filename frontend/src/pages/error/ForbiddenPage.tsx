import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-center transition-colors duration-200">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white/85 dark:bg-slate-900/80 border border-rose-300 dark:border-rose-500/30 backdrop-blur-2xl shadow-xl dark:shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-700 dark:text-rose-400 mx-auto mb-5">
          <ShieldX className="w-8 h-8" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 bg-rose-500/15 px-2.5 py-1 rounded-full border border-rose-500/30">
          Access Restricted (403)
        </span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-4">Insufficient Clearance</h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Your current role (<span className="text-cyan-700 dark:text-cyan-400 font-semibold">{user?.role || 'Guest'}</span>) does not possess clearance for this administrative or confidential resource.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/app/chat')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Return to AI Assistant
          </Button>
        </div>
      </div>
    </div>
  );
};
