import { describe, it, expect } from 'vitest';
import { canAccessDocument, hasRole, hasPermission, getAccessibleVisibilities } from '../security/rbac';
import { User } from '../api/types';

describe('RBAC Security & Clearance Engine', () => {
  const employeeUser: User = {
    id: 'emp_01',
    name: 'Sarah Jenkins',
    email: 'sarah@enterprise.ai',
    role: 'Employee',
    department: 'Support',
    isActive: true,
    isAdmin: false,
    createdAt: '2026-01-01',
  };

  const managerUser: User = {
    id: 'mgr_01',
    name: 'Marcus Chen',
    email: 'marcus@enterprise.ai',
    role: 'Manager',
    department: 'Engineering',
    isActive: true,
    isAdmin: false,
    createdAt: '2026-01-01',
  };

  const adminUser: User = {
    id: 'adm_01',
    name: 'Eleanor Vance',
    email: 'eleanor@enterprise.ai',
    role: 'Admin',
    department: 'Security',
    isActive: true,
    isAdmin: true,
    createdAt: '2026-01-01',
  };

  const suspendedUser: User = {
    ...employeeUser,
    id: 'susp_01',
    isActive: false,
  };

  describe('canAccessDocument() visibility matrix', () => {
    it('allows Employee to access PUBLIC and INTERNAL documents only', () => {
      expect(canAccessDocument(employeeUser, 'PUBLIC')).toBe(true);
      expect(canAccessDocument(employeeUser, 'INTERNAL')).toBe(true);
      expect(canAccessDocument(employeeUser, 'RESTRICTED')).toBe(false);
      expect(canAccessDocument(employeeUser, 'ADMIN_ONLY')).toBe(false);
    });

    it('allows Manager to access PUBLIC, INTERNAL, and RESTRICTED documents', () => {
      expect(canAccessDocument(managerUser, 'PUBLIC')).toBe(true);
      expect(canAccessDocument(managerUser, 'INTERNAL')).toBe(true);
      expect(canAccessDocument(managerUser, 'RESTRICTED')).toBe(true);
      expect(canAccessDocument(managerUser, 'ADMIN_ONLY')).toBe(false);
    });

    it('allows Admin to access all four visibility tiers', () => {
      expect(canAccessDocument(adminUser, 'PUBLIC')).toBe(true);
      expect(canAccessDocument(adminUser, 'INTERNAL')).toBe(true);
      expect(canAccessDocument(adminUser, 'RESTRICTED')).toBe(true);
      expect(canAccessDocument(adminUser, 'ADMIN_ONLY')).toBe(true);
    });

    it('denies access to inactive/suspended accounts regardless of role', () => {
      expect(canAccessDocument(suspendedUser, 'PUBLIC')).toBe(false);
      expect(canAccessDocument(suspendedUser, 'INTERNAL')).toBe(false);
    });

    it('denies access if user is null or undefined', () => {
      expect(canAccessDocument(null, 'PUBLIC')).toBe(false);
      expect(canAccessDocument(undefined, 'PUBLIC')).toBe(false);
    });
  });

  describe('hasRole() and role checking', () => {
    it('correctly matches exact role or array of allowed roles', () => {
      expect(hasRole(employeeUser, 'Employee')).toBe(true);
      expect(hasRole(employeeUser, 'Admin')).toBe(false);
      expect(hasRole(managerUser, ['Manager', 'Admin'])).toBe(true);
      expect(hasRole(employeeUser, ['Manager', 'Admin'])).toBe(false);
    });
  });

  describe('hasPermission() matrix', () => {
    it('grants administrative panel access only to Admin', () => {
      expect(hasPermission(adminUser, 'ADMIN_ACCESS_PANEL')).toBe(true);
      expect(hasPermission(managerUser, 'ADMIN_ACCESS_PANEL')).toBe(false);
      expect(hasPermission(employeeUser, 'ADMIN_ACCESS_PANEL')).toBe(false);
    });

    it('grants document upload capability only to Manager and Admin', () => {
      expect(hasPermission(adminUser, 'DOCUMENTS_UPLOAD')).toBe(true);
      expect(hasPermission(managerUser, 'DOCUMENTS_UPLOAD')).toBe(true);
      expect(hasPermission(employeeUser, 'DOCUMENTS_UPLOAD')).toBe(false);
    });

    it('grants document delete capability strictly to Admin', () => {
      expect(hasPermission(adminUser, 'DOCUMENTS_DELETE')).toBe(true);
      expect(hasPermission(managerUser, 'DOCUMENTS_DELETE')).toBe(false);
      expect(hasPermission(employeeUser, 'DOCUMENTS_DELETE')).toBe(false);
    });
  });

  describe('getAccessibleVisibilities()', () => {
    it('returns appropriate visibility lists for each tier', () => {
      expect(getAccessibleVisibilities(employeeUser)).toEqual(['PUBLIC', 'INTERNAL']);
      expect(getAccessibleVisibilities(managerUser)).toEqual(['PUBLIC', 'INTERNAL', 'RESTRICTED']);
      expect(getAccessibleVisibilities(adminUser)).toEqual(['PUBLIC', 'INTERNAL', 'RESTRICTED', 'ADMIN_ONLY']);
    });
  });
});
