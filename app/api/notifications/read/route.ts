import 'server-only';

import { notImplemented } from '@/lib/api/json';

export const runtime = 'nodejs';

export async function POST() {
  return notImplemented('Notifications are not implemented yet.');
}
