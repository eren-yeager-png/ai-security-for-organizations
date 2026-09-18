import React, { useState, useEffect } from 'react';
import { SecurityAlert, AlertStatus } from '../../api/types';
import { getSecurityAlerts, updateAlertStatus } from '../../api/security';
import { useNotification } from '../../context/NotificationContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

export const AdminSecurityAlertsPage: React.FC = () => {
  const { success, error: notifyError } = useNotification();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await getSecurityAlerts();
      setAlerts(data);
    } catch {
      notifyError('Failed to load security alerts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleStatusChange = async (alertId: string, newStatus: AlertStatus) => {
    try {
      const updated = await updateAlertStatus(alertId, newStatus);
      setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      success('Alert Status Updated', `Case status marked as ${newStatus}.`);
    } catch {
      notifyError('Failed to update alert state');
    }
  };

  const filtered = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Security Alerts & Threat Response</h1>
            <Badge variant="rose" size="sm">
              {alerts.length} Incidents
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time security notifications for RBAC violations, credential exposures, and perimeter attacks.
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs py-1.5 px-3 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading alerts...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Incident & Description</TableHead>
                <TableHead>Affected Resource</TableHead>
                <TableHead>Source IP</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Case Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <Badge
                      variant={
                        alert.severity === 'CRITICAL'
                          ? 'rose'
                          : alert.severity === 'HIGH'
                          ? 'amber'
                          : alert.severity === 'MEDIUM'
                          ? 'cyan'
                          : 'slate'
                      }
                      size="sm"
                    >
                      {alert.severity}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="max-w-md">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{alert.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-[11px] text-cyan-300">
                      {alert.affectedResource}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs text-slate-300">{alert.sourceIp}</span>
                  </TableCell>

                  <TableCell>
                    <span className="text-[11px] text-slate-400">
                      {new Date(alert.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <select
                      value={alert.status}
                      onChange={(e) => handleStatusChange(alert.id, e.target.value as AlertStatus)}
                      className={`text-xs py-1 px-2.5 rounded-lg border focus:outline-none cursor-pointer ${
                        alert.status === 'RESOLVED'
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                          : alert.status === 'INVESTIGATING'
                          ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300'
                          : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 font-bold'
                      }`}
                    >
                      <option value="NEW" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                        NEW
                      </option>
                      <option value="INVESTIGATING" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                        INVESTIGATING
                      </option>
                      <option value="RESOLVED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                        RESOLVED
                      </option>
                    </select>
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
