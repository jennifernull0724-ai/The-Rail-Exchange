import 'server-only';

import { NextResponse } from 'next/server';

import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { withDbTransaction } from '@/lib/db';

export const runtime = 'nodejs';

function jsonBlocked(message: string, status = 403) {
	return NextResponse.json({ ok: false, error: message }, { status });
}

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export async function POST(req: Request) {
	let email: string | null = null;
	let password: string | null = null;
	let isJsonRequest = false;

	try {
		const contentType = req.headers.get('content-type') ?? '';
		isJsonRequest = contentType.includes('application/json');
		if (contentType.includes('application/json')) {
			const body = (await req.json()) as { email?: unknown; password?: unknown };
			email = typeof body.email === 'string' ? normalizeEmail(body.email) : null;
			password = typeof body.password === 'string' ? body.password : null;
		} else {
			const form = await req.formData();
			const e = form.get('email');
			const p = form.get('password');
			email = typeof e === 'string' ? normalizeEmail(e) : null;
			password = typeof p === 'string' ? p : null;
		}
	} catch {
		return jsonBlocked('Invalid request body.', 400);
	}

	if (!email || email.length === 0) {
		if (!isJsonRequest) {
			return NextResponse.redirect(new URL('/bootstrap/admin?error=Email%20is%20required.', req.url), 303);
		}
		return jsonBlocked('Email is required.', 400);
	}
	if (!password || password.length === 0) {
		if (!isJsonRequest) {
			return NextResponse.redirect(new URL('/bootstrap/admin?error=Password%20is%20required.', req.url), 303);
		}
		return jsonBlocked('Password is required.', 400);
	}

	// 1..6 per spec. Use a DB transaction for single-init guarantee.
	const supabaseAdmin = getSupabaseAdminClient();
	let createdAuthUserId: string | null = null;

	try {
		await withDbTransaction(async (client) => {
			const state = await client.query<{ value: boolean }>(
				`SELECT value FROM system_state WHERE key = 'admin_created' FOR UPDATE`,
			);
			const adminCreated = state.rows[0]?.value === true;
			if (adminCreated) {
				throw new Error('System already initialized.');
			}

			// 2) Create Supabase auth user.
			const created = await supabaseAdmin.auth.admin.createUser({
				email,
				password,
				email_confirm: true,
			});

			if (created.error || !created.data.user) {
				throw new Error(created.error?.message ?? 'Failed to create Supabase auth user.');
			}

			createdAuthUserId = created.data.user.id;

			// 3) Insert into users table.
			await client.query(
				`INSERT INTO users (id, email, role, is_owner, disabled) VALUES ($1, $2, 'admin', true, false)`,
				[createdAuthUserId, email],
			);

			// 4) Set system_state.admin_created = true
			await client.query(
				`UPDATE system_state SET value = true, updated_at = now() WHERE key = 'admin_created'`,
			);

			// 5) Write audit_event.
			await client.query(
				`INSERT INTO audit_events (actor_admin_id, action, target_type, target_id, metadata)
				 VALUES ($1, 'system_owner_created', 'user', $1, $2::jsonb)`,
				[createdAuthUserId, JSON.stringify({ email })],
			);
		});

		if (!isJsonRequest) {
			return NextResponse.redirect(new URL('/bootstrap/admin?created=1', req.url), 303);
		}
		return NextResponse.json({ ok: true }, { status: 200 });
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);

		// Best-effort rollback: delete auth user if DB transaction failed after auth creation.
		if (createdAuthUserId) {
			try {
				await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
			} catch {
				// Ignore cleanup errors.
			}
		}

		if (message === 'System already initialized.') {
			if (!isJsonRequest) {
				return NextResponse.redirect(
					new URL('/bootstrap/admin?error=System%20already%20initialized.', req.url),
					303,
				);
			}
			return jsonBlocked('System already initialized.', 403);
		}
		if (!isJsonRequest) {
			// Avoid leaking internal details on non-JSON form posts.
			return NextResponse.redirect(new URL('/bootstrap/admin?error=Create%20admin%20failed.', req.url), 303);
		}
		return jsonBlocked(message, 500);
	}
}
