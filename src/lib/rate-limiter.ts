/**
 * SCANIX BODY – In-memory sliding-window rate limiter
 *
 * Designed for serverless (Next.js Route Handlers on Vercel).
 * Each function instance has its own in-memory store — limits are enforced
 * per-instance, not globally. For multi-instance production deployments,
 * replace the store with Redis/Upstash via `@upstash/ratelimit`.
 *
 * Usage:
 *   const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 })
 *   const result = limiter.check(userId)
 *   if (!result.allowed) return 429
 */

interface RateLimiterOptions {
  /** Max requests allowed within the window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  /** Remaining requests in the current window */
  remaining: number
  /** Milliseconds until the window resets */
  resetInMs: number
}

interface WindowEntry {
  timestamps: number[]
}

/**
 * Creates a per-key sliding-window rate limiter backed by an in-memory Map.
 * Keys are typically `userId` or `userId:action`.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const store = new Map<string, WindowEntry>()

  return {
    check(key: string): RateLimitResult {
      const now = Date.now()
      const windowStart = now - options.windowMs

      const entry = store.get(key) ?? { timestamps: [] }

      // Evict timestamps outside the current window
      entry.timestamps = entry.timestamps.filter((t) => t > windowStart)

      const remaining = Math.max(0, options.limit - entry.timestamps.length)
      const allowed = entry.timestamps.length < options.limit

      if (allowed) {
        entry.timestamps.push(now)
        store.set(key, entry)
      }

      const oldestInWindow = entry.timestamps[0] ?? now
      const resetInMs = Math.max(0, oldestInWindow + options.windowMs - now)

      return { allowed, remaining: allowed ? remaining - 1 : 0, resetInMs }
    },

    /** Manually clear state for a key (useful after a cooldown period) */
    reset(key: string): void {
      store.delete(key)
    },
  }
}

// ---------------------------------------------------------------------------
// Pre-configured limiters used across the app
// ---------------------------------------------------------------------------

/** AI extraction endpoint: 10 requests / 60 s per user */
export const extractRateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60_000,
})

/** AI analysis endpoint: 3 full analyses / 10 min per user */
export const analysisRateLimiter = createRateLimiter({
  limit: 3,
  windowMs: 10 * 60_000,
})
