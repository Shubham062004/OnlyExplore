import { Redis } from '@upstash/redis';

// Trigger HMR cache reload
class MemoryCache {
  private cache = new Map<string, { value: any; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set(key: string, value: any, options?: { ex?: number }): Promise<void> {
    const ttlSeconds = options?.ex ?? 3600;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

class CacheService {
  private redis: Redis | null = null;
  private memoryCache: MemoryCache;

  constructor() {
    this.memoryCache = new MemoryCache();
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

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redis) {
        const val = await this.redis.get<T>(key);
        if (val === null) return null;
        if (typeof val === 'string') {
          try {
            return JSON.parse(val) as T;
          } catch {
            return val as any;
          }
        }
        return val;
      }
    } catch (err) {
      console.warn(`[CacheService] Redis get failed for key "${key}":`, err);
    }
    return this.memoryCache.get<T>(key);
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      if (this.redis) {
        const valToSet = typeof value === 'object' ? JSON.stringify(value) : value;
        await this.redis.set(key, valToSet, { ex: ttlSeconds });
        return;
      }
    } catch (err) {
      console.warn(`[CacheService] Redis set failed for key "${key}":`, err);
    }
    await this.memoryCache.set(key, value, { ex: ttlSeconds });
  }

  async del(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key);
        return;
      }
    } catch (err) {
      console.warn(`[CacheService] Redis del failed for key "${key}":`, err);
    }
    await this.memoryCache.del(key);
  }
}

export const cacheService = new CacheService();
export default cacheService;
