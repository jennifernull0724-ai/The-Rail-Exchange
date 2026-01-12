import 'server-only';

import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin/guard';
import { requireAdminAnalyticsSources } from '@/lib/admin/sources';
import { appendAuditEvent } from '@/lib/admin/audit';
import { recordApiMetric } from '@/lib/admin/telemetry';
import { dbQuery } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
	const started = Date.now();
	const route = '/api/admin/actions/disable-company';

	const admin = await requireAdmin(req);
	if (!('ok' in admin)) {
		return NextResponse.json({ error: admin.message }, { status: 403 });
	}

	const sources = await requireAdminAnalyticsSources();
	if (!admin.isOwner && !sources.ok) {
		return NextResponse.json({ error: sources.message }, { status: 503 });
	}

	let companyId: string | null = null;
	let reason: string | null = null;
	try {
		const body = (await req.json()) as { companyId?: unknown; reason?: unknown };
		companyId = typeof body.companyId === 'string' ? body.companyId.trim() : null;
		reason = typeof body.reason === 'string' ? body.reason.trim() : null;
	} catch {
		return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
	}

	if (!companyId) {
		return NextResponse.json({ error: 'Missing required field: companyId' }, { status: 400 });
	}

	try {
		const updated = await dbQuery<{ id: string }>(
			`UPDATE companies SET status = 'disabled', disabled_at = now() WHERE id = $1 AND status <> 'disabled' RETURNING id`,
			[companyId],
		);

		if (updated.rowCount === 0) {
			const exists = await dbQuery<{ id: string }>(`SELECT id FROM companies WHERE id = $1`, [companyId]);
			if (exists.rowCount === 0) {
				return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
			}
		}

		await appendAuditEvent({
			actorAdminId: admin.adminId,
			action: 'disable_company',
			targetType: 'company',
			targetId: companyId,
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
