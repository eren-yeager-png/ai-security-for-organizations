import { describe, it, expect } from 'vitest';
import { mockStreamAiResponse } from '../mocks/chat.mock';
import { User } from '../api/types';

describe('AI Chat Streaming & Citation System', () => {
  const employeeUser: User = {
    id: 'emp_01',
    name: 'Sarah Jenkins',
    email: 'sarah@enterprise.ai',
    role: 'Employee',
    department: 'Support',
    isActive: true,
    isAdmin: false,
    createdAt: '2026-01-01',
  };

  const managerUser: User = {
    id: 'mgr_01',
    name: 'Marcus Chen',
    email: 'marcus@enterprise.ai',
    role: 'Manager',
    department: 'Engineering',
    isActive: true,
    isAdmin: false,
    createdAt: '2026-01-01',
  };

  it('streams response chunks and completes successfully', async () => {
    const chunks: string[] = [];
    const message = await mockStreamAiResponse(
      'conv_test_01',
      'What are our VPN requirements?',
      employeeUser,
      undefined,
      (chunk) => chunks.push(chunk)
    );

    expect(chunks.length).toBeGreaterThan(0);
    expect(message.content).toContain('Multi-Factor Authentication');
    expect(message.sources).toBeDefined();
    expect(message.sources?.length).toBeGreaterThan(0);
    expect(message.sources?.[0].safeLabel).toBeDefined();
  });

  it('enforces RBAC when employee queries restricted financial documents', async () => {
    const message = await mockStreamAiResponse(
      'conv_test_02',
      'Show me Q3 financial revenue projections and executive audit',
      employeeUser
    );

    expect(message.content).toContain("I couldn't find sufficient information in your organization's accessible documents");
    expect(message.content).toContain('RESTRICTED');
    // Ensure no restricted citations leaked to employee
    expect(message.sources).toBeUndefined();
  });

  it('allows Manager to access restricted financial documents with citations', async () => {
    const message = await mockStreamAiResponse(
      'conv_test_03',
      'Show me Q3 financial revenue projections and audit',
      managerUser
    );

    expect(message.content).toContain('$48.2M');
    expect(message.sources).toBeDefined();
    expect(message.sources?.[0].documentId).toBe('doc_res_01');
  });

  it('supports stop generation via AbortSignal', async () => {
    const controller = new AbortController();
    // Abort early
    setTimeout(() => controller.abort(), 30);

    const message = await mockStreamAiResponse(
      'conv_test_04',
      'Tell me about employee benefits and healthcare',
      employeeUser,
      undefined,
      undefined,
      undefined,
      controller.signal
    );

    expect(message.content.length).toBeGreaterThan(0);
  });
});
