import 'server-only';

import '@/lib/env';
import { NextResponse } from 'next/server';
import { ensureContractorAccess } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function GET() {
  const access = ensureContractorAccess();
  if (!access.authorized) {
    return NextResponse.json(
      { error: `Access denied: ${access.reason ?? 'Authorization not implemented.'}` },
      { status: access.status },
    );
  }

  return NextResponse.json(
    {
      error:
        'BLOCKED: No real persistence layer is declared in this codebase (no database schema/client). Cannot query open Job Requests durably.',
    },
    { status: 501 },
  );
}
