import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { blockedJson, okJson } from '@/lib/api/json';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const responseForCookies = NextResponse.json({ ok: true });

  let supabase;
  try {
    supabase = createSupabaseRouteClient(request, responseForCookies);
  } catch (err) {
    return blockedJson('missing_dependency', err instanceof Error ? err.message : 'Supabase not configured.', 501);
  }

  await supabase.auth.signOut();

  const finalResponse = NextResponse.json({ ok: true }, { status: 200 });
  for (const cookie of responseForCookies.cookies.getAll()) {
    finalResponse.cookies.set(cookie);
  }
  return finalResponse;
}
