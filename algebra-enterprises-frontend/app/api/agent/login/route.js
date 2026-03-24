import { NextResponse } from 'next/server';

import {
  AGENT_TOKEN_COOKIE,
  fetchStrapi,
  getAgentCookieOptions,
  parseJsonSafely,
} from '@/lib/agent-auth';
import { checkRateLimit, getRequestIp } from '@/lib/rate-limit';

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request) {
  const rateLimitState = checkRateLimit({
    key: `agent-login:${getRequestIp(request)}`,
    limit: LOGIN_LIMIT,
    windowMs: LOGIN_WINDOW_MS,
  });

  if (!rateLimitState.allowed) {
    return NextResponse.json(
      { message: 'Too many login attempts. Please wait before trying again.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitState.retryAfterSeconds),
          'X-RateLimit-Limit': String(LOGIN_LIMIT),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 });
  }

  const identifier = typeof body?.identifier === 'string' ? body.identifier.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!identifier || !password) {
    return NextResponse.json(
      { message: 'Email and password are required.' },
      { status: 400 }
    );
  }

  const response = await fetchStrapi('/api/auth/local', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identifier, password }),
  });

  const payload = await parseJsonSafely(response);
  const responseHeaders = {
    'Retry-After': String(rateLimitState.retryAfterSeconds),
    'X-RateLimit-Limit': String(LOGIN_LIMIT),
    'X-RateLimit-Remaining': String(rateLimitState.remaining),
  };

  if (!response.ok || !payload?.jwt) {
    return NextResponse.json(
      { message: 'Invalid email or password. Please try again.' },
      {
        status: response.status === 400 ? 401 : response.status,
        headers: response.status === 429 ? {
          ...responseHeaders,
          'Retry-After': response.headers.get('retry-after') || responseHeaders['Retry-After'],
        } : responseHeaders,
      }
    );
  }

  const nextResponse = NextResponse.json(
    {
      user: payload.user || null,
    },
    {
      status: 200,
      headers: responseHeaders,
    }
  );

  nextResponse.cookies.set(AGENT_TOKEN_COOKIE, payload.jwt, getAgentCookieOptions());

  return nextResponse;
}
