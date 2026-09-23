import { apiClient, clearAccessToken, getAccessToken, setAccessToken } from './client';
import { ForgotPasswordRequest, LoginRequest, ResetPasswordRequest, User } from './types';

interface BackendUser {
  id: number;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface BackendTokenResponse {
  access_token: string;
  token_type: string;
}

function mapUser(user: BackendUser): User {
  const role = (user.role[0].toUpperCase() + user.role.slice(1)) as User['role'];
  return {
    id: String(user.id),
    email: user.email,
    name: user.email,
    role,
    department: '',
    isActive: user.is_active,
    isAdmin: user.role === 'admin',
    createdAt: user.created_at,
    lastLogin: user.last_login_at ?? undefined,
  };
}

export async function login(req: LoginRequest): Promise<BackendTokenResponse> {
  const res = await apiClient<BackendTokenResponse>('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: req.email, password: req.password }),
  }, false);
  setAccessToken(res.access_token);
  return res;
}

export async function getCurrentUser(): Promise<User | null> {
  if (!getAccessToken()) return null;
  const user = await apiClient<BackendUser>('/api/v1/auth/me');
  return mapUser(user);
}

export async function refreshSession(): Promise<string> {
  const res = await apiClient<BackendTokenResponse>('/api/v1/auth/refresh', {
    method: 'POST',
  }, false);
  setAccessToken(res.access_token);
  return res.access_token;
}

export async function logout(): Promise<void> {
  try {
    await apiClient('/api/v1/auth/logout', { method: 'POST' }, false);
  } finally {
    clearAccessToken();
  }
}

export async function forgotPassword(req: ForgotPasswordRequest): Promise<{ message: string }> {
  const response = await apiClient<{ detail?: string; message?: string }>('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(req),
  }, false);
  return { message: response.message ?? response.detail ?? 'If the account exists, reset instructions have been sent' };
}

export async function resetPassword(req: ResetPasswordRequest): Promise<{ message: string }> {
  const response = await apiClient<{ detail?: string; message?: string }>('/api/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: req.token, password: req.newPassword }),
  }, false);
  return { message: response.message ?? response.detail ?? 'Password has been updated successfully.' };
}
