import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ShieldCheck, Globe, Key, CheckCircle2 } from 'lucide-react';

export const AdminSecurityPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Security & Posture Dashboard</h1>
            <Badge variant="emerald" size="sm">
              Posture: 98/100
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global zero-trust health, hardware MFA status, and automated URL credential sanitizers.
          </p>
        </div>
      </div>

      {/* Grid of Security Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card hover>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <Badge variant="emerald" size="sm">
              Optimal
            </Badge>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">RBAC Barrier Integrity</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            100% of data queries pass through strict role-boundary evaluation before reaching vector retrieval.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Enforcement Rules</span>
            <span className="font-mono text-emerald-400 font-bold">4 Active Tiers</span>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <Badge variant="cyan" size="sm">
              Active
            </Badge>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">URL Credential Masking</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Real-time presentation scrubber intercepts and neutralizes embedded user/password and API tokens.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Neutralized Today</span>
            <span className="font-mono text-cyan-400 font-bold">14 Interceptions</span>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <Badge variant="purple" size="sm">
              Hardware Bound
            </Badge>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cryptographic Sessions</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Session tokens signed with HS256 / RSA-4096 with automatic 30-minute rotation cycles.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Refresh Latency</span>
            <span className="font-mono text-purple-400 font-bold">~45ms</span>
          </div>
        </Card>
      </div>

      {/* Security Architecture Compliance Checklist */}
      <Card>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Compliance & Protection Checklist</span>
        </h3>

        <div className="divide-y divide-slate-200/80 dark:divide-slate-800 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-200">Ephemeral In-Chat Analysis Protection</p>
              <p className="text-[10px] text-slate-400">Files uploaded in chat are isolated and purged from storage post-session</p>
            </div>
            <Badge variant="emerald" size="sm">Compliant</Badge>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-200">No Raw Credentials Rendered in Citations</p>
              <p className="text-[10px] text-slate-400">Safe labels replace internal network URLs and secret-containing links</p>
            </div>
            <Badge variant="emerald" size="sm">Compliant</Badge>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-200">Anti-Brute Force Rate Limiter</p>
              <p className="text-[10px] text-slate-400">Gateway blacklists IPs after 10 consecutive invalid auth attempts</p>
            </div>
            <Badge variant="emerald" size="sm">Active</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};
