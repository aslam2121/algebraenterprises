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

  const { documentId } = await params;
  const formData = await request.formData();
  const response = await fetchStrapi(`/api/properties/my-properties/${documentId}`, {
    method: 'PUT',
    token,
    body: formData,
  });

  if (response.status === 401) {
    return createUnauthorizedResponse('Your session has expired.');
  }

  const payload = await parseJsonSafely(response);

  return NextResponse.json(payload, { status: response.status });
}
