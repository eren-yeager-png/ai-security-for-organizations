import React, { useState, useEffect } from 'react';
import { LoginActivity } from '../../api/types';
import { getLoginActivities } from '../../api/security';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

export const AdminLoginActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<LoginActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getLoginActivities();
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
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Authentication & Login Activity</h1>
            <Badge variant="purple" size="sm">
              Session Telemetry
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of successful authentication challenges, device posture, and failed password attempts.
          </p>
        </div>
      </div>

      {/* Activity Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading session telemetry...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User Account</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Authentication Method</TableHead>
                <TableHead>Device / Client</TableHead>
                <TableHead>IP & Location</TableHead>
                <TableHead>Failure Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((act) => (
                <TableRow key={act.id}>
                  <TableCell>
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(act.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-bold text-slate-900 dark:text-slate-200">{act.userEmail}</span>
                  </TableCell>

                  <TableCell>
                    <Badge variant={act.result === 'SUCCESS' ? 'emerald' : 'rose'} size="sm">
                      {act.result}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-cyan-300 font-medium">{act.authMethod}</span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-slate-300">{act.device}</span>
                  </TableCell>

                  <TableCell>
                    <div>
                      <p className="font-mono text-[11px] text-slate-300">{act.ipAddress}</p>
                      <p className="text-[10px] text-slate-500">{act.location}</p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-rose-400 font-medium">
                      {act.failureReason || '—'}
                    </span>
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
