import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, ShieldCheck, FileText, MessageSquare } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const ActivityPage: React.FC = () => {
  const { user } = useAuth();

  const mockActivities = [
    {
      id: 'act_01',
      type: 'query',
      title: 'Queried VPN & Password Security Standards',
      timestamp: 'Today at 08:31 AM',
      sources: 2,
    },
    {
      id: 'act_02',
      type: 'view',
      title: 'Viewed Internal IT Security Standards.pdf',
      timestamp: 'Today at 08:15 AM',
      sources: 1,
    },
    {
      id: 'act_03',
      type: 'session',
      title: 'Authenticated session via FIDO2 / Password',
      timestamp: 'Today at 08:00 AM',
    },
    {
      id: 'act_04',
      type: 'query',
      title: 'Queried Employee Benefits & Remote Stipend',
      timestamp: 'Yesterday at 04:22 PM',
      sources: 1,
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Security & Query Activity</h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Cryptographically recorded session history and knowledge queries for account <span className="text-cyan-600 dark:text-cyan-300 font-semibold">{user?.email}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Queries Today</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">14</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Knowledge Sources Cited</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">28</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Security Clearance</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{user?.role}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Audit Trail</span>
        </h3>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {mockActivities.map((act) => (
            <div key={act.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400 flex-shrink-0">
                  {act.type === 'query' ? (
                    <MessageSquare className="w-3.5 h-3.5" />
                  ) : act.type === 'view' ? (
                    <FileText className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{act.title}</p>
                  <p className="text-[10px] text-slate-500">{act.timestamp}</p>
                </div>
              </div>

              {act.sources && (
                <Badge variant="cyan" size="sm">
                  {act.sources} Sources Cited
                </Badge>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
