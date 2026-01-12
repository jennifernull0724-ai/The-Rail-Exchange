import 'server-only';
import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth';
import { getOpenJobRequestsForContractor } from '@/lib/repositories/jobRequests.read';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await getServerAuthContext();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Not authenticated.' },
      { status: 401 },
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
