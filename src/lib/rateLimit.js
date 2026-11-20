// In-memory sliding window rate limiter
const rateLimitMap = new Map()

// Clean up stale buckets every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000).unref?.()

/**
 * Checks rate limit for a key
 * @param {string} key - Identifier (e.g., ip + email or route)
 * @param {number} maxAttempts - Allowed hits within window (default 10)
 * @param {number} windowMs - Window in milliseconds (default 15 minutes)
 * @returns {{ allowed: boolean, remaining: number, resetTime: number }}
 */
export function checkRateLimit(key, maxAttempts = 10, windowMs = 15 * 60 * 1000) {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    const newRecord = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitMap.set(key, newRecord)
    return { allowed: true, remaining: maxAttempts - 1, resetTime: newRecord.resetTime }
  }

  record.count += 1
  if (record.count > maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
    }
  }

  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetTime: record.resetTime,
  }
}

export function resetRateLimit(key) {
  rateLimitMap.delete(key)
}
