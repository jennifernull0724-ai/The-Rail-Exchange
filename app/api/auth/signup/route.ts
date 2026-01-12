import 'server-only';

import { NextResponse } from 'next/server';

import { badRequest, blockedJson, okJson } from '@/lib/api/json';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { dbQuery } from '@/lib/db';

export const runtime = 'nodejs';

type SignupBody = { email?: unknown; password?: unknown; role?: unknown };

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function parseRole(value: unknown): 'logistics' | 'contractor' {
  const role = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (role === 'logistics' || role === 'contractor') return role;
  throw new Error('role must be logistics|contractor');
}

export async function POST(req: Request) {
  let body: SignupBody;
  try {
    body = (await req.json()) as SignupBody;
  } catch {
    return badRequest('Invalid JSON body.');
  }

  const emailRaw = typeof body.email === 'string' ? body.email : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!emailRaw.trim()) return badRequest('email is required');
  if (!password.trim()) return badRequest('password is required');

  let role: 'logistics' | 'contractor';
  try {
    role = parseRole(body.role);
  } catch (err) {
    return badRequest(err instanceof Error ? err.message : 'Invalid role');
  }

  const email = normalizeEmail(emailRaw);

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdminClient();
  } catch (err) {
    return blockedJson('missing_dependency', err instanceof Error ? err.message : 'Supabase admin not configured.', 501);
  }

  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (created.error || !created.data.user) {
    return blockedJson('invalid_request', created.error?.message ?? 'Failed to create user.', 400);
  }

  const userId = created.data.user.id;

  try {
    await dbQuery(
      'INSERT INTO users (id, email, role, is_owner, disabled) VALUES ($1, $2, $3, false, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role',
      [userId, email, role],
    );
  } catch (err) {
    return blockedJson('missing_dependency', `Failed to provision users row. ${err instanceof Error ? err.message : String(err)}`, 501);
  }

  return okJson({ userId, role }, 200);
}
