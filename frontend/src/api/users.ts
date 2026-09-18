import { apiClient, USE_MOCK_API } from './client';
import { User, UserRole, PermissionDefinition } from './types';
import {
  mockGetUsers,
  mockUpdateUserRole,
  mockToggleUserStatus,
  mockGetPermissions,
} from '../mocks/users.mock';

export async function getUsers(params?: {
  search?: string;
  role?: UserRole;
  department?: string;
  isActive?: boolean;
}): Promise<User[]> {
  if (USE_MOCK_API) {
    return mockGetUsers(params);
  }

  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.role) query.set('role', params.role);
  if (params?.department) query.set('department', params.department);
  if (params?.isActive !== undefined) query.set('is_active', String(params.isActive));

  const qs = query.toString();
  return apiClient<User[]>(`/admin/users${qs ? `?${qs}` : ''}`);
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<User> {
  if (USE_MOCK_API) {
    return mockUpdateUserRole(userId, newRole);
  }

  return apiClient<User>(`/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role: newRole }),
  });
}

export async function toggleUserStatus(userId: string): Promise<User> {
  if (USE_MOCK_API) {
    return mockToggleUserStatus(userId);
  }

  return apiClient<User>(`/admin/users/${userId}/toggle-status`, {
    method: 'POST',
  });
}

export async function getPermissions(): Promise<PermissionDefinition[]> {
  if (USE_MOCK_API) {
    return mockGetPermissions();
  }

  return apiClient<PermissionDefinition[]>('/admin/permissions');
}
