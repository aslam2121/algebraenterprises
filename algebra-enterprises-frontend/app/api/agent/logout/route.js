import { NextResponse } from 'next/server';

import { clearAgentCookie } from '@/lib/agent-auth';

export async function POST() {
  return clearAgentCookie(NextResponse.json({ ok: true }));
}
