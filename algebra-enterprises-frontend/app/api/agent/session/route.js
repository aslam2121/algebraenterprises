import { NextResponse } from 'next/server';

import {
  createUnauthorizedResponse,
  fetchStrapi,
  getAgentToken,
  parseJsonSafely,
} from '@/lib/agent-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = await getAgentToken();

  if (!token) {
    return createUnauthorizedResponse();
  }

  const response = await fetchStrapi('/api/users/me', { token });

  if (response.status === 401) {
    return createUnauthorizedResponse('Your session has expired.');
  }

  if (!response.ok) {
    return NextResponse.json({ message: 'Unable to load agent session.' }, { status: 500 });
  }

  const user = await parseJsonSafely(response);

  return NextResponse.json({ user });
}
