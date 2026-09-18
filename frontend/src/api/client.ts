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

// In-memory token storage (with localStorage backup for page refreshes)
const ACCESS_TOKEN_KEY = 'secure_ai_access_token';
const REFRESH_TOKEN_KEY = 'secure_ai_refresh_token';

export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function setStoredTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';

let onUnauthorizedCallback: (() => void) | null = null;

export function registerUnauthorizedHandler(callback: () => void) {
  onUnauthorizedCallback = callback;
}

/**
 * Core fetch wrapper with automatic JWT refresh and token recovery
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { accessToken, refreshToken } = getStoredTokens();
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
    response = await fetch(url, { ...options, headers });
  } catch {
    throw new ApiException('Network failure: Unable to reach backend server', 0);
  }

  // Handle Token Expiry & Automatic Refresh (401)
  if (response.status === 401 && refreshToken && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const newAccessToken = data.access_token || data.accessToken;
          const newRefreshToken = data.refresh_token || data.refreshToken || refreshToken;

          setStoredTokens(newAccessToken, newRefreshToken);
          onRefreshed(newAccessToken);
          isRefreshing = false;

          // Retry initial request with new access token
          headers.set('Authorization', `Bearer ${newAccessToken}`);
          const retriedResponse = await fetch(url, { ...options, headers });
          if (!retriedResponse.ok) {
            const errData = await retriedResponse.json().catch(() => ({}));
            throw new ApiException(
              errData.detail || errData.message || 'Request failed after refresh',
              retriedResponse.status
            );
          }
          return (await retriedResponse.json()) as T;
        } else {
          // Refresh failed
          clearStoredTokens();
          isRefreshing = false;
          if (onUnauthorizedCallback) onUnauthorizedCallback();
          throw new ApiException('Session expired. Please log in again.', 401);
        }
      } catch (err) {
        clearStoredTokens();
        isRefreshing = false;
        if (onUnauthorizedCallback) onUnauthorizedCallback();
        throw err;
      }
    } else {
      // Another request is already refreshing; queue this request
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh(async (newToken: string) => {
          try {
            headers.set('Authorization', `Bearer ${newToken}`);
            const retried = await fetch(url, { ...options, headers });
            if (!retried.ok) {
              const err = await retried.json().catch(() => ({}));
              reject(new ApiException(err.detail || 'Request failed', retried.status));
            } else {
              resolve((await retried.json()) as T);
            }
          } catch (e) {
            reject(e);
          }
        });
      });
    }
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
