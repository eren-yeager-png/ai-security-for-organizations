// Domain Roles — strictly 3 fixed roles
export type UserRole = 'Admin' | 'Manager' | 'Employee';

// Document Visibility Model — strictly 4 access levels
export type DocumentVisibility = 'PUBLIC' | 'INTERNAL' | 'RESTRICTED' | 'ADMIN_ONLY';

// Document Processing Status
export type ProcessingStatus = 'Processing' | 'Ready' | 'Failed' | 'Restricted';

// Supported File Types
export type DocumentFileType = 'pdf' | 'csv' | 'url';

// User Entity
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  isAdmin: boolean;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

// Auth Tokens & Session
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number; // seconds
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// Document Entity
export interface DocumentItem {
  id: string;
  title: string;
  fileName: string;
  fileType: DocumentFileType;
  sizeBytes: number;
  visibility: DocumentVisibility;
  status: ProcessingStatus;
  department: string;
  folder?: string;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
  rawUrl?: string; // sensitive internal URL (never displayed raw with credentials)
  safeLabel: string; // presentation safe label
  summary?: string;
  tags: string[];
  pageCount?: number;
  rowCount?: number;
}

export interface DocumentUploadRequest {
  file: File;
  visibility: DocumentVisibility;
  department: string;
  folder?: string;
}

export interface UrlIngestionRequest {
  url: string;
  title: string;
  visibility: DocumentVisibility;
  department: string;
}

// AI Chat Citations
export interface CitationSource {
  id: string;
  documentId: string;
  title: string;
  safeLabel: string;
  pageNumber?: number;
  rowRange?: string;
  snippet: string;
  similarityScore: number;
  isRestrictedNotice?: boolean;
}

// Temporary Chat Analysis Upload
export interface TemporaryChatFile {
  id: string;
  name: string;
  size: number;
  type: 'pdf' | 'csv';
  status: 'uploading' | 'processing' | 'ready' | 'error';
  progress: number;
  errorMessage?: string;
}

// Chat Message
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  sources?: CitationSource[];
  isStreaming?: boolean;
  tempFiles?: TemporaryChatFile[];
}

// Conversation
export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessagePreview?: string;
}

// Admin Audit Log
export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  role: UserRole;
  action: string;
  resource: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  ipAddress: string;
  device: string;
  details?: string;
}

// Admin Login Activity
export interface LoginActivity {
  id: string;
  userId: string;
  userEmail: string;
  timestamp: string;
  result: 'SUCCESS' | 'FAILURE';
  device: string;
  ipAddress: string;
  location: string;
  authMethod: string;
  failureReason?: string;
}

// Admin API Activity
export interface ApiActivity {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  userEmail: string;
  timestamp: string;
  status: number;
  responseTimeMs: number;
  result: 'SUCCESS' | 'ERROR';
}

// Admin Security Alerts
export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertStatus = 'NEW' | 'INVESTIGATING' | 'RESOLVED';

export interface SecurityAlert {
  id: string;
  title: string;
  severity: AlertSeverity;
  status: AlertStatus;
  timestamp: string;
  description: string;
  sourceIp: string;
  affectedResource: string;
  assignedTo?: string;
}

// Admin Data Access History
export interface DataAccessRecord {
  id: string;
  timestamp: string;
  userEmail: string;
  role: UserRole;
  documentTitle: string;
  visibility: DocumentVisibility;
  action: 'QUERY' | 'VIEW' | 'DOWNLOAD' | 'SEARCH';
  ipAddress: string;
}

// Admin Analytics Overview
export interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  aiQueriesToday: number;
  documentCount: number;
  readyDocs: number;
  processingDocs: number;
  failedDocs: number;
  averageLatencyMs: number;
  queryVolumeTrend: { date: string; queries: number }[];
  visibilityDistribution: { visibility: DocumentVisibility; count: number }[];
  topSources: { title: string; count: number; visibility: DocumentVisibility }[];
  statusDistribution: { status: ProcessingStatus; count: number }[];
}

// Role Permissions Definition
export interface PermissionDefinition {
  id: string;
  key: string;
  label: string;
  description: string;
  category: 'Documents' | 'Chat' | 'Security' | 'Administration';
  admin: boolean;
  manager: boolean;
  employee: boolean;
}
