import { Redis } from '@upstash/redis';

/**
 * LRU-based in-memory cache with bounded size.
 * Prevents unbounded memory growth by evicting oldest entries when limit is reached.
 */
class MemoryCache {
  private cache = new Map<string, { value: any; expiresAt: number }>();
  private maxEntries: number;

  // Cache statistics
  private stats = { hits: 0, misses: 0, evictions: 0 };

  constructor(maxEntries = 200) {
    this.maxEntries = maxEntries;
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    this.stats.hits++;

    // Move to end for LRU behavior
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.value as T;
  }

  async set(key: string, value: any, options?: { ex?: number }): Promise<void> {
    const ttlSeconds = options?.ex ?? 3600;

    // LRU eviction: remove oldest entry if at capacity
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        this.stats.evictions++;
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? `${((this.stats.hits / total) * 100).toFixed(1)}%` : '0%',
    };
  }
}

class CacheService {
  private redis: Redis | null = null;
  private memoryCache: MemoryCache;

  constructor() {
    this.memoryCache = new MemoryCache(500);
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
      try {
        this.redis = new Redis({ url, token });
        console.log('✅ CacheService initialized with Upstash Redis.');
      } catch (err) {
        console.warn('⚠️ Failed to initialize Upstash Redis. Falling back to in-memory cache.', err);
      }
    } else {
      console.log('ℹ️ Upstash Redis env vars missing. Using in-memory cache.');
    }
  }

  /**
   * Get a value from cache. Checks in-memory first (L0), then Redis (L1).
   */
  async get<T>(key: string): Promise<T | null> {
    // L0: Check in-memory first (fastest)
    const memResult = await this.memoryCache.get<T>(key);
    if (memResult !== null) return memResult;

    // L1: Check Redis
    try {
      if (this.redis) {
        const val = await this.redis.get<T>(key);
        if (val === null) return null;

        let parsed: T;
        if (typeof val === 'string') {
          try {
            parsed = JSON.parse(val) as T;
          } catch {
            parsed = val as any;
          }
        } else {
          parsed = val;
        }

        // Promote to L0 cache with shorter TTL (5 minutes)
        await this.memoryCache.set(key, parsed, { ex: 300 });
        return parsed;
      }
    } catch (err) {
      console.warn(`[CacheService] Redis get failed for key "${key}":`, err);
    }

    return null;
  }

  /**
   * Set a value in both in-memory (L0) and Redis (L1) caches.
   */
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    // Always write to in-memory cache (shorter TTL)
    const memTtl = Math.min(ttlSeconds, 600); // Max 10 min in memory
    await this.memoryCache.set(key, value, { ex: memTtl });

    // Write to Redis if available
    try {
      if (this.redis) {
        const valToSet = typeof value === 'object' ? JSON.stringify(value) : value;
        await this.redis.set(key, valToSet, { ex: ttlSeconds });
        return;
      }
    } catch (err) {
      console.warn(`[CacheService] Redis set failed for key "${key}":`, err);
    }
  }

  /**
   * Delete from both caches.
   */
  async del(key: string): Promise<void> {
    await this.memoryCache.del(key);
    try {
      if (this.redis) {
        await this.redis.del(key);
        return;
      }
    } catch (err) {
      console.warn(`[CacheService] Redis del failed for key "${key}":`, err);
    }
  }

  /**
   * Get-or-set convenience method. Eliminates cache-check boilerplate.
   * If the key exists in cache, returns it. Otherwise, calls fetcher(),
   * stores the result, and returns it.
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fetcher();

    // Don't cache null/undefined results
    if (result !== null && result !== undefined) {
      await this.set(key, result, ttlSeconds);
    }

    return result;
  }

  /**
   * Returns cache statistics for monitoring.
   */
  getStats() {
    return {
      memory: this.memoryCache.getStats(),
      redisConnected: this.redis !== null,
    };
  }
}

export const cacheService = new CacheService();
export default cacheService;
