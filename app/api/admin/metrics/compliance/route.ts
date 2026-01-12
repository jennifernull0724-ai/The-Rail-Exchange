import 'server-only';

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
	const route = '/api/admin/metrics/compliance';

	const admin = await requireAdmin(req);
	if (!('ok' in admin)) {
		return NextResponse.json({ error: admin.message }, { status: 403 });
	}

	const sources = await requireAdminAnalyticsSources();
	if (!admin.isOwner && !sources.ok) {
		return NextResponse.json({ error: sources.message }, { status: 503 });
	}

	try {
		const [
			certsExpiring30d,
			certsExpired,
			docsExpiring30d,
			docsExpired,
		] = await Promise.all([
			getCount(
				"SELECT COUNT(*)::text AS count FROM certifications WHERE expires_at IS NOT NULL AND expires_at >= now() AND expires_at < now() + interval '30 days'",
			),
			getCount("SELECT COUNT(*)::text AS count FROM certifications WHERE expires_at IS NOT NULL AND expires_at < now()"),
			getCount(
				"SELECT COUNT(*)::text AS count FROM documents WHERE expires_at IS NOT NULL AND expires_at >= now() AND expires_at < now() + interval '30 days'",
			),
			getCount("SELECT COUNT(*)::text AS count FROM documents WHERE expires_at IS NOT NULL AND expires_at < now()"),
		]);

		return NextResponse.json(
			{
				ok: true,
				certifications: { expiringNext30d: certsExpiring30d, expired: certsExpired },
				documents: { expiringNext30d: docsExpiring30d, expired: docsExpired },
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
