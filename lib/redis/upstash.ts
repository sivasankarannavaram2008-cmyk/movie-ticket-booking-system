import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Upstash Redis client instance.
 * Lazily instantiated or safely created so builds pass without env variables defined.
 */
export const redis = new Redis({
  url: redisUrl || "https://placeholder-redis.upstash.io",
  token: redisToken || "placeholder-token",
});

/**
 * Helper to verify if Redis credentials are configured.
 */
export function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
