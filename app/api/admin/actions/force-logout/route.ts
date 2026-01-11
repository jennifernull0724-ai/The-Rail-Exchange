import 'server-only';

import '@/lib/env';

import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin/guard';
import { requireAdminAnalyticsSources } from '@/lib/admin/sources';
import { appendAuditEvent } from '@/lib/admin/audit';
import { recordApiMetric } from '@/lib/admin/telemetry';
import { dbQuery } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
	const started = Date.now();
	const route = '/api/admin/actions/force-logout';

	const admin = await requireAdmin(req);
	if (!('ok' in admin)) {
		return NextResponse.json({ error: admin.message }, { status: 403 });
	}

	const sources = await requireAdminAnalyticsSources();
	if (!admin.isOwner && !sources.ok) {
		return NextResponse.json({ error: sources.message }, { status: 503 });
	}

	let userId: string | null = null;
	let reason: string | null = null;
	try {
		const body = (await req.json()) as { userId?: unknown; reason?: unknown };
		userId = typeof body.userId === 'string' ? body.userId.trim() : null;
		reason = typeof body.reason === 'string' ? body.reason.trim() : null;
	} catch {
		return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
	}

	if (!userId) {
		return NextResponse.json({ error: 'Missing required field: userId' }, { status: 400 });
	}

	try {
		const ownerCheck = await dbQuery<{ is_owner: boolean }>(
			`SELECT is_owner FROM users WHERE id::text = $1 LIMIT 1`,
			[userId],
		);
		if (ownerCheck.rows[0]?.is_owner) {
			return NextResponse.json({ error: 'BLOCKED: System owner cannot be locked out.' }, { status: 403 });
		}

		const inserted = await dbQuery<{ id: string }>(
			`INSERT INTO force_logout_requests (user_id, reason) VALUES ($1, $2) RETURNING id::text`,
			[userId, reason],
		);

		const requestId = inserted.rows[0]?.id ?? null;

		await appendAuditEvent({
			actorAdminId: admin.adminId,
			action: 'force_logout',
			targetType: 'user',
			targetId: userId,
			reason: reason ?? null,
			ip: req.headers.get('x-forwarded-for') ?? null,
			userAgent: req.headers.get('user-agent') ?? null,
			metadata: { route, requestId },
		});

		return NextResponse.json({ ok: true, requestId }, { status: 202 });
	} finally {
		const durationMs = Date.now() - started;
		try {
			await recordApiMetric({ route, method: 'POST', statusCode: 202, durationMs });
		} catch {
			// Non-blocking telemetry.
		}
	}
}
