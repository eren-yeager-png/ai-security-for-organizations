import React from 'react';
import { Shield, Lock, FileSearch, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';

export const EmptyState: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
      {/* Futuristic Shield Icon */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <Shield className="w-8 h-8 text-cyan-300" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-xl bg-blue-600 border border-blue-400 flex items-center justify-center text-white shadow-md">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="inline-flex items-center gap-2 mb-3">
        <Badge variant="cyan" size="md">
          Role-Grounded Intelligence
        </Badge>
        <span className="text-xs text-slate-500 font-mono">v1.0.0</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Secure Enterprise AI Assistant
      </h2>

      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
        Hello, <span className="text-cyan-600 dark:text-cyan-300 font-semibold">{user?.name || 'Authorized Member'}</span>. You are connected to your organization's confidential intelligence repository. All responses are verified against accessible documentation under your <span className="text-cyan-600 dark:text-cyan-300 font-semibold">{user?.role}</span> security classification.
      </p>

      {/* Trust Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-8 text-left">
        <div className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 mb-1">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Zero-Trust Citations</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Every factual assertion is corroborated with clickable, credential-sanitized citations.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <FileSearch className="w-4 h-4" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Ephemeral Analysis</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Attach transient CSVs or PDFs for isolated analysis without permanently ingesting them.
          </p>
        </div>
      </div>
    </div>
  );
};
