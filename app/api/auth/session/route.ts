import 'server-only';

import { blockedJson, okJson, unauthorized } from '@/lib/api/json';
import { getServerAuthContext } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const auth = await getServerAuthContext();
    return okJson({ user: { id: auth.userId, role: auth.role } }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('not authenticated')) {
      return unauthorized('Not authenticated.');
    }
    return blockedJson('missing_dependency', msg, 501);
  }
}
