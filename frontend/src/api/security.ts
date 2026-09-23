import { apiClient, USE_MOCK_API } from './client';
import { AuditLog, LoginActivity, ApiActivity, SecurityAlert, DataAccessRecord, AlertStatus } from './types';
import {
  mockGetAuditLogs,
  mockGetLoginActivities,
  mockGetApiActivities,
  mockGetSecurityAlerts,
  mockUpdateAlertStatus,
  mockGetDataAccessRecords,
} from '../mocks/security.mock';

export async function getAuditLogs(): Promise<AuditLog[]> {
  if (USE_MOCK_API) {
    return mockGetAuditLogs();
  }
  return apiClient<AuditLog[]>('/admin/audit-logs');
}

export async function getLoginActivities(): Promise<LoginActivity[]> {
  if (USE_MOCK_API) {
    return mockGetLoginActivities();
  }
  return apiClient<LoginActivity[]>('/admin/login-activity');
}

export async function getApiActivities(): Promise<ApiActivity[]> {
  if (USE_MOCK_API) {
    return mockGetApiActivities();
  }
  return apiClient<ApiActivity[]>('/admin/api-activity');
}

export async function getSecurityAlerts(): Promise<SecurityAlert[]> {
  if (USE_MOCK_API) {
    return mockGetSecurityAlerts();
  }
  return apiClient<SecurityAlert[]>('/admin/security-alerts');
}

export async function updateAlertStatus(alertId: string, status: AlertStatus): Promise<SecurityAlert> {
  if (USE_MOCK_API) {
    return mockUpdateAlertStatus(alertId, status);
  }
  return apiClient<SecurityAlert>(`/admin/security-alerts/${alertId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getDataAccessRecords(): Promise<DataAccessRecord[]> {
  if (USE_MOCK_API) {
    return mockGetDataAccessRecords();
  }
  return apiClient<DataAccessRecord[]>('/admin/data-access');
}
