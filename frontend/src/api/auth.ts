import { apiClient, USE_MOCK_API, setStoredTokens, clearStoredTokens, getStoredTokens } from './client';
import { AuthResponse, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest, User } from './types';
import { mockLogin, mockRefreshToken, MOCK_USERS } from '../mocks/auth.mock';

export async function login(req: LoginRequest): Promise<AuthResponse> {
  if (USE_MOCK_API) {
    const res = await mockLogin(req);
    setStoredTokens(res.tokens.accessToken, res.tokens.refreshToken);
    return res;
  }

  // Live FastAPI contract
  const formData = new URLSearchParams();
  formData.append('username', req.email);
  formData.append('password', req.password);

  const res = await apiClient<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: User;
  }>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  const authResponse: AuthResponse = {
    user: res.user,
    tokens: {
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      tokenType: res.token_type || 'Bearer',
      expiresIn: 3600,
    },
  };

  setStoredTokens(authResponse.tokens.accessToken, authResponse.tokens.refreshToken);
  return authResponse;
}

export async function getCurrentUser(): Promise<User | null> {
  const { accessToken } = getStoredTokens();
  if (!accessToken) return null;

  if (USE_MOCK_API) {
    if (accessToken.includes('admin')) return MOCK_USERS.admin;
    if (accessToken.includes('manager')) return MOCK_USERS.manager;
    return MOCK_USERS.employee;
  }

  return apiClient<User>('/users/me');
}

export async function refreshSession(): Promise<string> {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) throw new Error('No refresh token available');

  if (USE_MOCK_API) {
    const res = await mockRefreshToken(refreshToken);
    setStoredTokens(res.accessToken, res.refreshToken);
    return res.accessToken;
  }

  const res = await apiClient<{ access_token: string; refresh_token?: string }>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  setStoredTokens(res.access_token, res.refresh_token || refreshToken);
  return res.access_token;
}

export async function logout(): Promise<void> {
  if (!USE_MOCK_API) {
    await apiClient('/auth/logout', { method: 'POST' }).catch(() => {});
  }
  clearStoredTokens();
}

export async function forgotPassword(req: ForgotPasswordRequest): Promise<{ message: string }> {
  if (USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 400));
    return { message: `Password reset link has been dispatched to ${req.email}` };
  }

  return apiClient<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export async function resetPassword(req: ResetPasswordRequest): Promise<{ message: string }> {
  if (USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 400));
    return { message: 'Password has been updated successfully.' };
  }

  return apiClient<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}
