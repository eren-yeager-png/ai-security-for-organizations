import { apiClient, USE_MOCK_API } from './client';
import { DocumentItem, DocumentUploadRequest, UrlIngestionRequest, DocumentVisibility, ProcessingStatus } from './types';
import {
  mockGetDocuments,
  mockUploadDocument,
  mockIngestUrl,
  mockDeleteDocument,
  mockRetryProcessing,
} from '../mocks/documents.mock';

export async function getDocuments(params?: {
  search?: string;
  visibility?: DocumentVisibility;
  status?: ProcessingStatus;
  department?: string;
}): Promise<DocumentItem[]> {
  if (USE_MOCK_API) {
    return mockGetDocuments(params);
  }

  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.visibility) query.set('visibility', params.visibility);
  if (params?.status) query.set('status', params.status);
  if (params?.department) query.set('department', params.department);

  const qs = query.toString();
  return apiClient<DocumentItem[]>(`/documents${qs ? `?${qs}` : ''}`);
}

export async function uploadDocument(req: DocumentUploadRequest): Promise<DocumentItem> {
  if (USE_MOCK_API) {
    return mockUploadDocument(req.file, req.visibility, req.department, req.folder);
  }

  const formData = new FormData();
  formData.append('file', req.file);
  formData.append('visibility', req.visibility);
  formData.append('department', req.department);
  if (req.folder) formData.append('folder', req.folder);

  return apiClient<DocumentItem>('/documents/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function ingestUrl(req: UrlIngestionRequest): Promise<DocumentItem> {
  if (USE_MOCK_API) {
    return mockIngestUrl(req.url, req.title, req.visibility, req.department);
  }

  return apiClient<DocumentItem>('/documents/url', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export async function deleteDocument(id: string): Promise<{ success: boolean }> {
  if (USE_MOCK_API) {
    return mockDeleteDocument(id);
  }

  return apiClient<{ success: boolean }>(`/documents/${id}`, {
    method: 'DELETE',
  });
}

export async function retryProcessing(id: string): Promise<DocumentItem> {
  if (USE_MOCK_API) {
    return mockRetryProcessing(id);
  }

  return apiClient<DocumentItem>(`/documents/${id}/retry`, {
    method: 'POST',
  });
}
