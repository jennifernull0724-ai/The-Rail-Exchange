import 'server-only';

import '@/lib/env';

import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin/guard';
import { requireAdminAnalyticsSources } from '@/lib/admin/sources';
import { recordApiMetric } from '@/lib/admin/telemetry';
import { dbQuery } from '@/lib/db';

export const runtime = 'nodejs';

type CountRow = { count: string };

async function getCount(sql: string): Promise<number> {
	const result = await dbQuery<CountRow>(sql);
	const raw = result.rows[0]?.count ?? '0';
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(req: Request) {
	const started = Date.now();
	const route = '/api/admin/metrics/messages';

	const admin = await requireAdmin(req);
	if (!('ok' in admin)) {
		return NextResponse.json({ error: admin.message }, { status: 403 });
	}

	const sources = await requireAdminAnalyticsSources();
	if (!admin.isOwner && !sources.ok) {
		return NextResponse.json({ error: sources.message }, { status: 503 });
	}

	try {
		const [created24h, delivered24h] = await Promise.all([
			getCount("SELECT COUNT(*)::text AS count FROM messages WHERE created_at > now() - interval '24 hours'"),
			getCount(
				"SELECT COUNT(*)::text AS count FROM messages WHERE delivered_at IS NOT NULL AND created_at > now() - interval '24 hours'",
			),
		]);

		const latencyRow = await dbQuery<{ avg_sec: number | null; p95_sec: number | null }>(
			`
				SELECT
					AVG(EXTRACT(EPOCH FROM (delivered_at - created_at))) AS avg_sec,
					PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (delivered_at - created_at))) AS p95_sec
				FROM messages
				WHERE delivered_at IS NOT NULL
				  AND created_at > now() - interval '7 days'
			`,
		);

		const avgLatencySeconds = latencyRow.rows[0]?.avg_sec ?? null;
		const p95LatencySeconds = latencyRow.rows[0]?.p95_sec ?? null;
		const deliveryRate = created24h === 0 ? null : delivered24h / created24h;

		return NextResponse.json(
			{
				ok: true,
				last24h: { created: created24h, delivered: delivered24h, deliveryRate },
				latencySeconds: { avg: avgLatencySeconds, p95: p95LatencySeconds },
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
