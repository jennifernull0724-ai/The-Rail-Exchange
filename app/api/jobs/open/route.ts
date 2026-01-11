import 'server-only';

import '@/lib/env';
import { NextResponse } from 'next/server';
import { ensureContractorAccess } from '@/lib/permissions';
import { getOpenJobRequestsForContractor } from '@/lib/repositories/jobRequests.read';

export const runtime = 'nodejs';

export async function GET() {
  const access = await ensureContractorAccess();
  if (!access.authorized) {
    return NextResponse.json(
      { error: `Access denied: ${access.reason ?? 'Authorization not implemented.'}` },
      { status: access.status },
    );
  }

  try {
    const jobs = await getOpenJobRequestsForContractor();
    return NextResponse.json({ jobs }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: `BLOCKED: Failed to query open Job Requests. ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
