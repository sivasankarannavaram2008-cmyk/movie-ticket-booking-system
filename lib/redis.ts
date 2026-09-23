import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Check if valid Upstash Redis credentials exist in environment
 */
export function isRedisConfigured(): boolean {
  return Boolean(
    redisUrl &&
    redisToken &&
    !redisUrl.includes("placeholder") &&
    !redisToken.includes("placeholder")
  );
}

/**
 * Singleton Upstash Redis client.
 * Safe fallback instance so builds and static generation don't throw on empty credentials.
 */
export const redis = new Redis({
  url: redisUrl || "https://placeholder-redis.upstash.io",
  token: redisToken || "placeholder-token",
});

/**
 * In-memory fallback lock store for development and testing environments
 * when live Upstash Redis credentials have not yet been provided.
 */
interface InMemoryLock {
  userId: string;
  expiresAt: number;
}

const memoryLockStore = new Map<string, InMemoryLock>();

function cleanExpiredMemoryLocks() {
  const now = Date.now();
  for (const [key, lock] of memoryLockStore.entries()) {
    if (lock.expiresAt <= now) {
      memoryLockStore.delete(key);
    }
  }
}

/**
 * Concurrency Seat Lock Engine
 * Performs atomic SET NX EX 300 with all-or-nothing rollback on collision.
 */
export async function acquireSeatLocks(
  showId: string,
  seatIds: string[],
  userId: string,
  ttlSeconds: number = 300
): Promise<{ success: boolean; acquiredSeats: string[]; collidingSeats: string[]; expiresAt: number }> {
  // Check if any seat is blocked for maintenance
  const blockedSeats = await getBlockedSeats(showId);
  const blockedRequested = seatIds.filter((id) => blockedSeats.includes(id));
  if (blockedRequested.length > 0) {
    return {
      success: false,
      acquiredSeats: [],
      collidingSeats: blockedRequested,
      expiresAt: 0,
    };
  }

  const acquiredSeats: string[] = [];
  const collidingSeats: string[] = [];
  const expiresAt = Date.now() + ttlSeconds * 1000;

  if (isRedisConfigured()) {
    // Upstash Redis Atomic Execution
    for (const seatId of seatIds) {
      const key = `seat_lock:${showId}:${seatId}`;
      try {
        // SET key userId NX EX ttlSeconds
        // Returns "OK" if set, or null if already exists
        const res = await redis.set(key, userId, {
          nx: true,
          ex: ttlSeconds,
        });

        if (res === "OK") {
          acquiredSeats.push(seatId);
        } else {
          collidingSeats.push(seatId);
        }
      } catch (err) {
        console.error(`Redis lock error for ${key}:`, err);
        collidingSeats.push(seatId);
      }
    }

    // Rollback if any collision occurred
    if (collidingSeats.length > 0) {
      for (const seatId of acquiredSeats) {
        const key = `seat_lock:${showId}:${seatId}`;
        try {
          // Only delete if held by this user
          const holder = await redis.get<string>(key);
          if (holder === userId) {
            await redis.del(key);
          }
        } catch (rollbackErr) {
          console.error(`Rollback error for ${key}:`, rollbackErr);
        }
      }

      return {
        success: false,
        acquiredSeats: [],
        collidingSeats,
        expiresAt: 0,
      };
    }

    return {
      success: true,
      acquiredSeats,
      collidingSeats: [],
      expiresAt,
    };
  } else {
    // In-memory atomic fallback
    cleanExpiredMemoryLocks();

    for (const seatId of seatIds) {
      const key = `seat_lock:${showId}:${seatId}`;
      const existing = memoryLockStore.get(key);

      if (!existing || existing.expiresAt <= Date.now()) {
        acquiredSeats.push(seatId);
      } else if (existing.userId === userId) {
        // Same user renewing lock
        acquiredSeats.push(seatId);
      } else {
        collidingSeats.push(seatId);
      }
    }

    if (collidingSeats.length > 0) {
      return {
        success: false,
        acquiredSeats: [],
        collidingSeats,
        expiresAt: 0,
      };
    }

    // Commit locks to in-memory store
    for (const seatId of acquiredSeats) {
      const key = `seat_lock:${showId}:${seatId}`;
      memoryLockStore.set(key, { userId, expiresAt });
    }

    return {
      success: true,
      acquiredSeats,
      collidingSeats: [],
      expiresAt,
    };
  }
}

/**
 * Release seat locks held by a specific user.
 */
export async function releaseSeatLocks(
  showId: string,
  seatIds: string[],
  userId: string,
  force: boolean = false
): Promise<{ releasedSeats: string[] }> {
  const releasedSeats: string[] = [];

  if (isRedisConfigured()) {
    for (const seatId of seatIds) {
      const key = `seat_lock:${showId}:${seatId}`;
      try {
        const holder = await redis.get<string>(key);
        if (force || holder === userId) {
          await redis.del(key);
          releasedSeats.push(seatId);
        }
      } catch (err) {
        console.error(`Failed to release lock for ${key}:`, err);
      }
    }
  } else {
    cleanExpiredMemoryLocks();
    for (const seatId of seatIds) {
      const key = `seat_lock:${showId}:${seatId}`;
      const existing = memoryLockStore.get(key);
      if (force || (existing && existing.userId === userId)) {
        memoryLockStore.delete(key);
        releasedSeats.push(seatId);
      }
    }
  }

  return { releasedSeats };
}

/**
 * Query all active locks for a given show.
 */
export async function getShowSeatLocks(
  showId: string
): Promise<Array<{ seatId: string; userId: string; remainingSeconds: number }>> {
  const activeLocks: Array<{ seatId: string; userId: string; remainingSeconds: number }> = [];

  if (isRedisConfigured()) {
    try {
      const pattern = `seat_lock:${showId}:*`;
      const keys = await redis.keys(pattern);

      for (const key of keys) {
        const seatId = key.split(":").pop();
        if (!seatId) continue;

        const userId = await redis.get<string>(key);
        const ttl = await redis.ttl(key);

        if (userId && ttl > 0) {
          activeLocks.push({
            seatId,
            userId,
            remainingSeconds: ttl,
          });
        }
      }
    } catch (err) {
      console.warn("Error querying Redis active locks:", err);
    }
  } else {
    cleanExpiredMemoryLocks();
    const prefix = `seat_lock:${showId}:`;
    const now = Date.now();

    for (const [key, lock] of memoryLockStore.entries()) {
      if (key.startsWith(prefix) && lock.expiresAt > now) {
        const seatId = key.replace(prefix, "");
        const remainingSeconds = Math.max(0, Math.round((lock.expiresAt - now) / 1000));
        activeLocks.push({
          seatId,
          userId: lock.userId,
          remainingSeconds,
        });
      }
    }
  }

  return activeLocks;
}

declare global {
  // eslint-disable-next-line no-var
  var __memoryBlockedSeatsStore: Map<string, Set<string>> | undefined;
}

if (!global.__memoryBlockedSeatsStore) {
  global.__memoryBlockedSeatsStore = new Map<string, Set<string>>();
}

/**
 * Retrieve all currently blocked maintenance/VIP seats for a screening.
 */
export async function getBlockedSeats(showId: string): Promise<string[]> {
  if (isRedisConfigured()) {
    try {
      const key = `seat_blocked:${showId}`;
      const members = await redis.smembers(key);
      return Array.isArray(members) ? members : [];
    } catch (err) {
      console.warn("Redis getBlockedSeats notice:", err);
    }
  }
  const set = global.__memoryBlockedSeatsStore?.get(showId);
  return set ? Array.from(set) : [];
}

/**
 * Check if a specific seat is blocked for maintenance.
 */
export async function isSeatBlocked(showId: string, seatId: string): Promise<boolean> {
  if (isRedisConfigured()) {
    try {
      const key = `seat_blocked:${showId}`;
      const isMember = await redis.sismember(key, seatId);
      return isMember === 1;
    } catch (err) {
      console.warn("Redis isSeatBlocked notice:", err);
    }
  }
  const set = global.__memoryBlockedSeatsStore?.get(showId);
  return set ? set.has(seatId) : false;
}

/**
 * Toggle or set seat blocked status for a screening.
 */
export async function toggleSeatBlocked(
  showId: string,
  seatId: string,
  action?: "BLOCK" | "UNBLOCK" | "TOGGLE"
): Promise<{ isBlocked: boolean; blockedSeats: string[] }> {
  let targetAction = action;
  if (!targetAction || targetAction === "TOGGLE") {
    const currentlyBlocked = await isSeatBlocked(showId, seatId);
    targetAction = currentlyBlocked ? "UNBLOCK" : "BLOCK";
  }

  const shouldBlock = targetAction === "BLOCK";

  if (isRedisConfigured()) {
    try {
      const key = `seat_blocked:${showId}`;
      if (shouldBlock) {
        await redis.sadd(key, seatId);
      } else {
        await redis.srem(key, seatId);
      }
      const allBlocked = await redis.smembers(key);
      return {
        isBlocked: shouldBlock,
        blockedSeats: Array.isArray(allBlocked) ? allBlocked : [],
      };
    } catch (err) {
      console.warn("Redis toggleSeatBlocked notice:", err);
    }
  }

  // Memory store fallback
  if (!global.__memoryBlockedSeatsStore) {
    global.__memoryBlockedSeatsStore = new Map<string, Set<string>>();
  }
  if (!global.__memoryBlockedSeatsStore.has(showId)) {
    global.__memoryBlockedSeatsStore.set(showId, new Set<string>());
  }
  const showSet = global.__memoryBlockedSeatsStore.get(showId)!;
  if (shouldBlock) {
    showSet.add(seatId);
  } else {
    showSet.delete(seatId);
  }

  return {
    isBlocked: shouldBlock,
    blockedSeats: Array.from(showSet),
  };
}

export default redis;
