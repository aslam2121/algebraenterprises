import { NextResponse } from 'next/server';

import {
  createUnauthorizedResponse,
  fetchStrapi,
  getAgentToken,
  parseJsonSafely,
} from '@/lib/agent-auth';

export async function PUT(request, { params }) {
  const token = await getAgentToken();

  if (!token) {
    return createUnauthorizedResponse();
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 });
  }

  const status = typeof body?.status === 'string' ? body.status.trim() : '';

  if (!status) {
    return NextResponse.json({ message: 'Status is required.' }, { status: 400 });
  }

  const { documentId } = await params;
  const response = await fetchStrapi(`/api/properties/${documentId}`, {
    method: 'PUT',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        Property_Status: status,
      },
    }),
  });

  if (response.status === 401) {
    return createUnauthorizedResponse('Your session has expired.');
  }

  const payload = await parseJsonSafely(response);

  return NextResponse.json(payload, { status: response.status });
}
