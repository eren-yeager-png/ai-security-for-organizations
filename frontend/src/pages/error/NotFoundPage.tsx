import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-center transition-colors duration-200">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white/85 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-2xl shadow-xl dark:shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-700 dark:text-cyan-400 mx-auto mb-5">
          <FileQuestion className="w-8 h-8" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 bg-cyan-500/15 px-2.5 py-1 rounded-full border border-cyan-500/30">
          Page Not Found (404)
        </span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-4">Resource Non-Existent</h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          The requested path could not be located in this enterprise tenant.
        </p>

        <div className="mt-6">
          <Button
            variant="primary"
            onClick={() => navigate('/app/chat')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
