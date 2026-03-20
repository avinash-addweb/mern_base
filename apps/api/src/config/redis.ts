import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";

let redisClient: Redis | null = null;

export async function connectRedis(): Promise<void> {
  try {
    redisClient = new Redis(env.REDIS_URL, { lazyConnect: true });
    await redisClient.connect();
    logger.info("Redis connected successfully");
  } catch (error) {
    logger.fatal(error, "Redis connection error");
    process.exit(1);
  }
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error("Redis client not initialized. Call connectRedis() first.");
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
