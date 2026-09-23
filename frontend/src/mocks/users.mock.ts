import { User, UserRole, PermissionDefinition } from '../api/types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin_01',
    email: 'admin@enterprise.ai',
    name: 'Eleanor Vance',
    role: 'Admin',
    department: 'Security & Governance',
    isActive: true,
    isAdmin: true,
    createdAt: '2025-01-10T08:00:00Z',
    lastLogin: '2026-09-16T08:15:00Z',
  },
  {
    id: 'usr_manager_02',
    email: 'manager@enterprise.ai',
    name: 'Marcus Chen',
    role: 'Manager',
    department: 'Engineering & Architecture',
    isActive: true,
    isAdmin: false,
    createdAt: '2025-02-15T09:30:00Z',
    lastLogin: '2026-09-16T07:45:00Z',
  },
  {
    id: 'usr_employee_03',
    email: 'employee@enterprise.ai',
    name: 'Sarah Jenkins',
    role: 'Employee',
    department: 'Customer Operations',
    isActive: true,
    isAdmin: false,
    createdAt: '2025-03-01T11:00:00Z',
    lastLogin: '2026-09-16T08:30:00Z',
  },
  {
    id: 'usr_user_04',
    email: 'david.kim@enterprise.ai',
    name: 'David Kim',
    role: 'Manager',
    department: 'Finance & Strategy',
    isActive: true,
    isAdmin: false,
    createdAt: '2025-03-12T10:00:00Z',
    lastLogin: '2026-09-15T16:20:00Z',
  },
  {
    id: 'usr_user_05',
    email: 'priya.patel@enterprise.ai',
    name: 'Priya Patel',
    role: 'Employee',
    department: 'People & Culture',
    isActive: true,
    isAdmin: false,
    createdAt: '2025-04-05T09:15:00Z',
    lastLogin: '2026-09-16T06:50:00Z',
  },
  {
    id: 'usr_user_06',
    email: 'james.wilson@enterprise.ai',
    name: 'James Wilson',
    role: 'Admin',
    department: 'Information Security',
    isActive: true,
    isAdmin: true,
    createdAt: '2025-01-20T14:00:00Z',
    lastLogin: '2026-09-16T07:10:00Z',
  },
  {
    id: 'usr_user_07',
    email: 'elena.rostova@enterprise.ai',
    name: 'Elena Rostova',
    role: 'Employee',
    department: 'Engineering',
    isActive: false, // Inactive user for testing filters
    isAdmin: false,
    createdAt: '2025-05-18T13:40:00Z',
    lastLogin: '2026-08-28T11:30:00Z',
  },
];

export const ROLE_PERMISSIONS_MATRIX: PermissionDefinition[] = [
  {
    id: 'perm_01',
    key: 'DOCUMENTS_VIEW_PUBLIC',
    label: 'View Public Documents',
    description: 'Read and search public organizational documentation and policies.',
    category: 'Documents',
    admin: true,
    manager: true,
    employee: true,
  },
  {
    id: 'perm_02',
    key: 'DOCUMENTS_VIEW_INTERNAL',
    label: 'View Internal Documents',
    description: 'Access internal runbooks, engineering guides, and company procedures.',
    category: 'Documents',
    admin: true,
    manager: true,
    employee: true,
  },
  {
    id: 'perm_03',
    key: 'DOCUMENTS_VIEW_RESTRICTED',
    label: 'View Restricted Documents',
    description: 'Access confidential financial projections, executive M&A, and sensitive reports.',
    category: 'Documents',
    admin: true,
    manager: true,
    employee: false,
  },
  {
    id: 'perm_04',
    key: 'DOCUMENTS_VIEW_ADMIN_ONLY',
    label: 'View Admin-Only Documents',
    description: 'Access infrastructure recovery keys, vulnerability assessments, and master secrets.',
    category: 'Documents',
    admin: true,
    manager: false,
    employee: false,
  },
  {
    id: 'perm_05',
    key: 'DOCUMENTS_UPLOAD',
    label: 'Upload New Documents',
    description: 'Ingest new PDFs and CSV files into the organizational knowledge base.',
    category: 'Documents',
    admin: true,
    manager: true,
    employee: false,
  },
  {
    id: 'perm_06',
    key: 'DOCUMENTS_DELETE',
    label: 'Delete Documents',
    description: 'Permanently remove documents or data sources from the knowledge base.',
    category: 'Documents',
    admin: true,
    manager: false,
    employee: false,
  },
  {
    id: 'perm_07',
    key: 'CHAT_USE_AI',
    label: 'Interact with AI Assistant',
    description: 'Send conversational queries and receive RAG-augmented answers with source citations.',
    category: 'Chat',
    admin: true,
    manager: true,
    employee: true,
  },
  {
    id: 'perm_08',
    key: 'CHAT_UPLOAD_TEMP_FILE',
    label: 'Upload Temporary Chat File',
    description: 'Upload transient files for localized in-session analysis without indexing into knowledge base.',
    category: 'Chat',
    admin: true,
    manager: true,
    employee: true,
  },
  {
    id: 'perm_09',
    key: 'ADMIN_ACCESS_PANEL',
    label: 'Access Admin Control Center',
    description: 'Navigate to enterprise governance, audit logging, security metrics, and user management.',
    category: 'Administration',
    admin: true,
    manager: false,
    employee: false,
  },
  {
    id: 'perm_10',
    key: 'ADMIN_CHANGE_USER_ROLE',
    label: 'Modify User Roles & Permissions',
    description: 'Assign or reassign fixed roles (Admin, Manager, Employee) across organizational accounts.',
    category: 'Security',
    admin: true,
    manager: false,
    employee: false,
  },
];

let usersStore = [...INITIAL_USERS];

export async function mockGetUsers(params?: {
  search?: string;
  role?: UserRole;
  department?: string;
  isActive?: boolean;
}): Promise<User[]> {
  await new Promise((r) => setTimeout(r, 200));

  return usersStore.filter((u) => {
    if (params?.search) {
      const q = params.search.toLowerCase();
      const match = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (params?.role && u.role !== params.role) {
      return false;
    }
    if (params?.department && u.department !== params.department) {
      return false;
    }
    if (params?.isActive !== undefined && u.isActive !== params.isActive) {
      return false;
    }
    return true;
  });
}

export async function mockUpdateUserRole(userId: string, newRole: UserRole): Promise<User> {
  await new Promise((r) => setTimeout(r, 300));
  const user = usersStore.find((u) => u.id === userId);
  if (!user) throw new Error('User not found');

  user.role = newRole;
  user.isAdmin = newRole === 'Admin';
  return { ...user };
}

export async function mockToggleUserStatus(userId: string): Promise<User> {
  await new Promise((r) => setTimeout(r, 250));
  const user = usersStore.find((u) => u.id === userId);
  if (!user) throw new Error('User not found');

  user.isActive = !user.isActive;
  return { ...user };
}

export async function mockGetPermissions(): Promise<PermissionDefinition[]> {
  await new Promise((r) => setTimeout(r, 150));
  return [...ROLE_PERMISSIONS_MATRIX];
}
