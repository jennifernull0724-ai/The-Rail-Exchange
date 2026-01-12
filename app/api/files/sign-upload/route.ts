import 'server-only';

import { missingDep } from '@/lib/api/json';

export const runtime = 'nodejs';

export async function POST() {
  return missingDep('Signed uploads require storage provider configuration (S3/GCS) and are not wired to this API yet.');
}
