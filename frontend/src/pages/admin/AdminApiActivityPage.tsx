import React, { useState, useEffect } from 'react';
import { ApiActivity } from '../../api/types';
import { getApiActivities } from '../../api/security';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

export const AdminApiActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<ApiActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getApiActivities();
        setActivities(data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">API Gateway & Service Telemetry</h1>
            <Badge variant="purple" size="sm">
              Live Endpoints
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time latency metrics, response codes, and request methods processed by the backend cluster.
          </p>
        </div>
      </div>

      {/* Activity Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading API telemetry...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>User Account</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Outcome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <span
                      className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                        item.method === 'GET'
                          ? 'bg-blue-500/20 text-blue-300'
                          : item.method === 'POST'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : item.method === 'PUT'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {item.method}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {item.endpoint}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`font-mono text-xs font-bold ${
                        item.status >= 200 && item.status < 300
                          ? 'text-emerald-400'
                          : item.status === 403
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs text-cyan-400">
                      {item.responseTimeMs} ms
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-slate-300">{item.userEmail}</span>
                  </TableCell>

                  <TableCell>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <Badge variant={item.result === 'SUCCESS' ? 'emerald' : 'rose'} size="sm">
                      {item.result}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};
