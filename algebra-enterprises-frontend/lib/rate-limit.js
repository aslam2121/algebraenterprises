import 'server-only';

const WINDOW_STORE = new Map();
const ONE_SECOND_MS = 1000;

export function getRequestIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  return forwardedFor?.split(',')[0]?.trim()
    || realIp?.trim()
    || 'unknown';
}

function pruneExpiredEntries(now) {
  for (const [key, entry] of WINDOW_STORE.entries()) {
    if (entry.resetAt <= now) {
      WINDOW_STORE.delete(key);
    }
  }
}

export function checkRateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  pruneExpiredEntries(now);

  const existing = WINDOW_STORE.get(key);

  if (!existing || existing.resetAt <= now) {
    const nextEntry = {
      count: 1,
      resetAt: now + windowMs,
    };

    WINDOW_STORE.set(key, nextEntry);

    return {
      allowed: true,
      remaining: Math.max(limit - nextEntry.count, 0),
      retryAfterSeconds: Math.ceil(windowMs / ONE_SECOND_MS),
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        Math.ceil((existing.resetAt - now) / ONE_SECOND_MS),
        1
      ),
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    remaining: Math.max(limit - existing.count, 0),
    retryAfterSeconds: Math.max(
      Math.ceil((existing.resetAt - now) / ONE_SECOND_MS),
      1
    ),
  };
}
