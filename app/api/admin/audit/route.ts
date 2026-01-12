import 'server-only';

import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin/guard';
import { requireAdminAnalyticsSources } from '@/lib/admin/sources';
import { recordApiMetric } from '@/lib/admin/telemetry';
import { dbQuery } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: Request) {
	const started = Date.now();
	const route = '/api/admin/audit';

	const admin = await requireAdmin(req);
	if (!('ok' in admin)) {
		return NextResponse.json({ error: admin.message }, { status: 403 });
	}

	const sources = await requireAdminAnalyticsSources();
	if (!admin.isOwner && !sources.ok) {
		return NextResponse.json({ error: sources.message }, { status: 503 });
	}

	try {
		const rows = await dbQuery<{
			id: string;
			created_at: string;
			action: string;
			actor_admin_id: string;
			target_type: string | null;
			target_id: string | null;
			reason: string | null;
			metadata: unknown;
			ip: string | null;
			user_agent: string | null;
		}>(
			`SELECT id::text, created_at::text, action, actor_admin_id, target_type, target_id, reason, metadata, ip, user_agent
			 FROM audit_events
			 ORDER BY created_at DESC
			 LIMIT 100`,
		);

		return NextResponse.json({ ok: true, events: rows.rows }, { status: 200 });
	} finally {
		const durationMs = Date.now() - started;
		try {
			await recordApiMetric({ route, method: 'GET', statusCode: 200, durationMs });
		} catch {
			// Non-blocking telemetry.
		}
	}
}
