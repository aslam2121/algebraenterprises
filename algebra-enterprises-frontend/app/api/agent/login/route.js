import { NextResponse } from 'next/server';

import {
  AGENT_TOKEN_COOKIE,
  fetchStrapi,
  getAgentCookieOptions,
  parseJsonSafely,
} from '@/lib/agent-auth';

export async function POST(request) {
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

  if (!response.ok || !payload?.jwt) {
    return NextResponse.json(
      { message: 'Invalid email or password. Please try again.' },
      { status: response.status === 400 ? 401 : response.status }
    );
  }

  const nextResponse = NextResponse.json(
    {
      user: payload.user || null,
    },
    { status: 200 }
  );

  nextResponse.cookies.set(AGENT_TOKEN_COOKIE, payload.jwt, getAgentCookieOptions());

  return nextResponse;
}
