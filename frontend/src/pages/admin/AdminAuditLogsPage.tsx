import React, { useState, useEffect } from 'react';
import { AuditLog } from '../../api/types';
import { getAuditLogs } from '../../api/security';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Search } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getAuditLogs();
        setLogs(data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filtered = logs.filter((log) => {
    if (resultFilter !== 'ALL' && log.result !== resultFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        log.userEmail.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.resource.toLowerCase().includes(q) ||
        log.ipAddress.includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Immutable Enterprise Audit Trail</h1>
            <Badge variant="purple" size="sm">
              Cryptographically Stamped
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete compliance logs recording role modifications, document access attempts, and authentication anomalies.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user, action, resource, IP..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Result Filter:</span>
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs py-1.5 px-3 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Outcomes</option>
            <option value="SUCCESS">Success</option>
            <option value="DENIED">Denied (RBAC Boundary)</option>
            <option value="FAILURE">Failure</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading audit records...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User Account</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>IP / Client</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(log.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-bold text-slate-900 dark:text-slate-200">{log.userEmail}</span>
                  </TableCell>

                  <TableCell>
                    <Badge variant={log.role === 'Admin' ? 'purple' : log.role === 'Manager' ? 'blue' : 'cyan'} size="sm">
                      {log.role}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-cyan-300">
                      {log.action}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-slate-300 truncate max-w-xs block">
                      {log.resource}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        log.result === 'SUCCESS'
                          ? 'emerald'
                          : log.result === 'DENIED'
                          ? 'amber'
                          : 'rose'
                      }
                      size="sm"
                    >
                      {log.result}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div>
                      <p className="font-mono text-[11px] text-slate-300">{log.ipAddress}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-xs">{log.device}</p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-[11px] text-slate-400 truncate max-w-xs block">
                      {log.details || '—'}
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
