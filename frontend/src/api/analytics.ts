import { apiClient, USE_MOCK_API } from './client';
import { AnalyticsData } from './types';
import { mockGetAnalytics } from '../mocks/analytics.mock';

export async function getAnalytics(): Promise<AnalyticsData> {
  if (USE_MOCK_API) {
    return mockGetAnalytics();
  }
  return apiClient<AnalyticsData>('/admin/analytics');
}
