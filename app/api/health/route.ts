import 'server-only';

import { NextResponse } from 'next/server';

import { dbQuery } from '@/lib/db';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { okJson } from '@/lib/api/json';

export const runtime = 'nodejs';

export async function GET() {
  let dbStatus: 'ok' | 'blocked' = 'ok';
  try {
    await dbQuery('SELECT 1');
  } catch {
    dbStatus = 'blocked';
  }

  let authStatus: 'ok' | 'blocked' = 'ok';
  try {
    const supabase = getSupabaseServerClient();
    await supabase.auth.getUser();
  } catch {
    authStatus = 'blocked';
  }

  return okJson({ ok: true, services: { db: dbStatus, auth: authStatus } }, 200);
}
