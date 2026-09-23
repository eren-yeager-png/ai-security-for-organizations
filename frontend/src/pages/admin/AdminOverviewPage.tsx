import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalyticsData, SecurityAlert } from '../../api/types';
import { getAnalytics } from '../../api/analytics';
import { getSecurityAlerts } from '../../api/security';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Users,
  Files,
  Cpu,
  ShieldAlert,
  AlertTriangle,
  ArrowUpRight,
  HardDrive,
  Activity,
  Layers,
} from 'lucide-react';

export const AdminOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aData, alertData] = await Promise.all([getAnalytics(), getSecurityAlerts()]);
        setAnalytics(aData);
        setAlerts(alertData);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading || !analytics) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-400 rounded-full animate-spin" />
          <span>Polling enterprise governance telemetry...</span>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Overview Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-purple-50/90 via-white/90 to-slate-50/90 dark:from-purple-950/40 dark:via-slate-900/60 dark:to-slate-900/40 border border-purple-200/80 dark:border-purple-500/20 backdrop-blur-xl shadow-sm shadow-slate-200/60 dark:shadow-none">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Enterprise Control Center</h1>
            <Badge variant="purple" size="sm">
              Live Governance
            </Badge>
          </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Real-time telemetry across role-based access, document ingestion, and AI activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/admin/security-alerts')}
            leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
          >
            {criticalAlerts.length} Active Alerts
          </Button>
          <Button
            variant="glow"
            size="sm"
            onClick={() => navigate('/admin/documents')}
            leftIcon={<Files className="w-3.5 h-3.5 text-slate-950" />}
          >
            Manage Knowledge Base
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total Users</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{analytics.totalUsers}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1 font-medium">
              <Activity className="w-3 h-3" /> {analytics.activeUsers} active this week
            </p>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Knowledge Assets</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 flex items-center justify-center">
              <Files className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{analytics.documentCount}</p>
            <p className="text-[11px] text-cyan-700 dark:text-cyan-400 mt-0.5 font-medium">
              {analytics.readyDocs} Ready • {analytics.failedDocs} Failed
            </p>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">AI Queries (Today)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{analytics.aiQueriesToday}</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              Avg latency: <span className="text-emerald-600 dark:text-emerald-400 font-mono">{analytics.averageLatencyMs}ms</span>
            </p>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Security Threats</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{alerts.length}</p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 font-medium">
              {criticalAlerts.length} High/Critical Severity
            </p>
          </div>
        </Card>
      </div>

      {/* Two-Column Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Classification Distribution */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Document Access Classification Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">RBAC Grounded</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {analytics.visibilityDistribution.map((item) => (
              <div
                key={item.visibility}
                className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {item.visibility.replace('_', ' ')}
                </span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{item.count}</p>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full ${
                      item.visibility === 'PUBLIC'
                        ? 'bg-cyan-400'
                        : item.visibility === 'INTERNAL'
                        ? 'bg-blue-500'
                        : item.visibility === 'RESTRICTED'
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${(item.count / analytics.documentCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Strict document boundaries enforced across Employee, Manager, and Admin roles.
            </span>
            <button
              onClick={() => navigate('/admin/documents')}
              className="text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect All Documents</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>

        {/* Recent Critical Alerts */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Active Security Alerts</span>
            </h3>
            <Badge variant="amber" size="sm">
              {alerts.length}
            </Badge>
          </div>

          <div className="space-y-2.5">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                onClick={() => navigate('/admin/security-alerts')}
                className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-amber-500/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                        : alert.severity === 'HIGH'
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        : 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">{alert.title}</p>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{alert.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
            <button
              onClick={() => navigate('/admin/security-alerts')}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
            >
              View All Security Incidents →
            </button>
          </div>
        </Card>
      </div>

      {/* Top Queried Sources */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Most Referenced Knowledge Sources</span>
          </h3>
          <span className="text-xs text-slate-400">Total Inquiries Tracked</span>
        </div>

        <div className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
          {analytics.topSources.map((src, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-slate-500 w-4 text-right">{idx + 1}</span>
                <span className="font-medium text-slate-900 dark:text-slate-200 truncate">{src.title}</span>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {src.visibility}
                </span>
                <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded-lg border border-cyan-200 dark:border-cyan-500/20">
                  {src.count} citations
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
