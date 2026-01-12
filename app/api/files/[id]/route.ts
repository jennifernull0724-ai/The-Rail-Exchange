import 'server-only';

import { missingDep } from '@/lib/api/json';

export const runtime = 'nodejs';

export async function GET() {
  return missingDep('Signed file reads require storage provider configuration and are not wired to this API yet.');
}
