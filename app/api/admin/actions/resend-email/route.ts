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
	const route = '/api/admin/actions/resend-email';

	const admin = await requireAdmin(req);
	if (!('ok' in admin)) {
		return NextResponse.json({ error: admin.message }, { status: 403 });
	}

	const sources = await requireAdminAnalyticsSources();
	if (!admin.isOwner && !sources.ok) {
		return NextResponse.json({ error: sources.message }, { status: 503 });
	}

	let userId: string | null = null;
	let template: string | null = null;
	try {
		const body = (await req.json()) as { userId?: unknown; template?: unknown };
		userId = typeof body.userId === 'string' ? body.userId.trim() : null;
		template = typeof body.template === 'string' ? body.template.trim() : null;
	} catch {
		return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
	}

	if (!userId) {
		return NextResponse.json({ error: 'Missing required field: userId' }, { status: 400 });
	}

	const resolvedTemplate = template && template.length > 0 ? template : 'resend';

	try {
		const user = await dbQuery<{ email: string }>(`SELECT email FROM users WHERE id::text = $1`, [userId]);
		const email = user.rows[0]?.email;
		if (!email) {
			return NextResponse.json({ error: 'User not found.' }, { status: 404 });
		}

		const inserted = await dbQuery<{ id: string }>(
			`INSERT INTO email_outbox (recipient, template, payload) VALUES ($1, $2, $3::jsonb) RETURNING id::text`,
			[email, resolvedTemplate, JSON.stringify({ userId })],
		);
		const outboxId = inserted.rows[0]?.id ?? null;

		await appendAuditEvent({
			actorAdminId: admin.adminId,
			action: 'resend_email',
			targetType: 'user',
			targetId: userId,
			reason: null,
			ip: req.headers.get('x-forwarded-for') ?? null,
			userAgent: req.headers.get('user-agent') ?? null,
			metadata: { route, outboxId, template: resolvedTemplate },
		});

		return NextResponse.json({ ok: true, outboxId }, { status: 202 });
	} finally {
		const durationMs = Date.now() - started;
		try {
			await recordApiMetric({ route, method: 'POST', statusCode: 202, durationMs });
		} catch {
			// Non-blocking telemetry.
		}
	}
}
