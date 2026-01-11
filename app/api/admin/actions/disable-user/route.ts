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
	const route = '/api/admin/actions/disable-user';

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
			return NextResponse.json({ error: 'BLOCKED: System owner cannot be disabled.' }, { status: 403 });
		}

		const updated = await dbQuery<{ id: string }>(
			`UPDATE users SET disabled = true WHERE id::text = $1 AND COALESCE(disabled, false) = false AND COALESCE(is_owner, false) = false RETURNING id::text as id`,
			[userId],
		);

		if (updated.rowCount === 0) {
			const exists = await dbQuery<{ id: string }>(`SELECT id::text as id FROM users WHERE id::text = $1`, [userId]);
			if (exists.rowCount === 0) {
				return NextResponse.json({ error: 'User not found.' }, { status: 404 });
			}
		}

		await appendAuditEvent({
			actorAdminId: admin.adminId,
			action: 'disable_user',
			targetType: 'user',
			targetId: userId,
			reason: reason ?? null,
			ip: req.headers.get('x-forwarded-for') ?? null,
			userAgent: req.headers.get('user-agent') ?? null,
			metadata: { route },
		});

		return NextResponse.json({ ok: true }, { status: 200 });
	} finally {
		const durationMs = Date.now() - started;
		try {
			await recordApiMetric({ route, method: 'POST', statusCode: 200, durationMs });
		} catch {
			// Non-blocking telemetry.
		}
	}
}
