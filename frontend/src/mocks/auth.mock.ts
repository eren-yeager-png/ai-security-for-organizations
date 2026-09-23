import { User, AuthResponse, LoginRequest } from '../api/types';

export const MOCK_USERS: Record<string, User> = {
  admin: {
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
  manager: {
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
  employee: {
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
};

export async function mockLogin(req: LoginRequest): Promise<AuthResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 400));

  const emailLower = req.email.toLowerCase().trim();
  let user: User | undefined;

  if (emailLower.includes('admin')) {
    user = MOCK_USERS.admin;
  } else if (emailLower.includes('manager')) {
    user = MOCK_USERS.manager;
  } else {
    // Default or employee
    user = MOCK_USERS.employee;
  }

  return {
    user,
    tokens: {
      accessToken: `mock_jwt_access_${user.role.toLowerCase()}_${Date.now()}`,
      refreshToken: `mock_jwt_refresh_${user.role.toLowerCase()}_${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 3600,
    },
  };
}

export async function mockRefreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    accessToken: `mock_jwt_refreshed_${Date.now()}`,
    refreshToken: refreshToken || `mock_jwt_refresh_${Date.now()}`,
  };
}
