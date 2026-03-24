import 'server-only';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const AGENT_TOKEN_COOKIE = 'agent_token';

const AGENT_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getStrapiBaseUrl() {
  const baseUrl = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_STRAPI_URL is not configured.');
  }

  return baseUrl;
}

export function getAgentCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AGENT_TOKEN_MAX_AGE_SECONDS,
  };
}

export async function getAgentToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AGENT_TOKEN_COOKIE)?.value || null;
}

export function clearAgentCookie(response) {
  response.cookies.set(AGENT_TOKEN_COOKIE, '', {
    ...getAgentCookieOptions(),
    maxAge: 0,
  });

  return response;
}

export function createUnauthorizedResponse(message = 'You must be logged in.') {
  return clearAgentCookie(NextResponse.json({ message }, { status: 401 }));
}

export async function fetchStrapi(path, options = {}) {
  const { token, headers, ...rest } = options;
  const requestHeaders = new Headers(headers || {});

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`${getStrapiBaseUrl()}${path}`, {
    ...rest,
    headers: requestHeaders,
    cache: rest.cache || 'no-store',
  });
}

export async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
