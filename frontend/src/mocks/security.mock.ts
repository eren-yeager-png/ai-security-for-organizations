import { AuditLog, LoginActivity, ApiActivity, SecurityAlert, DataAccessRecord, AlertStatus } from '../api/types';

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_01',
    timestamp: '2026-09-16T08:15:20Z',
    userId: 'usr_admin_01',
    userEmail: 'admin@enterprise.ai',
    role: 'Admin',
    action: 'ROLE_UPDATE',
    resource: 'User: david.kim@enterprise.ai',
    result: 'SUCCESS',
    ipAddress: '192.168.10.45',
    device: 'macOS Chrome 134',
    details: 'Promoted user from Employee to Manager role',
  },
  {
    id: 'aud_02',
    timestamp: '2026-09-16T08:02:10Z',
    userId: 'usr_employee_03',
    userEmail: 'employee@enterprise.ai',
    role: 'Employee',
    action: 'DOCUMENT_ACCESS_ATTEMPT',
    resource: 'Doc: Q3_Financial_Audit_Confidential.pdf',
    result: 'DENIED',
    ipAddress: '10.0.4.112',
    device: 'Windows 11 Edge 132',
    details: 'RBAC boundary enforced: Employee account attempted direct restricted query',
  },
  {
    id: 'aud_03',
    timestamp: '2026-09-16T07:48:55Z',
    userId: 'usr_manager_02',
    userEmail: 'manager@enterprise.ai',
    role: 'Manager',
    action: 'DOCUMENT_UPLOAD',
    resource: 'Doc: Engineering_Runbook_v4.pdf',
    result: 'SUCCESS',
    ipAddress: '172.16.20.15',
    device: 'Linux Firefox 135',
    details: 'Uploaded 4.2 MB internal technical documentation',
  },
  {
    id: 'aud_04',
    timestamp: '2026-09-16T06:30:12Z',
    userId: 'usr_admin_01',
    userEmail: 'admin@enterprise.ai',
    role: 'Admin',
    action: 'SECURITY_POLICY_UPDATE',
    resource: 'Policy: Zero-Trust Password Policy',
    result: 'SUCCESS',
    ipAddress: '192.168.10.45',
    device: 'macOS Chrome 134',
    details: 'Enforced 16-character minimum complexity standard',
  },
  {
    id: 'aud_05',
    timestamp: '2026-09-15T22:14:02Z',
    userId: 'usr_unknown',
    userEmail: 'attacker@external-scanner.xyz',
    role: 'Employee',
    action: 'AUTH_BRUTE_FORCE_TRIGGERED',
    resource: 'Endpoint: /auth/login',
    result: 'FAILURE',
    ipAddress: '198.51.100.87',
    device: 'Python-requests/2.31.0',
    details: 'Rate limiting barrier triggered after 10 consecutive failed attempts',
  },
];

export const INITIAL_LOGIN_ACTIVITIES: LoginActivity[] = [
  {
    id: 'log_01',
    userId: 'usr_admin_01',
    userEmail: 'admin@enterprise.ai',
    timestamp: '2026-09-16T08:15:00Z',
    result: 'SUCCESS',
    device: 'MacBook Pro (macOS 15.2)',
    ipAddress: '192.168.10.45',
    location: 'San Francisco, US',
    authMethod: 'Hardware FIDO2 Security Key',
  },
  {
    id: 'log_02',
    userId: 'usr_manager_02',
    userEmail: 'manager@enterprise.ai',
    timestamp: '2026-09-16T07:45:00Z',
    result: 'SUCCESS',
    device: 'ThinkPad X1 (Ubuntu 24.04)',
    ipAddress: '172.16.20.15',
    location: 'Austin, US',
    authMethod: 'Password + TOTP MFA',
  },
  {
    id: 'log_03',
    userId: 'usr_employee_03',
    userEmail: 'employee@enterprise.ai',
    timestamp: '2026-09-16T08:30:00Z',
    result: 'SUCCESS',
    device: 'Dell Latitude (Windows 11)',
    ipAddress: '10.0.4.112',
    location: 'New York, US',
    authMethod: 'Password + TOTP MFA',
  },
  {
    id: 'log_04',
    userId: 'usr_user_07',
    userEmail: 'elena.rostova@enterprise.ai',
    timestamp: '2026-09-16T05:22:18Z',
    result: 'FAILURE',
    device: 'Chrome on Android',
    ipAddress: '203.0.113.44',
    location: 'London, UK',
    authMethod: 'Password',
    failureReason: 'Account currently suspended by administrator',
  },
  {
    id: 'log_05',
    userId: 'usr_unknown',
    userEmail: 'root@enterprise.ai',
    timestamp: '2026-09-16T04:10:02Z',
    result: 'FAILURE',
    device: 'Curl / Automated Script',
    ipAddress: '198.51.100.87',
    location: 'Unknown Proxy',
    authMethod: 'Password',
    failureReason: 'Invalid user credentials',
  },
];

export const INITIAL_API_ACTIVITIES: ApiActivity[] = [
  {
    id: 'api_01',
    endpoint: '/api/v1/chat/completions',
    method: 'POST',
    userEmail: 'employee@enterprise.ai',
    timestamp: '2026-09-16T08:31:05Z',
    status: 200,
    responseTimeMs: 340,
    result: 'SUCCESS',
  },
  {
    id: 'api_02',
    endpoint: '/api/v1/documents/query',
    method: 'POST',
    userEmail: 'manager@enterprise.ai',
    timestamp: '2026-09-16T08:28:44Z',
    status: 200,
    responseTimeMs: 185,
    result: 'SUCCESS',
  },
  {
    id: 'api_03',
    endpoint: '/api/v1/admin/users/role',
    method: 'PUT',
    userEmail: 'admin@enterprise.ai',
    timestamp: '2026-09-16T08:15:20Z',
    status: 200,
    responseTimeMs: 95,
    result: 'SUCCESS',
  },
  {
    id: 'api_04',
    endpoint: '/api/v1/documents/doc_res_01',
    method: 'GET',
    userEmail: 'employee@enterprise.ai',
    timestamp: '2026-09-16T08:02:10Z',
    status: 403,
    responseTimeMs: 25,
    result: 'ERROR',
  },
  {
    id: 'api_05',
    endpoint: '/api/v1/documents/upload',
    method: 'POST',
    userEmail: 'manager@enterprise.ai',
    timestamp: '2026-09-16T07:48:55Z',
    status: 201,
    responseTimeMs: 820,
    result: 'SUCCESS',
  },
];

export const INITIAL_SECURITY_ALERTS: SecurityAlert[] = [
  {
    id: 'alt_01',
    title: 'Restricted Document Access Anomalous Spike',
    severity: 'HIGH',
    status: 'NEW',
    timestamp: '2026-09-16T08:05:00Z',
    description: 'Multiple unauthorized access attempts detected for confidential Q3 M&A dossiers from IP 10.0.4.112.',
    sourceIp: '10.0.4.112',
    affectedResource: 'Document: Project_Titan_Due_Diligence.pdf',
  },
  {
    id: 'alt_02',
    title: 'Credential Leak Prevention Filter Triggered',
    severity: 'CRITICAL',
    status: 'INVESTIGATING',
    timestamp: '2026-09-16T06:12:00Z',
    description: 'AI Query input intercepted containing plaintext database credentials. URL and token masker successfully sanitized payload.',
    sourceIp: '172.16.20.15',
    affectedResource: 'Chat Ingestion Sanitizer',
    assignedTo: 'admin@enterprise.ai',
  },
  {
    id: 'alt_03',
    title: 'External Brute-Force Rate Limiting Active',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    timestamp: '2026-09-15T22:15:00Z',
    description: 'Automated IP blacklist engaged after 10 invalid login attempts within 60 seconds.',
    sourceIp: '198.51.100.87',
    affectedResource: 'Auth Gateway /auth/login',
  },
];

export const INITIAL_DATA_ACCESS_RECORDS: DataAccessRecord[] = [
  {
    id: 'da_01',
    timestamp: '2026-09-16T08:31:05Z',
    userEmail: 'employee@enterprise.ai',
    role: 'Employee',
    documentTitle: 'Employee Benefits & Remote Work Playbook.pdf',
    visibility: 'INTERNAL',
    action: 'QUERY',
    ipAddress: '10.0.4.112',
  },
  {
    id: 'da_02',
    timestamp: '2026-09-16T08:28:44Z',
    userEmail: 'manager@enterprise.ai',
    role: 'Manager',
    documentTitle: 'Q3 Financial Audit & Executive Revenue Projections.pdf',
    visibility: 'RESTRICTED',
    action: 'QUERY',
    ipAddress: '172.16.20.15',
  },
  {
    id: 'da_03',
    timestamp: '2026-09-16T08:10:12Z',
    userEmail: 'admin@enterprise.ai',
    role: 'Admin',
    documentTitle: 'Root Infrastructure Keys & Vault Recovery Blueprint.pdf',
    visibility: 'ADMIN_ONLY',
    action: 'VIEW',
    ipAddress: '192.168.10.45',
  },
  {
    id: 'da_04',
    timestamp: '2026-09-16T07:55:30Z',
    userEmail: 'manager@enterprise.ai',
    role: 'Manager',
    documentTitle: 'Engineering Deployment Runbook & CI/CD Pipeline.pdf',
    visibility: 'INTERNAL',
    action: 'DOWNLOAD',
    ipAddress: '172.16.20.15',
  },
];

let alertsStore = [...INITIAL_SECURITY_ALERTS];

export async function mockGetAuditLogs(): Promise<AuditLog[]> {
  await new Promise((r) => setTimeout(r, 200));
  return [...INITIAL_AUDIT_LOGS];
}

export async function mockGetLoginActivities(): Promise<LoginActivity[]> {
  await new Promise((r) => setTimeout(r, 200));
  return [...INITIAL_LOGIN_ACTIVITIES];
}

export async function mockGetApiActivities(): Promise<ApiActivity[]> {
  await new Promise((r) => setTimeout(r, 200));
  return [...INITIAL_API_ACTIVITIES];
}

export async function mockGetSecurityAlerts(): Promise<SecurityAlert[]> {
  await new Promise((r) => setTimeout(r, 200));
  return [...alertsStore];
}

export async function mockUpdateAlertStatus(alertId: string, status: AlertStatus): Promise<SecurityAlert> {
  await new Promise((r) => setTimeout(r, 200));
  const alert = alertsStore.find((a) => a.id === alertId);
  if (!alert) throw new Error('Alert not found');
  alert.status = status;
  return { ...alert };
}

export async function mockGetDataAccessRecords(): Promise<DataAccessRecord[]> {
  await new Promise((r) => setTimeout(r, 200));
  return [...INITIAL_DATA_ACCESS_RECORDS];
}
