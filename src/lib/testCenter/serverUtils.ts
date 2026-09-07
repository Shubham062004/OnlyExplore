import { ErrorCategory, NormalizedTestResult, TestErrorInfo } from './types';

/**
 * Masks a secret value, showing only the first few and last few characters.
 * Example: "sk_test_51Mz...q39a"
 */
export function maskSecret(val: string | undefined | null): string | undefined {
  if (!val) return undefined;
  if (val.length <= 8) return '********';
  return `${val.slice(0, 4)}...${val.slice(-4)}`;
}

/**
 * Cleans string error messages to strip any accidental tokens, keys, passwords, or URIs.
 */
export function sanitizeError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : JSON.stringify(error);

  return raw
    .replace(/mongodb(?:\+srv)?:\/\/[^\s@]+@[^\s/]+/gi, 'mongodb://[REDACTED_USER:PASS]@[HOST]')
    .replace(/access_token=[^\s&]+/gi, 'access_token=[REDACTED]')
    .replace(/api_key=[^\s&]+/gi, 'api_key=[REDACTED]')
    .replace(/key=[^\s&]+/gi, 'key=[REDACTED]')
    .replace(/client_secret=[^\s&]+/gi, 'client_secret=[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer [REDACTED]')
    .replace(/Basic\s+[A-Za-z0-9=+/]+/gi, 'Basic [REDACTED]')
    .replace(/AIza[A-Za-z0-9_-]{35}/g, '[REDACTED_GOOGLE_KEY]')
    .replace(/sk_(?:test|live)_[0-9a-zA-Z]{24,}/g, '[REDACTED_STRIPE_KEY]')
    .replace(/re_[0-9a-zA-Z]{24,}/g, '[REDACTED_RESEND_KEY]');
}

/**
 * Deep sanitization for any response object to avoid echoing back credentials.
 */
export function sanitizeData(data: unknown): any {
  if (!data) return data;
  try {
    const json = JSON.stringify(data);
    const cleaned = json
      .replace(/"(access_token|password|clientSecret|secret|token|api_key|apiKey)"\s*:\s*"[^"]+"/gi, '"$1":"[REDACTED]"')
      .replace(/AIza[A-Za-z0-9_-]{35}/g, '[REDACTED_GOOGLE_KEY]')
      .replace(/sk_(?:test|live)_[0-9a-zA-Z]{24,}/g, '[REDACTED_STRIPE_KEY]')
      .replace(/mongodb(?:\+srv)?:\/\/[^\s@]+@[^\s/]+/gi, 'mongodb://[REDACTED]@[HOST]');
    return JSON.parse(cleaned);
  } catch {
    return data;
  }
}

/**
 * Classifies an HTTP status or error string into standard error categories with fix guidance.
 */
export function classifyError(
  status: number,
  message: string,
  serviceName: string
): { category: ErrorCategory; likelyCause: string; fixSteps: string[] } {
  const lower = message.toLowerCase();

  if (status === 401 || lower.includes('unauthorized') || lower.includes('invalid api key') || lower.includes('invalid credentials') || lower.includes('authentication')) {
    return {
      category: 'AUTHENTICATION',
      likelyCause: `The API key or credentials provided for ${serviceName} are invalid, expired, revoked, or formatted incorrectly.`,
      fixSteps: [
        `Verify the exact environment variable name in .env or .env.local`,
        `Generate a fresh API key or token in the provider console for ${serviceName}`,
        `Check if the key has whitespace or quotes accidentally included`,
        `Restart the Next.js development server to load newly saved environment variables`,
      ],
    };
  }

  if (status === 403 || lower.includes('forbidden') || lower.includes('permission') || lower.includes('not enabled') || lower.includes('billing') || lower.includes('access denied')) {
    return {
      category: 'PERMISSION',
      likelyCause: `The API key is recognized, but lacks permission, required API enablement, or an active billing account for ${serviceName}.`,
      fixSteps: [
        `Check if the specific API (e.g. YouTube Data v3, Places API) is enabled in your developer console`,
        `Review API key restrictions (HTTP referrer, IP address, or API service restrictions)`,
        `Ensure billing is enabled if the provider requires an active credit card / billing profile`,
      ],
    };
  }

  if (status === 429 || lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('quota')) {
    return {
      category: status === 429 ? 'RATE_LIMIT' : 'QUOTA',
      likelyCause: `Request limit exceeded for ${serviceName}. You have hit the rate limit or exhausted daily/monthly quota.`,
      fixSteps: [
        `Check quota dashboard on ${serviceName}`,
        `Wait for rate limit reset period to expire`,
        `Consider upgrading tier or implementing caching (CacheService is available in OnlyExplore)`,
      ],
    };
  }

  if (status === 408 || lower.includes('timeout') || lower.includes('etimedout') || lower.includes('aborted')) {
    return {
      category: 'TIMEOUT',
      likelyCause: `The connection to ${serviceName} timed out. The external server might be under high load or unreachable.`,
      fixSteps: [
        `Check provider status page for current incidents or downtime`,
        `Verify local internet connectivity and firewall rules`,
        `Retry the test in a few moments`,
      ],
    };
  }

  if (status >= 500) {
    return {
      category: 'PROVIDER_ERROR',
      likelyCause: `${serviceName} internal server error (${status}). The remote service encountered an unexpected error.`,
      fixSteps: [
        `Check the provider's official system status page`,
        `Retry after a short delay to determine if it is a transient outage`,
      ],
    };
  }

  if (lower.includes('connect') || lower.includes('econnrefused') || lower.includes('enotfound') || lower.includes('dns')) {
    return {
      category: 'NETWORK',
      likelyCause: `Unable to establish a network connection to ${serviceName}. DNS resolution or gateway failure.`,
      fixSteps: [
        `Verify internet connectivity`,
        `Check if corporate proxy, VPN, or firewall blocks the target API domain`,
      ],
    };
  }

  return {
    category: 'UNKNOWN',
    likelyCause: `Unexpected response or error from ${serviceName}: ${message}`,
    fixSteps: [
      `Inspect detailed error response payload`,
      `Cross-reference error code with official ${serviceName} documentation`,
    ],
  };
}
