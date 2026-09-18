import { User, UserRole, DocumentVisibility } from '../api/types';

/**
 * Enterprise RBAC Engine for Secure AI Assistant
 * Strictly enforces 3 roles: Admin, Manager, Employee
 * Across 4 visibility levels: PUBLIC, INTERNAL, RESTRICTED, ADMIN_ONLY
 */

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  Employee: 1,
  Manager: 2,
  Admin: 3,
};

export const VISIBILITY_PERMISSIONS: Record<DocumentVisibility, UserRole[]> = {
  PUBLIC: ['Employee', 'Manager', 'Admin'],
  INTERNAL: ['Employee', 'Manager', 'Admin'],
  RESTRICTED: ['Manager', 'Admin'],
  ADMIN_ONLY: ['Admin'],
};

/**
 * Checks if a user has permission to access a document based on visibility rules.
 * Backend remains the final authority; this provides instant frontend guarding.
 */
export function canAccessDocument(
  user: User | null | undefined,
  doc: { visibility: DocumentVisibility } | DocumentVisibility
): boolean {
  if (!user || !user.isActive) return false;

  const visibility: DocumentVisibility = typeof doc === 'string' ? doc : doc.visibility;
  const allowedRoles = VISIBILITY_PERMISSIONS[visibility];

  if (!allowedRoles) return false;
  return allowedRoles.includes(user.role);
}

/**
 * Checks if a user possesses one of the required roles.
 */
export function hasRole(
  user: User | null | undefined,
  requiredRole: UserRole | UserRole[]
): boolean {
  if (!user || !user.isActive) return false;

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role);
  }
  return user.role === requiredRole;
}

/**
 * Checks if a user meets a minimum role tier in the hierarchy.
 */
export function hasMinimumRole(
  user: User | null | undefined,
  minimumRole: UserRole
): boolean {
  if (!user || !user.isActive) return false;
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Centralized feature permission matrix.
 * Rather than scattering `role === 'admin'` across JSX, UI components query permissions.
 */
export const PERMISSIONS = {
  // Document Operations
  DOCUMENTS_VIEW_PUBLIC: ['Employee', 'Manager', 'Admin'],
  DOCUMENTS_VIEW_INTERNAL: ['Employee', 'Manager', 'Admin'],
  DOCUMENTS_VIEW_RESTRICTED: ['Manager', 'Admin'],
  DOCUMENTS_VIEW_ADMIN_ONLY: ['Admin'],
  DOCUMENTS_UPLOAD: ['Manager', 'Admin'],
  DOCUMENTS_DELETE: ['Admin'],
  DOCUMENTS_EDIT_METADATA: ['Manager', 'Admin'],
  DOCUMENTS_MANAGE_VISIBILITY: ['Admin'],
  DOCUMENTS_RETRY_PROCESSING: ['Manager', 'Admin'],

  // Chat Operations
  CHAT_USE_AI: ['Employee', 'Manager', 'Admin'],
  CHAT_UPLOAD_TEMP_FILE: ['Employee', 'Manager', 'Admin'],
  CHAT_EXPORT_HISTORY: ['Manager', 'Admin'],

  // Admin & Security Center
  ADMIN_ACCESS_PANEL: ['Admin'],
  ADMIN_MANAGE_USERS: ['Admin'],
  ADMIN_CHANGE_USER_ROLE: ['Admin'],
  ADMIN_VIEW_AUDIT_LOGS: ['Admin'],
  ADMIN_VIEW_LOGIN_ACTIVITY: ['Admin'],
  ADMIN_VIEW_API_ACTIVITY: ['Admin'],
  ADMIN_VIEW_SECURITY_ALERTS: ['Admin'],
  ADMIN_VIEW_DATA_ACCESS: ['Admin'],
  ADMIN_VIEW_ANALYTICS: ['Admin'],
  ADMIN_MANAGE_PERMISSIONS: ['Admin'],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export function hasPermission(
  user: User | null | undefined,
  permission: PermissionKey
): boolean {
  if (!user || !user.isActive) return false;
  const allowedRoles = PERMISSIONS[permission] as readonly UserRole[];
  return allowedRoles.includes(user.role);
}

/**
 * Returns the list of document visibilities accessible to a user.
 */
export function getAccessibleVisibilities(user: User | null | undefined): DocumentVisibility[] {
  if (!user || !user.isActive) return [];

  switch (user.role) {
    case 'Admin':
      return ['PUBLIC', 'INTERNAL', 'RESTRICTED', 'ADMIN_ONLY'];
    case 'Manager':
      return ['PUBLIC', 'INTERNAL', 'RESTRICTED'];
    case 'Employee':
    default:
      return ['PUBLIC', 'INTERNAL'];
  }
}
