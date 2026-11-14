interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired keys periodically
function cleanupExpired() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Checks and increments rate limit for a specific action and key.
 *
 * @param action - Category of action (e.g. "login", "password_change")
 * @param key - Identifier (e.g. username, IP, userId)
 * @param maxAttempts - Maximum allowed attempts within the window
 * @param windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns Object indicating if attempt is allowed, remaining attempts, and seconds until reset
 */
export function checkRateLimit(
  action: string,
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  cleanupExpired();

  const now = Date.now();
  const bucketKey = `${action}:${key.toLowerCase().trim()}`;
  const record = rateLimitStore.get(bucketKey);

  if (!record || record.resetAt <= now) {
    return {
      allowed: true,
      remaining: maxAttempts,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - record.count),
    resetInSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
  };
}

/**
 * Records a failed attempt for the given action and key.
 */
export function recordRateLimitFailure(
  action: string,
  key: string,
  windowMs = 15 * 60 * 1000
): { remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const bucketKey = `${action}:${key.toLowerCase().trim()}`;
  const record = rateLimitStore.get(bucketKey);

  if (!record || record.resetAt <= now) {
    rateLimitStore.set(bucketKey, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      remaining: 4,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  record.count += 1;
  return {
    remaining: Math.max(0, 5 - record.count),
    resetInSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
  };
}

/**
 * Resets the rate limit on success.
 */
export function resetRateLimit(action: string, key: string): void {
  const bucketKey = `${action}:${key.toLowerCase().trim()}`;
  rateLimitStore.delete(bucketKey);
}

