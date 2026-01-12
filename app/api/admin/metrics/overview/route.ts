import 'server-only';

import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin/guard';
import { requireAdminAnalyticsSources } from '@/lib/admin/sources';
import { recordApiMetric } from '@/lib/admin/telemetry';
import { dbQuery } from '@/lib/db';

export const runtime = 'nodejs';

type CountRow = { count: string };

async function getCount(sql: string, params: readonly unknown[] = []): Promise<number> {
	const result = await dbQuery<CountRow>(sql, params);
	const raw = result.rows[0]?.count ?? '0';
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(req: Request) {
	const started = Date.now();
	const route = '/api/admin/metrics/overview';

	const admin = await requireAdmin(req);
	if (!('ok' in admin)) {
		return NextResponse.json({ error: admin.message }, { status: 403 });
	}

	const sources = await requireAdminAnalyticsSources();
	if (!admin.isOwner && !sources.ok) {
		return NextResponse.json({ error: sources.message }, { status: 503 });
	}

	try {
		const [users, companies, jobs, messages, auditEvents, emailEvents, apiCalls24h] = await Promise.all([
			getCount('SELECT COUNT(*)::text AS count FROM users'),
			getCount('SELECT COUNT(*)::text AS count FROM companies'),
			getCount('SELECT COUNT(*)::text AS count FROM jobs'),
			getCount('SELECT COUNT(*)::text AS count FROM messages'),
			getCount('SELECT COUNT(*)::text AS count FROM audit_events'),
			getCount('SELECT COUNT(*)::text AS count FROM email_events'),
			getCount("SELECT COUNT(*)::text AS count FROM api_metrics WHERE created_at > now() - interval '24 hours'"),
		]);

		const statusRows = await dbQuery<{ status: string; count: string }>(
			`SELECT status, COUNT(*)::text AS count FROM jobs GROUP BY status ORDER BY count DESC`,
		);

		return NextResponse.json(
			{
				ok: true,
				totals: {
					users,
					companies,
					jobs,
					messages,
					auditEvents,
					emailEvents,
				},
				api: { callsLast24h: apiCalls24h },
				jobsByStatus: statusRows.rows.map((r) => ({ status: r.status, count: Number.parseInt(r.count, 10) || 0 })),
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
