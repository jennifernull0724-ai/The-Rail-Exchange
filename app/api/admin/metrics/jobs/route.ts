import 'server-only';

import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin/guard';
import { requireAdminAnalyticsSources } from '@/lib/admin/sources';
import { recordApiMetric } from '@/lib/admin/telemetry';
import { dbQuery } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: Request) {
	const started = Date.now();
	const route = '/api/admin/metrics/jobs';

	const admin = await requireAdmin(req);
	if (!('ok' in admin)) {
		return NextResponse.json({ error: admin.message }, { status: 403 });
	}

	const sources = await requireAdminAnalyticsSources();
	if (!admin.isOwner && !sources.ok) {
		return NextResponse.json({ error: sources.message }, { status: 503 });
	}

	try {
		const statusRows = await dbQuery<{ status: string; count: string }>(
			`SELECT status, COUNT(*)::text AS count FROM jobs GROUP BY status ORDER BY count DESC`,
		);

		const trendRows = await dbQuery<{ day: string; count: string }>(
			`
				SELECT date_trunc('day', created_at)::date::text AS day, COUNT(*)::text AS count
				FROM jobs
				WHERE created_at > now() - interval '14 days'
				GROUP BY 1
				ORDER BY 1 ASC
			`,
		);

		return NextResponse.json(
			{
				ok: true,
				byStatus: statusRows.rows.map((r) => ({ status: r.status, count: Number.parseInt(r.count, 10) || 0 })),
				createdPerDay: trendRows.rows.map((r) => ({ day: r.day, count: Number.parseInt(r.count, 10) || 0 })),
			},
			{ status: 200 },
		);
	} finally {
		const durationMs = Date.now() - started;
		try {
			await recordApiMetric({ route, method: 'GET', statusCode: 200, durationMs });
		} catch {
			// Non-blocking telemetry.
		}
	}
}
