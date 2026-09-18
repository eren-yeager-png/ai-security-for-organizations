import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../api/types';
import { getUsers, updateUserRole, toggleUserStatus } from '../../api/users';
import { useNotification } from '../../context/NotificationContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Search } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { success, error: notifyError } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Role Change Confirmation Dialog State
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ user: User; newRole: UserRole } | null>(null);
  const [statusToggleTarget, setStatusToggleTarget] = useState<User | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      notifyError('Failed to fetch user directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget) return;
    try {
      const updated = await updateUserRole(roleChangeTarget.user.id, roleChangeTarget.newRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      success('Role Assigned', `${updated.name} has been assigned role "${roleChangeTarget.newRole}".`);
      setRoleChangeTarget(null);
    } catch {
      notifyError('Failed to modify user role');
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusToggleTarget) return;
    try {
      const updated = await toggleUserStatus(statusToggleTarget.id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      success('Status Updated', `${updated.name} is now ${updated.isActive ? 'Active' : 'Suspended'}.`);
      setStatusToggleTarget(null);
    } catch {
      notifyError('Failed to update user status');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Enterprise User & Identity Directory</h1>
            <Badge variant="purple" size="sm">
              Strict 3-Role Model
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authorize and manage user security clearance. Enforces fixed roles: Admin, Manager, and Employee.
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
            placeholder="Search by name, email, department..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Role Filter:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs py-1.5 px-3 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Fixed Roles</option>
            <option value="Admin">Admin (Full Control)</option>
            <option value="Manager">Manager (Restricted Access)</option>
            <option value="Employee">Employee (Public/Internal)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-slate-400 text-xs">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-400 rounded-full animate-spin" />
              <span>Verifying account credentials...</span>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Account</TableHead>
                <TableHead>Role Clearance</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Account State</TableHead>
                <TableHead>Last Authenticated</TableHead>
                <TableHead className="text-right">Reassign Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-slate-800 border border-purple-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-purple-700 dark:text-purple-300 flex-shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={u.role === 'Admin' ? 'purple' : u.role === 'Manager' ? 'blue' : 'cyan'}
                      size="sm"
                    >
                      {u.role}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-slate-300">{u.department}</span>
                  </TableCell>

                  <TableCell>
                    <button
                      onClick={() => setStatusToggleTarget(u)}
                      title="Click to toggle active status"
                      className="cursor-pointer"
                    >
                      {u.isActive ? (
                        <Badge variant="emerald" size="sm" className="hover:opacity-80">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="rose" size="sm" className="hover:opacity-80">
                          Suspended
                        </Badge>
                      )}
                    </button>
                  </TableCell>

                  <TableCell>
                    <span className="text-[11px] text-slate-400">
                      {u.lastLogin
                        ? new Date(u.lastLogin).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Never'}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <select
                      value={u.role}
                      onChange={(e) =>
                        setRoleChangeTarget({ user: u, newRole: e.target.value as UserRole })
                      }
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs py-1 px-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="Employee">Employee</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Role Change Dialog */}
      <ConfirmDialog
        isOpen={!!roleChangeTarget}
        onClose={() => setRoleChangeTarget(null)}
        onConfirm={handleConfirmRoleChange}
        title="Reassign Security Role?"
        message={`Are you sure you want to change ${roleChangeTarget?.user.name}'s role from "${roleChangeTarget?.user.role}" to "${roleChangeTarget?.newRole}"? This will immediately alter their document clearance and administrative boundaries.`}
        confirmLabel="Apply Clearance Change"
        isDestructive={roleChangeTarget?.newRole === 'Admin'}
      />

      {/* Status Toggle Dialog */}
      <ConfirmDialog
        isOpen={!!statusToggleTarget}
        onClose={() => setStatusToggleTarget(null)}
        onConfirm={handleConfirmStatusToggle}
        title={`${statusToggleTarget?.isActive ? 'Suspend' : 'Activate'} User Account?`}
        message={`Are you sure you want to ${
          statusToggleTarget?.isActive ? 'suspend' : 'reinstate'
        } ${statusToggleTarget?.name} (${statusToggleTarget?.email})?`}
        confirmLabel={statusToggleTarget?.isActive ? 'Suspend Account' : 'Activate'}
        isDestructive={statusToggleTarget?.isActive}
      />
    </div>
  );
};
