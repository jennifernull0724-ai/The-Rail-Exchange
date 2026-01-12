import 'server-only';

import { notImplemented } from '@/lib/api/json';

export const runtime = 'nodejs';

export async function POST() {
  return notImplemented('Message attachments require signed upload URLs (S3/GCS) which are not configured here.');
}
