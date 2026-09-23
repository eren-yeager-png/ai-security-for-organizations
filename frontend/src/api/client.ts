/**
 * Secure HTTP Client with automatic JWT refresh token cycle and error normalization.
 */

export interface ApiError {
  message: string;
  statusCode: number;
  details?: unknown;
}

export class ApiException extends Error implements ApiError {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
    this.details = details;
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

let onUnauthorizedCallback: (() => void) | null = null;

export function registerUnauthorizedHandler(callback: () => void) {
  onUnauthorizedCallback = callback;
}

/**
 * Core fetch wrapper with automatic JWT refresh and token recovery
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
  retryOnUnauthorized = true
): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers, credentials: 'include' });
  } catch {
    throw new ApiException('Network failure: Unable to reach backend server', 0);
  }

  // Handle Token Expiry & Automatic Refresh (401)
  const isAuthEndpoint = endpoint.includes('/api/v1/auth/login') || endpoint.includes('/api/v1/auth/refresh');
  if (response.status === 401 && retryOnUnauthorized && !isAuthEndpoint) {
    refreshPromise ??= refreshAccessToken();
    const newAccessToken = await refreshPromise;
    refreshPromise = null;

    if (newAccessToken) {
      return apiClient<T>(endpoint, options, false);
    }

    clearAccessToken();
    onUnauthorizedCallback?.();
    throw new ApiException('Session expired. Please log in again.', 401);
  }

  // Handle other error status codes
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody.detail ||
      errorBody.message ||
      (response.status === 403
        ? 'Access forbidden: You do not have permissions for this resource'
        : response.status === 404
        ? 'The requested resource was not found'
        : response.status === 429
        ? 'Rate limit exceeded. Please wait a moment.'
        : `Request failed with status ${response.status}`);

    throw new ApiException(message, response.status, errorBody);
  }

  // 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { access_token?: string };
    if (!data.access_token) return null;
    setAccessToken(data.access_token);
    return data.access_token;
  } catch {
    return null;
  }
}
