import 'server-only';

import { dbQuery } from '@/lib/db';
import { getServerAuthContext } from '@/lib/auth';
import { badRequest, blockedJson, forbidden, okJson, unauthorized } from '@/lib/api/json';

export const runtime = 'nodejs';

type Body = { userId?: unknown };

export async function POST(req: Request) {
  let auth;
  try {
    auth = await getServerAuthContext();
  } catch (err) {
    return unauthorized(err instanceof Error ? err.message : 'Not authenticated.');
  }

  if (auth.role !== 'admin' && !auth.isOwner) {
    return forbidden('Admin access required.');
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return badRequest('Invalid JSON body.');
  }

  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  if (!userId) return badRequest('userId is required');

  try {
    await dbQuery('UPDATE users SET disabled = true WHERE id::text = $1', [userId]);
    return okJson({ ok: true }, 200);
  } catch (err) {
    return blockedJson('missing_dependency', err instanceof Error ? err.message : String(err), 501);
  }
}
