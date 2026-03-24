import { NextResponse } from 'next/server';

import {
  createUnauthorizedResponse,
  fetchStrapi,
  getAgentToken,
  parseJsonSafely,
} from '@/lib/agent-auth';

export async function POST(request) {
  const token = await getAgentToken();

  if (!token) {
    return createUnauthorizedResponse();
  }

  const formData = await request.formData();
  const response = await fetchStrapi('/api/properties/my-properties', {
    method: 'POST',
    token,
    body: formData,
  });

  if (response.status === 401) {
    return createUnauthorizedResponse('Your session has expired.');
  }

  const payload = await parseJsonSafely(response);

  return NextResponse.json(payload, { status: response.status });
}
