import React, { useState, useEffect } from 'react';
import { AnalyticsData } from '../../api/types';
import { getAnalytics } from '../../api/analytics';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { TrendingUp, Layers, CheckCircle2 } from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAnalytics();
        setAnalytics(data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading || !analytics) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-500 text-xs">
        Loading analytics charts...
      </div>
    );
  }

  const maxQueryVal = Math.max(...analytics.queryVolumeTrend.map((d) => d.queries));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">AI Query & Ingestion Analytics</h1>
            <Badge variant="purple" size="sm">
              Telemetry Suite
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quantitative analysis of enterprise AI inquiries, ingestion throughput, and classification distributions.
          </p>
        </div>
      </div>

      {/* Query Volume Trend Chart */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">Daily AI Query Volume (7-Day Trend)</h3>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-bold">
            Total Queries: {analytics.aiQueriesToday} / day
          </span>
        </div>

        {/* Clean SVG/HTML Bar Visualizer */}
        <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-200 dark:border-slate-800">
          {analytics.queryVolumeTrend.map((item) => {
            const heightPercent = Math.round((item.queries / maxQueryVal) * 100);
            return (
              <div key={item.date} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[10px] font-mono text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.queries}
                </span>
                <div
                  className="w-full max-w-[48px] rounded-t-xl bg-gradient-to-t from-blue-600 to-cyan-400 group-hover:from-blue-500 group-hover:to-cyan-300 transition-all shadow-lg shadow-cyan-500/10"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[11px] font-medium text-slate-400 mt-1">{item.date}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Two Breakdown Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Processing Status Distribution */}
        <Card>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Document Ingestion Health</span>
          </h3>

          <div className="space-y-3">
            {analytics.statusDistribution.map((st) => (
              <div key={st.status} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-300">{st.status}</span>
                  <span className="font-mono text-slate-400 font-bold">{st.count} assets</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div
                    className={`h-full ${
                      st.status === 'Ready'
                        ? 'bg-emerald-400'
                        : st.status === 'Processing'
                        ? 'bg-cyan-400 animate-pulse'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${(st.count / analytics.documentCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Visibility Distribution */}
        <Card>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Classification Breakdown</span>
          </h3>

          <div className="space-y-3">
            {analytics.visibilityDistribution.map((vis) => (
              <div key={vis.visibility} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-300">
                    {vis.visibility.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-slate-400 font-bold">{vis.count} assets</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div
                    className={`h-full ${
                      vis.visibility === 'PUBLIC'
                        ? 'bg-cyan-400'
                        : vis.visibility === 'INTERNAL'
                        ? 'bg-blue-500'
                        : vis.visibility === 'RESTRICTED'
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${(vis.count / analytics.documentCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
