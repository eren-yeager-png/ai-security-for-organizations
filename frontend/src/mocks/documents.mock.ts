import { DocumentItem, DocumentVisibility, ProcessingStatus } from '../api/types';
import { getSafeSourceLabel } from '../security/urlMasker';

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  // PUBLIC
  {
    id: 'doc_pub_01',
    title: 'Enterprise Code of Conduct & Ethics',
    fileName: 'Enterprise_Code_of_Conduct_2026.pdf',
    fileType: 'pdf',
    sizeBytes: 1420000,
    visibility: 'PUBLIC',
    status: 'Ready',
    department: 'People & Culture',
    folder: 'General Policies',
    uploadedBy: 'admin@enterprise.ai',
    uploadedAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-01T14:30:00Z',
    safeLabel: 'Enterprise Code of Conduct 2026',
    summary: 'Comprehensive ethical guidelines, diversity policies, and workplace conduct expectations.',
    tags: ['compliance', 'ethics', 'hr'],
    pageCount: 24,
  },
  {
    id: 'doc_pub_02',
    title: 'Public API Documentation & Integration Guide',
    fileName: 'Public_API_Specification_v2.pdf',
    fileType: 'pdf',
    sizeBytes: 2850000,
    visibility: 'PUBLIC',
    status: 'Ready',
    department: 'Engineering',
    folder: 'Technical Docs',
    uploadedBy: 'manager@enterprise.ai',
    uploadedAt: '2026-02-10T11:20:00Z',
    updatedAt: '2026-02-10T11:20:00Z',
    safeLabel: 'Public API Specification v2',
    summary: 'Public REST and Webhook API contracts, rate limit definitions, and integration samples.',
    tags: ['api', 'developer', 'integration'],
    pageCount: 48,
  },
  {
    id: 'doc_pub_03',
    title: 'Global Privacy Notice & GDPR Overview',
    fileName: 'Global_Privacy_Notice.pdf',
    fileType: 'pdf',
    sizeBytes: 980000,
    visibility: 'PUBLIC',
    status: 'Ready',
    department: 'Legal & Privacy',
    folder: 'General Policies',
    uploadedBy: 'admin@enterprise.ai',
    uploadedAt: '2026-01-20T09:15:00Z',
    updatedAt: '2026-01-20T09:15:00Z',
    safeLabel: 'Global Privacy Notice',
    summary: 'Official data subject rights, consent handling, and privacy policies.',
    tags: ['privacy', 'gdpr', 'legal'],
    pageCount: 16,
  },

  // INTERNAL
  {
    id: 'doc_int_01',
    title: 'Internal IT Security & Password Standards',
    fileName: 'Internal_IT_Security_Standards.pdf',
    fileType: 'pdf',
    sizeBytes: 1850000,
    visibility: 'INTERNAL',
    status: 'Ready',
    department: 'Information Security',
    folder: 'Security Standards',
    uploadedBy: 'admin@enterprise.ai',
    uploadedAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-05T16:00:00Z',
    safeLabel: 'Internal IT Security Standards',
    summary: 'Multi-factor authentication requirements, session timeouts, and corporate VPN access protocols.',
    tags: ['security', 'it', 'passwords'],
    pageCount: 32,
  },
  {
    id: 'doc_int_02',
    title: 'Employee Benefits & Remote Work Playbook',
    fileName: 'Employee_Benefits_2026.pdf',
    fileType: 'pdf',
    sizeBytes: 3100000,
    visibility: 'INTERNAL',
    status: 'Ready',
    department: 'People & Culture',
    folder: 'General Policies',
    uploadedBy: 'manager@enterprise.ai',
    uploadedAt: '2026-02-18T14:45:00Z',
    updatedAt: '2026-02-18T14:45:00Z',
    safeLabel: 'Employee Benefits 2026',
    summary: 'Healthcare, wellness stipends, parental leave, and remote equipment reimbursement guidelines.',
    tags: ['benefits', 'hr', 'remote'],
    pageCount: 40,
  },
  {
    id: 'doc_int_03',
    title: 'Engineering Deployment Runbook & CI/CD Pipeline',
    fileName: 'Engineering_Runbook_v4.pdf',
    fileType: 'pdf',
    sizeBytes: 4200000,
    visibility: 'INTERNAL',
    status: 'Ready',
    department: 'Engineering',
    folder: 'Technical Docs',
    uploadedBy: 'manager@enterprise.ai',
    uploadedAt: '2026-02-25T13:10:00Z',
    updatedAt: '2026-03-10T10:00:00Z',
    safeLabel: 'Engineering Runbook v4',
    summary: 'Production release procedures, rollback strategies, canary analysis, and monitoring checklists.',
    tags: ['devops', 'deployment', 'engineering'],
    pageCount: 54,
  },
  {
    id: 'doc_int_04',
    title: 'Corporate Wiki & Knowledge Index',
    fileName: 'wiki_portal_sync',
    fileType: 'url',
    sizeBytes: 520000,
    visibility: 'INTERNAL',
    status: 'Processing',
    department: 'Operations',
    folder: 'External Sources',
    uploadedBy: 'manager@enterprise.ai',
    uploadedAt: '2026-09-16T06:00:00Z',
    updatedAt: '2026-09-16T06:00:00Z',
    rawUrl: 'https://internal-wiki.corp.net/spaces/all',
    safeLabel: 'Internal Wiki Knowledge Hub',
    summary: 'Continuous synchronization of internal documentation pages.',
    tags: ['wiki', 'operations', 'sync'],
  },

  // RESTRICTED / PRIVATE (Manager & Admin only)
  {
    id: 'doc_res_01',
    title: 'Q3 Financial Audit & Executive Revenue Projections',
    fileName: 'Q3_Financial_Audit_Confidential.pdf',
    fileType: 'pdf',
    sizeBytes: 5600000,
    visibility: 'RESTRICTED',
    status: 'Ready',
    department: 'Finance & Strategy',
    folder: 'Financials',
    uploadedBy: 'manager@enterprise.ai',
    uploadedAt: '2026-08-30T17:00:00Z',
    updatedAt: '2026-09-02T11:30:00Z',
    safeLabel: 'Q3 Financial Audit (Confidential)',
    summary: 'Executive P&L statements, burn rate forecasts, margin analysis, and board financial decks.',
    tags: ['finance', 'restricted', 'audit'],
    pageCount: 78,
  },
  {
    id: 'doc_res_02',
    title: 'Customer Data Retention & M&A Due Diligence',
    fileName: 'Project_Titan_Due_Diligence.pdf',
    fileType: 'pdf',
    sizeBytes: 8900000,
    visibility: 'RESTRICTED',
    status: 'Ready',
    department: 'Executive Legal',
    folder: 'M&A',
    uploadedBy: 'admin@enterprise.ai',
    uploadedAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-05T15:40:00Z',
    safeLabel: 'Project Titan M&A Due Diligence',
    summary: 'Merger acquisition risk assessment, proprietary IP inventory, and liabilities breakdown.',
    tags: ['mergers', 'legal', 'restricted'],
    pageCount: 112,
  },
  {
    id: 'doc_res_03',
    title: 'Q3 Sales Compensation & Incentive Plans',
    fileName: 'Sales_Compensation_Tiers_2026.csv',
    fileType: 'csv',
    sizeBytes: 640000,
    visibility: 'RESTRICTED',
    status: 'Failed',
    department: 'Sales Operations',
    folder: 'Financials',
    uploadedBy: 'manager@enterprise.ai',
    uploadedAt: '2026-09-14T12:00:00Z',
    updatedAt: '2026-09-14T12:05:00Z',
    safeLabel: 'Sales Compensation Tiers 2026',
    summary: 'Tabular matrix of quotas, commission rates, and accelerator payout thresholds. Ingestion failed due to delimiter syntax.',
    tags: ['sales', 'compensation', 'restricted'],
    rowCount: 240,
  },

  // ADMIN-ONLY (Admin only)
  {
    id: 'doc_adm_01',
    title: 'Root Infrastructure Keys & Vault Recovery Blueprint',
    fileName: 'Root_Vault_Disaster_Recovery.pdf',
    fileType: 'pdf',
    sizeBytes: 1200000,
    visibility: 'ADMIN_ONLY',
    status: 'Ready',
    department: 'Information Security',
    folder: 'Infrastructure Keys',
    uploadedBy: 'admin@enterprise.ai',
    uploadedAt: '2026-01-05T12:00:00Z',
    updatedAt: '2026-09-10T14:00:00Z',
    safeLabel: 'Root Vault & Disaster Recovery Blueprint',
    summary: 'Shamir secret sharing schema, emergency HSM revocation procedures, and master KMS key ceremonies.',
    tags: ['vault', 'admin-only', 'kms', 'security'],
    pageCount: 18,
  },
  {
    id: 'doc_adm_02',
    title: 'Security Vulnerability Assessment & Pen-Test Report',
    fileName: 'PenTest_RedTeam_Q2_2026.pdf',
    fileType: 'pdf',
    sizeBytes: 4800000,
    visibility: 'ADMIN_ONLY',
    status: 'Ready',
    department: 'Information Security',
    folder: 'Security Audits',
    uploadedBy: 'admin@enterprise.ai',
    uploadedAt: '2026-07-20T16:00:00Z',
    updatedAt: '2026-07-20T16:00:00Z',
    safeLabel: 'Red Team Penetration Testing Report Q2',
    summary: 'Zero-day attack surface analysis, perimeter findings, and patch remediation verification.',
    tags: ['pentest', 'redteam', 'admin-only'],
    pageCount: 64,
  },
  {
    id: 'doc_adm_03',
    title: 'Secure Database Admin Gateway Sync',
    fileName: 'internal_db_gateway',
    fileType: 'url',
    sizeBytes: 310000,
    visibility: 'ADMIN_ONLY',
    status: 'Ready',
    department: 'Infrastructure',
    folder: 'Infrastructure Keys',
    uploadedBy: 'admin@enterprise.ai',
    uploadedAt: '2026-08-11T10:00:00Z',
    updatedAt: '2026-08-11T10:00:00Z',
    rawUrl: 'https://db_admin:K9x#vL291z@db-gateway.internal.corp/secure-docs',
    safeLabel: 'Protected Database Admin Source',
    summary: 'Ingested technical schemas from internal secured database metadata portal.',
    tags: ['database', 'admin-only', 'gateway'],
  },
];

let documentsStore = [...INITIAL_DOCUMENTS];

export async function mockGetDocuments(params?: {
  search?: string;
  visibility?: DocumentVisibility;
  status?: ProcessingStatus;
  department?: string;
}): Promise<DocumentItem[]> {
  await new Promise((r) => setTimeout(r, 250));

  return documentsStore.filter((doc) => {
    if (params?.search) {
      const q = params.search.toLowerCase();
      const match =
        doc.title.toLowerCase().includes(q) ||
        doc.fileName.toLowerCase().includes(q) ||
        doc.tags.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (params?.visibility && doc.visibility !== params.visibility) {
      return false;
    }
    if (params?.status && doc.status !== params.status) {
      return false;
    }
    if (params?.department && doc.department !== params.department) {
      return false;
    }
    return true;
  });
}

export async function mockUploadDocument(
  file: File,
  visibility: DocumentVisibility,
  department: string,
  folder?: string
): Promise<DocumentItem> {
  await new Promise((r) => setTimeout(r, 600));

  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
  const fileType = ext === 'csv' ? 'csv' : 'pdf';

  const newDoc: DocumentItem = {
    id: `doc_${Date.now()}`,
    title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
    fileName: file.name,
    fileType,
    sizeBytes: file.size,
    visibility,
    status: 'Ready',
    department: department || 'General',
    folder: folder || 'Uploaded',
    uploadedBy: 'current.user@enterprise.ai',
    uploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    safeLabel: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
    summary: `Uploaded document ${file.name} ready for semantic AI search.`,
    tags: ['uploaded', fileType],
  };

  documentsStore = [newDoc, ...documentsStore];
  return newDoc;
}

export async function mockIngestUrl(
  url: string,
  title: string,
  visibility: DocumentVisibility,
  department: string
): Promise<DocumentItem> {
  await new Promise((r) => setTimeout(r, 500));

  const safeLabel = getSafeSourceLabel({ title, rawUrl: url, fileType: 'url' });

  const newDoc: DocumentItem = {
    id: `doc_url_${Date.now()}`,
    title: title || safeLabel,
    fileName: 'url_resource_index',
    fileType: 'url',
    sizeBytes: 150000,
    visibility,
    status: 'Ready',
    department: department || 'General',
    folder: 'URL Ingestions',
    uploadedBy: 'current.user@enterprise.ai',
    uploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rawUrl: url,
    safeLabel,
    summary: `Ingested online knowledge resource: ${safeLabel}`,
    tags: ['url', 'web-source'],
  };

  documentsStore = [newDoc, ...documentsStore];
  return newDoc;
}

export async function mockDeleteDocument(id: string): Promise<{ success: boolean }> {
  await new Promise((r) => setTimeout(r, 300));
  documentsStore = documentsStore.filter((d) => d.id !== id);
  return { success: true };
}

export async function mockRetryProcessing(id: string): Promise<DocumentItem> {
  await new Promise((r) => setTimeout(r, 400));
  const doc = documentsStore.find((d) => d.id === id);
  if (!doc) throw new Error('Document not found');

  doc.status = 'Ready';
  doc.updatedAt = new Date().toISOString();
  return { ...doc };
}
