import { getRedisClient } from "../config/redis.js";

const DEFAULT_TTL = 300; // 5 minutes

export function buildCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}:${params[k]}`)
    .join("|");
  return `${prefix}:${sorted}`;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  const cached = await redis.get(key);
  if (!cached) return null;
  return JSON.parse(cached) as T;
}

export async function cacheSet(key: string, value: unknown, ttl = DEFAULT_TTL): Promise<void> {
  const redis = getRedisClient();
  await redis.set(key, JSON.stringify(value), "EX", ttl);
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(key);
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  const redis = getRedisClient();
  let cursor = "0";
  do {
    const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
    cursor = nextCursor;
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== "0");
}
