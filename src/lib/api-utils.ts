/**
 * OnlyExplore — API Utility Functions
 * 
 * Provides timeout, retry, and resilient fetch wrappers used across all service files.
 * Prevents hung requests and cascading failures.
 */

/**
 * Wraps a promise with a timeout. If the promise doesn't resolve within `ms`,
 * the returned promise rejects with a TimeoutError.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = 'Operation'
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`[Timeout] ${label} exceeded ${ms}ms`));
    }, ms);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Retries an async function up to `retries` times with optional delay between attempts.
 * Only retries on error; a successful null/empty result is not retried.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 1,
  delayMs: number = 500,
  label = 'Operation'
): Promise<T> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        console.warn(`[Retry] ${label} attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error(`[Retry] ${label} failed after ${retries + 1} attempts`);
}

/**
 * Fetch wrapper with built-in timeout and optional retry.
 * Default timeout: 5000ms. Default retries: 0 (no retry).
 */
export async function fetchWithTimeout(
  url: string,
  options?: RequestInit & { timeoutMs?: number; retries?: number; label?: string }
): Promise<Response> {
  const { timeoutMs = 5000, retries = 0, label = 'Fetch', ...fetchOptions } = options || {};

  const doFetch = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`[Timeout] ${label}: ${url.substring(0, 80)}... exceeded ${timeoutMs}ms`);
      }
      throw err;
    }
  };

  if (retries > 0) {
    return withRetry(doFetch, retries, 500, label);
  }

  return doFetch();
}

/**
 * Executes multiple promises in parallel with a concurrency limit.
 * Prevents rate limiting by batching requests.
 */
export async function parallelBatch<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number = 5
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const p = task().then(result => {
      results.push(result);
    }).catch(err => {
      console.warn('[parallelBatch] Task failed:', err?.message);
      results.push(undefined as any);
    });

    executing.push(p);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // Remove completed promises
      const completed = executing.filter(e => {
        // Check if promise is settled — we re-check by wrapping
        let settled = false;
        e.then(() => { settled = true; }).catch(() => { settled = true; });
        return settled;
      });
      // Simplified: just await all when batch is full
      if (executing.length >= concurrency) {
        await Promise.all(executing);
        executing.length = 0;
      }
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Runs multiple promises via Promise.allSettled and returns fulfilled values,
 * logging warnings for rejected promises. Never throws.
 */
export async function safeParallel<T extends readonly unknown[] | []>(
  promises: T,
  labels?: string[]
): Promise<{ -readonly [P in keyof T]: T[P] extends Promise<infer U> ? U | null : T[P] | null }> {
  const results = await Promise.allSettled(promises);

  return results.map((result, idx) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    const label = labels?.[idx] || `Promise[${idx}]`;
    console.warn(`[safeParallel] ${label} rejected:`, result.reason?.message || result.reason);
    return null;
  }) as any;
}
