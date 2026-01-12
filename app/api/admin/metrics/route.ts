import 'server-only';

import { NextResponse } from 'next/server';

import { getServerAuthContext } from '@/lib/auth';
import { dbQuery } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  let auth;
  try {
    auth = await getServerAuthContext();
  } catch (err) {
    return NextResponse.json(
      { error: 'BLOCKED', reason: 'unauthorized', message: err instanceof Error ? err.message : 'Not authenticated.' },
      { status: 401 },
    );
  }

  if (auth.role !== 'admin' && !auth.isOwner) {
    return NextResponse.json({ error: 'BLOCKED', reason: 'forbidden', message: 'Admin access required.' }, { status: 403 });
  }

  try {
    const usersRes = await dbQuery<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
    const users = Number.parseInt(usersRes.rows[0]?.count ?? '0', 10) || 0;

    // This repo's core product uses JobRequest; companies may not exist.
    let companies = 0;
    try {
      const companiesRes = await dbQuery<{ count: string }>('SELECT COUNT(*)::text AS count FROM companies');
      companies = Number.parseInt(companiesRes.rows[0]?.count ?? '0', 10) || 0;
    } catch {
      companies = 0;
    }

    let jobs = 0;
    try {
      const jobsRes = await dbQuery<{ count: string }>('SELECT COUNT(*)::text AS count FROM "JobRequest"');
      jobs = Number.parseInt(jobsRes.rows[0]?.count ?? '0', 10) || 0;
    } catch {
      jobs = 0;
    }

    return NextResponse.json({ users, companies, jobs }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'BLOCKED', reason: 'missing_dependency', message: err instanceof Error ? err.message : String(err) },
      { status: 501 },
    );
  }
}
