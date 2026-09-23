import React, { useState, useEffect } from 'react';
import { DataAccessRecord } from '../../api/types';
import { getDataAccessRecords } from '../../api/security';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { VisibilityBadge } from '../../components/documents/AccessBadge';
import { FileText } from 'lucide-react';

export const AdminDataAccessPage: React.FC = () => {
  const [records, setRecords] = useState<DataAccessRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDataAccessRecords();
        setRecords(data);
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
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Document Data Access History</h1>
            <Badge variant="purple" size="sm">
              Granular Inquiries
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audit of all organizational document interactions, vector search references, and file views.
          </p>
        </div>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading access history...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User Account</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Document Title</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Access Mode</TableHead>
                <TableHead className="text-right">Origin IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell>
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(rec.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-bold text-slate-900 dark:text-slate-200">{rec.userEmail}</span>
                  </TableCell>

                  <TableCell>
                    <Badge variant={rec.role === 'Admin' ? 'purple' : rec.role === 'Manager' ? 'blue' : 'cyan'} size="sm">
                      {rec.role}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2 max-w-sm">
                      <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span className="font-medium text-slate-900 dark:text-slate-200 truncate">{rec.documentTitle}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <VisibilityBadge visibility={rec.visibility} />
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-cyan-300">
                      {rec.action}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <span className="font-mono text-xs text-slate-400">{rec.ipAddress}</span>
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
