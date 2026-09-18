/**
 * URL Security & Credential Masking Engine
 *
 * Enforces strict enterprise presentation safeguards:
 * 1. Strips embedded HTTP user credentials (user:pass@)
 * 2. Sanitizes sensitive query tokens (api_key, token, auth, secret, access_token, password)
 * 3. Replaces internal or protected raw URLs with safe, professional enterprise labels
 * 4. Never renders raw credentials in citations, tooltips, labels, or logs
 */

// Regex patterns to detect embedded credentials or sensitive URL tokens
const CREDENTIAL_URL_REGEX = /^(https?:\/\/)?([^/@\s]+:[^/@\s]+)@/i;
const SENSITIVE_QUERY_PARAMS = [
  'token',
  'api_key',
  'apikey',
  'secret',
  'password',
  'pass',
  'auth',
  'access_token',
  'jwt',
  'bearer',
  'credentials',
];

/**
 * Checks if a URL contains explicit credentials or secrets.
 */
export function containsCredentials(url: string): boolean {
  if (!url) return false;
  if (CREDENTIAL_URL_REGEX.test(url)) return true;

  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (parsed.username || parsed.password) return true;
    for (const param of SENSITIVE_QUERY_PARAMS) {
      if (parsed.searchParams.has(param)) return true;
    }
  } catch {
    // If not a standard URL, check for key terms
    for (const param of SENSITIVE_QUERY_PARAMS) {
      if (url.toLowerCase().includes(`${param}=`)) return true;
    }
  }
  return false;
}

/**
 * Sanitizes a URL by stripping user:pass@ and replacing sensitive query parameters with [REDACTED].
 */
export function sanitizeUrl(rawUrl: string): string {
  if (!rawUrl) return '';

  let sanitized = rawUrl.trim();

  // Strip embedded credentials: http://user:pass@host -> http://host
  sanitized = sanitized.replace(CREDENTIAL_URL_REGEX, '$1');

  try {
    const isRelative = !sanitized.startsWith('http://') && !sanitized.startsWith('https://');
    const parsed = new URL(isRelative ? `https://${sanitized}` : sanitized);

    // Strip auth props
    parsed.username = '';
    parsed.password = '';

    // Redact sensitive query parameters
    parsed.searchParams.forEach((_, key) => {
      if (SENSITIVE_QUERY_PARAMS.includes(key.toLowerCase())) {
        parsed.searchParams.set(key, '[PROTECTED]');
      }
    });

    const result = isRelative
      ? parsed.pathname + parsed.search + parsed.hash
      : parsed.origin + parsed.pathname + parsed.search + parsed.hash;

    return result;
  } catch {
    return 'Protected Resource';
  }
}

/**
 * Returns a human-friendly, safe display label for citations and document references.
 * Never outputs raw credentials or vulnerable backend endpoints.
 */
export function getSafeSourceLabel(source: {
  title?: string;
  rawUrl?: string;
  safeLabel?: string;
  fileType?: string;
}): string {
  if (source.safeLabel && source.safeLabel.trim().length > 0) {
    return source.safeLabel;
  }

  if (source.title && source.title.trim().length > 0) {
    return source.title;
  }

  if (source.rawUrl) {
    if (containsCredentials(source.rawUrl)) {
      return 'Protected Internal Source';
    }

    try {
      const parsed = new URL(
        source.rawUrl.startsWith('http') ? source.rawUrl : `https://${source.rawUrl}`
      );
      const host = parsed.hostname.toLowerCase();

      if (host.includes('intranet') || host.includes('corp') || host.includes('internal')) {
        return 'Company Knowledge Source';
      }
      if (host.includes('docs') || host.includes('wiki') || host.includes('notion')) {
        return 'Organizational Wiki & Documentation';
      }
      if (host.includes('github') || host.includes('gitlab')) {
        return 'Code & Architecture Repository';
      }

      return `${parsed.hostname} Resource`;
    } catch {
      return 'Protected Organization Resource';
    }
  }

  return 'Knowledge Base Document';
}
