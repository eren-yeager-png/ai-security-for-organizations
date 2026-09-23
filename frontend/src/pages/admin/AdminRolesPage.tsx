import React, { useState, useEffect } from 'react';
import { PermissionDefinition } from '../../api/types';
import { getPermissions } from '../../api/users';
import { useNotification } from '../../context/NotificationContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { KeyRound, Check, X, Info } from 'lucide-react';

export const AdminRolesPage: React.FC = () => {
  const { success, error: notifyError } = useNotification();
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit confirmation state
  const [pendingChange, setPendingChange] = useState<{
    permId: string;
    role: 'admin' | 'manager' | 'employee';
    currentValue: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchPerms = async () => {
      try {
        const list = await getPermissions();
        setPermissions(list);
      } catch {
        notifyError('Failed to load role permissions');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPerms();
  }, []);

  const handleToggleClick = (
    permId: string,
    role: 'admin' | 'manager' | 'employee',
    currentValue: boolean
  ) => {
    if (role === 'admin') {
      notifyError('Administrative baseline permissions cannot be revoked.');
      return;
    }
    setPendingChange({ permId, role, currentValue });
  };

  const handleConfirmToggle = () => {
    if (!pendingChange) return;

    setPermissions((prev) =>
      prev.map((p) =>
        p.id === pendingChange.permId
          ? { ...p, [pendingChange.role]: !pendingChange.currentValue }
          : p
      )
    );

    success(
      'Permission Modified',
      `Updated ${pendingChange.role.toUpperCase()} clearance for selected capability.`
    );
    setPendingChange(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fixed Role & Permission Governance</h1>
            <Badge variant="purple" size="sm">
              Strict 3-Role Model
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Centrally defined permission boundaries for <span className="text-cyan-300 font-semibold">Employee</span>, <span className="text-blue-300 font-semibold">Manager</span>, and <span className="text-purple-300 font-semibold">Admin</span>. Custom roles are disallowed by security policy.
          </p>
        </div>
      </div>

      {/* Overview Cards for 3 Roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card hover>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="cyan" size="md">
              EMPLOYEE
            </Badge>
            <span className="text-[10px] text-slate-500 font-mono">Tier 1</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Knowledge User</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Authorized to query public and internal company documents. Blocked from restricted executive financial data and infrastructure keys.
          </p>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="blue" size="md">
              MANAGER
            </Badge>
            <span className="text-[10px] text-slate-500 font-mono">Tier 2</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Departmental Lead</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Authorized to access confidential restricted materials (e.g. Q3 audits, sales plans), upload files, and retry document ingestion pipelines.
          </p>
        </Card>

        <Card hover glow>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="purple" size="md">
              ADMIN
            </Badge>
            <span className="text-[10px] text-purple-400 font-mono">Tier 3</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security & Governance</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Full administrative authority. Oversees audit logs, login telemetries, API metrics, user clearance reassignment, and master root keys.
          </p>
        </Card>
      </div>

      {/* Permissions Matrix Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Capability Clearance Matrix
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-cyan-400" /> Click cells to toggle role capabilities
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading matrix...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capability & Scope</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center w-28">Employee</TableHead>
                <TableHead className="text-center w-28">Manager</TableHead>
                <TableHead className="text-center w-28">Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((perm) => (
                <TableRow key={perm.id}>
                  <TableCell>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{perm.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{perm.description}</p>
                  </TableCell>

                  <TableCell>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {perm.category}
                    </span>
                  </TableCell>

                  {/* Employee Toggle */}
                  <TableCell className="text-center">
                    <button
                      onClick={() => handleToggleClick(perm.id, 'employee', perm.employee)}
                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                        perm.employee
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-600 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {perm.employee ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </TableCell>

                  {/* Manager Toggle */}
                  <TableCell className="text-center">
                    <button
                      onClick={() => handleToggleClick(perm.id, 'manager', perm.manager)}
                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                        perm.manager
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-600 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {perm.manager ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </TableCell>

                  {/* Admin (Fixed true) */}
                  <TableCell className="text-center">
                    <div className="w-7 h-7 rounded-lg inline-flex items-center justify-center bg-purple-500/20 text-purple-300 border border-purple-500/30 mx-auto">
                      <Check className="w-4 h-4" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!pendingChange}
        onClose={() => setPendingChange(null)}
        onConfirm={handleConfirmToggle}
        title="Modify Security Capability?"
        message={`Are you sure you want to ${
          pendingChange?.currentValue ? 'revoke' : 'grant'
        } this capability for all ${pendingChange?.role.toUpperCase()} accounts? This change affects authorization boundaries immediately.`}
        confirmLabel="Confirm Policy Modification"
        isDestructive={!pendingChange?.currentValue}
      />
    </div>
  );
};
