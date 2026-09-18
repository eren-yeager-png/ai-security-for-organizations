import { describe, it, expect } from 'vitest';
import { containsCredentials, sanitizeUrl, getSafeSourceLabel } from '../security/urlMasker';

describe('URL Security & Credential Masking Engine', () => {
  describe('containsCredentials()', () => {
    it('detects embedded user/password basic auth credentials in URLs', () => {
      expect(containsCredentials('https://admin:supersecret@internal.corp.net/vault')).toBe(true);
      expect(containsCredentials('http://db_user:password123@10.0.0.1/db')).toBe(true);
    });

    it('detects sensitive tokens in query parameters', () => {
      expect(containsCredentials('https://api.internal.corp/data?token=eyJhbGciOi')).toBe(true);
      expect(containsCredentials('https://api.internal.corp/data?api_key=secret_1234')).toBe(true);
      expect(containsCredentials('https://api.internal.corp/data?secret=masterkey')).toBe(true);
    });

    it('returns false for clean, standard URLs', () => {
      expect(containsCredentials('https://enterprise.ai/documentation')).toBe(false);
      expect(containsCredentials('https://intranet.corp.internal/wiki/page?id=123')).toBe(false);
    });
  });

  describe('sanitizeUrl()', () => {
    it('strips user:password@ from URLs completely', () => {
      const dirty = 'https://admin:pass1234@cluster.corp.internal/dashboard';
      const clean = sanitizeUrl(dirty);
      expect(clean).not.toContain('admin');
      expect(clean).not.toContain('pass1234');
      expect(clean).toBe('https://cluster.corp.internal/dashboard');
    });

    it('redacts sensitive query parameters with [PROTECTED]', () => {
      const dirty = 'https://api.corp.internal/v1/sync?token=secrettoken&version=2';
      const clean = sanitizeUrl(dirty);
      expect(clean).not.toContain('secrettoken');
      expect(clean).toContain('token=%5BPROTECTED%5D');
      expect(clean).toContain('version=2');
    });
  });

  describe('getSafeSourceLabel()', () => {
    it('returns safeLabel if explicitly supplied', () => {
      expect(
        getSafeSourceLabel({
          title: 'Unsafe Title',
          safeLabel: 'Approved Presentation Label',
        })
      ).toBe('Approved Presentation Label');
    });

    it('returns title if no safeLabel exists', () => {
      expect(
        getSafeSourceLabel({
          title: 'Employee Code of Conduct 2026.pdf',
        })
      ).toBe('Employee Code of Conduct 2026.pdf');
    });

    it('neutralizes credential-containing URLs into Protected Internal Source', () => {
      expect(
        getSafeSourceLabel({
          rawUrl: 'https://user:password@gateway.corp/secrets',
        })
      ).toBe('Protected Internal Source');
    });

    it('generates professional friendly labels for internal portals', () => {
      expect(
        getSafeSourceLabel({
          rawUrl: 'https://internal-wiki.corp.net/spaces/all',
        })
      ).toBe('Company Knowledge Source');
    });
  });
});
