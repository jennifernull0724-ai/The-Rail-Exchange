import 'server-only';

import { dbQuery } from '@/lib/db';
import { getServerAuthContext } from '@/lib/auth';
import { blockedJson, forbidden, okJson, unauthorized } from '@/lib/api/json';

export const runtime = 'nodejs';

export async function GET() {
  let auth;
  try {
    auth = await getServerAuthContext();
  } catch (err) {
    return unauthorized(err instanceof Error ? err.message : 'Not authenticated.');
  }

  if (auth.role !== 'admin' && !auth.isOwner) {
    return forbidden('Admin access required.');
  }

  try {
    const res = await dbQuery<{ id: string; email: string | null; role: string; disabled: boolean }>(
      'SELECT id::text as id, email, role, disabled FROM users ORDER BY created_at DESC NULLS LAST LIMIT 500',
    );

    return okJson({ items: res.rows }, 200);
  } catch (err) {
    return blockedJson('missing_dependency', err instanceof Error ? err.message : String(err), 501);
  }
}
