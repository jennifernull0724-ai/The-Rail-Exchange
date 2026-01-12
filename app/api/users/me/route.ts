import 'server-only';

import { dbQuery } from '@/lib/db';
import { getServerAuthContext } from '@/lib/auth';
import { blockedJson, okJson, unauthorized } from '@/lib/api/json';

export const runtime = 'nodejs';

export async function GET() {
  let auth;
  try {
    auth = await getServerAuthContext();
  } catch (err) {
    return unauthorized(err instanceof Error ? err.message : 'Not authenticated.');
  }

  try {
    const res = await dbQuery<{ id: string; email: string | null; role: string }>(
      'SELECT id::text as id, email, role FROM users WHERE id::text = $1 LIMIT 1',
      [auth.userId],
    );
    const row = res.rows[0];
    if (!row) {
      return blockedJson('missing_dependency', 'User not provisioned.', 501);
    }
    return okJson({ id: row.id, email: row.email, role: row.role }, 200);
  } catch (err) {
    return blockedJson('missing_dependency', err instanceof Error ? err.message : String(err), 501);
  }
}

export async function PATCH() {
  return blockedJson('not_implemented', 'User profile fields not implemented in this schema.', 501);
}
