import 'server-only';

import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin/guard';
import { requireAdminAnalyticsSources } from '@/lib/admin/sources';
import { recordApiMetric } from '@/lib/admin/telemetry';
import { dbQuery } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: Request) {
	const started = Date.now();
	const route = '/api/admin/metrics/email';

	const admin = await requireAdmin(req);
	if (!('ok' in admin)) {
		return NextResponse.json({ error: admin.message }, { status: 403 });
	}

	const sources = await requireAdminAnalyticsSources();
	if (!admin.isOwner && !sources.ok) {
		return NextResponse.json({ error: sources.message }, { status: 503 });
	}

	try {
		const rows = await dbQuery<{ event_type: string; count: string }>(
			`
				SELECT event_type, COUNT(*)::text AS count
				FROM email_events
				WHERE created_at > now() - interval '7 days'
				GROUP BY event_type
				ORDER BY count DESC
			`,
		);

		return NextResponse.json(
			{
				ok: true,
				last7dByEventType: rows.rows.map((r) => ({ eventType: r.event_type, count: Number.parseInt(r.count, 10) || 0 })),
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
