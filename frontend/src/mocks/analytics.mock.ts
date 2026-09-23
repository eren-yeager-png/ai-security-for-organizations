import { AnalyticsData } from '../api/types';

export const INITIAL_ANALYTICS: AnalyticsData = {
  totalUsers: 248,
  activeUsers: 184,
  aiQueriesToday: 1420,
  documentCount: 68,
  readyDocs: 62,
  processingDocs: 4,
  failedDocs: 2,
  averageLatencyMs: 245,
  queryVolumeTrend: [
    { date: 'Sep 10', queries: 820 },
    { date: 'Sep 11', queries: 940 },
    { date: 'Sep 12', queries: 1120 },
    { date: 'Sep 13', queries: 1050 },
    { date: 'Sep 14', queries: 1290 },
    { date: 'Sep 15', queries: 1380 },
    { date: 'Sep 16', queries: 1420 },
  ],
  visibilityDistribution: [
    { visibility: 'PUBLIC', count: 24 },
    { visibility: 'INTERNAL', count: 28 },
    { visibility: 'RESTRICTED', count: 11 },
    { visibility: 'ADMIN_ONLY', count: 5 },
  ],
  topSources: [
    { title: 'Internal IT Security & Password Standards.pdf', count: 485, visibility: 'INTERNAL' },
    { title: 'Enterprise Code of Conduct & Ethics.pdf', count: 320, visibility: 'PUBLIC' },
    { title: 'Employee Benefits & Remote Work Playbook.pdf', count: 290, visibility: 'INTERNAL' },
    { title: 'Engineering Deployment Runbook.pdf', count: 215, visibility: 'INTERNAL' },
    { title: 'Q3 Financial Audit & Projections.pdf', count: 98, visibility: 'RESTRICTED' },
    { title: 'Root Infrastructure Keys & Blueprint.pdf', count: 12, visibility: 'ADMIN_ONLY' },
  ],
  statusDistribution: [
    { status: 'Ready', count: 62 },
    { status: 'Processing', count: 4 },
    { status: 'Failed', count: 2 },
    { status: 'Restricted', count: 0 },
  ],
};

export async function mockGetAnalytics(): Promise<AnalyticsData> {
  await new Promise((r) => setTimeout(r, 200));
  return { ...INITIAL_ANALYTICS };
}
