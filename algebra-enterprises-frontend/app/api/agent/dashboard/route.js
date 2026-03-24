import { NextResponse } from 'next/server';

import {
  createUnauthorizedResponse,
  fetchStrapi,
  getAgentToken,
  parseJsonSafely,
} from '@/lib/agent-auth';

export const dynamic = 'force-dynamic';

function getPropertyCodes(properties) {
  return (properties || []).map((property) => property?.Property_Code).filter(Boolean);
}

export async function GET() {
  const token = await getAgentToken();

  if (!token) {
    return createUnauthorizedResponse();
  }

  const meResponse = await fetchStrapi('/api/users/me', { token });

  if (meResponse.status === 401) {
    return createUnauthorizedResponse('Your session has expired.');
  }

  if (!meResponse.ok) {
    return NextResponse.json({ message: 'Unable to load agent profile.' }, { status: 500 });
  }

  const propertiesResponse = await fetchStrapi('/api/properties/my-properties', { token });

  if (propertiesResponse.status === 401) {
    return createUnauthorizedResponse('Your session has expired.');
  }

  if (!propertiesResponse.ok) {
    return NextResponse.json({ message: 'Unable to load properties.' }, { status: 500 });
  }

  const agent = await parseJsonSafely(meResponse);
  const propertiesPayload = await parseJsonSafely(propertiesResponse);
  const properties = propertiesPayload?.data || [];
  const propertyCodes = getPropertyCodes(properties);

  if (propertyCodes.length === 0) {
    return NextResponse.json({ agent, properties, enquiries: [] });
  }

  const enquiriesResponse = await fetchStrapi(
    '/api/enquiries?pagination[limit]=100&sort=createdAt:desc',
    { token }
  );

  if (enquiriesResponse.status === 401) {
    return createUnauthorizedResponse('Your session has expired.');
  }

  if (!enquiriesResponse.ok) {
    return NextResponse.json({ message: 'Unable to load enquiries.' }, { status: 500 });
  }

  const enquiriesPayload = await parseJsonSafely(enquiriesResponse);
  const enquiries = (enquiriesPayload?.data || []).filter((enquiry) =>
    propertyCodes.includes(enquiry?.Property_Code)
  );

  return NextResponse.json({ agent, properties, enquiries });
}
