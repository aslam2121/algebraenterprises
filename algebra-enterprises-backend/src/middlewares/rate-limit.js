'use strict';

const WINDOW_STORE = new Map();
const ONE_SECOND_MS = 1000;
const ONE_MINUTE_MS = 60 * ONE_SECOND_MS;

const RULES = [
  {
    id: 'auth-login',
    method: 'POST',
    match: (path) => path === '/api/auth/local',
    limit: 5,
    windowMs: 10 * ONE_MINUTE_MS,
    key: (ctx) => `ip:${getClientIp(ctx)}`,
    message: 'Too many login attempts. Please wait before trying again.',
  },
  {
    id: 'public-enquiry-create',
    method: 'POST',
    match: (path) => path === '/api/enquiries',
    limit: 5,
    windowMs: 15 * ONE_MINUTE_MS,
    key: (ctx) => `ip:${getClientIp(ctx)}`,
    message: 'Too many enquiries from this connection. Please wait before submitting again.',
  },
  {
    id: 'agent-property-create',
    method: 'POST',
    match: (path) => path === '/api/properties/my-properties',
    limit: 12,
    windowMs: 15 * ONE_MINUTE_MS,
    key: (ctx) => `user:${ctx.state.user?.id || 'anonymous'}:ip:${getClientIp(ctx)}`,
    message: 'Too many property upload requests. Please wait before trying again.',
  },
  {
    id: 'agent-property-update',
    method: 'PUT',
    match: (path) => path.startsWith('/api/properties/my-properties/'),
    limit: 12,
    windowMs: 15 * ONE_MINUTE_MS,
    key: (ctx) => `user:${ctx.state.user?.id || 'anonymous'}:ip:${getClientIp(ctx)}`,
    message: 'Too many property update requests. Please wait before trying again.',
  },
];

function getForwardedIp(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .split(',')[0]
    .trim();
}

function getClientIp(ctx) {
  return getForwardedIp(ctx.request.headers['x-forwarded-for'])
    || getForwardedIp(ctx.request.headers['x-real-ip'])
    || ctx.request.ip
    || ctx.ip
    || 'unknown';
}

function pruneOldEntries(store, now) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

function checkLimit(rule, key, now) {
  const storeKey = `${rule.id}:${key}`;
  const existing = WINDOW_STORE.get(storeKey);

  if (!existing || existing.resetAt <= now) {
    const nextEntry = {
      count: 1,
      resetAt: now + rule.windowMs,
    };

    WINDOW_STORE.set(storeKey, nextEntry);
    return {
      allowed: true,
      remaining: Math.max(rule.limit - nextEntry.count, 0),
      retryAfterSeconds: Math.ceil(rule.windowMs / ONE_SECOND_MS),
    };
  }

  if (existing.count >= rule.limit) {
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
    remaining: Math.max(rule.limit - existing.count, 0),
    retryAfterSeconds: Math.max(
      Math.ceil((existing.resetAt - now) / ONE_SECOND_MS),
      1
    ),
  };
}

module.exports = () => {
  return async (ctx, next) => {
    const method = ctx.request.method;
    const path = ctx.request.path;
    const rule = RULES.find((candidate) => (
      candidate.method === method && candidate.match(path)
    ));

    if (!rule) {
      return next();
    }

    const now = Date.now();
    pruneOldEntries(WINDOW_STORE, now);

    const rateLimitState = checkLimit(rule, rule.key(ctx), now);

    ctx.set('X-RateLimit-Limit', String(rule.limit));
    ctx.set('X-RateLimit-Remaining', String(rateLimitState.remaining));
    ctx.set('Retry-After', String(rateLimitState.retryAfterSeconds));

    if (!rateLimitState.allowed) {
      ctx.status = 429;
      ctx.body = {
        message: rule.message,
      };
      return;
    }

    return next();
  };
};
