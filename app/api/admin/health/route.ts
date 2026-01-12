import 'server-only';

import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin/guard';
import { requireAdminAnalyticsSources } from '@/lib/admin/sources';
import { dbQuery } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: Request) {
	const admin = await requireAdmin(req);
	if (!('ok' in admin)) {
		return NextResponse.json({ error: admin.message }, { status: 403 });
	}

	const nowIso = new Date().toISOString();

	let dbOk = true;
	let dbError: string | null = null;
	try {
		await dbQuery('SELECT 1');
	} catch (err) {
		dbOk = false;
		dbError = err instanceof Error ? err.message : String(err);
	}

	const sources = await requireAdminAnalyticsSources();

	return NextResponse.json(
		{
			ok: true,
			time: nowIso,
			db: { ok: dbOk, error: dbError },
			sources,
		},
		{ status: 200 },
	);
}
