'use server';

import { redirect } from 'next/navigation';

import { dbQuery } from '@/lib/db';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { routeByRole } from '@/lib/auth/routeByRole';

export type LoginActionState = { blocked?: string };

type UserRow = {
	role: 'admin' | 'contractor' | 'logistics';
	is_owner: boolean;
	disabled: boolean;
};

export async function signInAndRoute(
	_prevState: LoginActionState,
	formData: FormData,
): Promise<LoginActionState> {
	const emailRaw = formData.get('email');
	const passwordRaw = formData.get('password');
	const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : '';
	const password = typeof passwordRaw === 'string' ? passwordRaw : '';

	if (!email) return { blocked: 'Email is required.' };
	if (!password) return { blocked: 'Password is required.' };

	let supabase: ReturnType<typeof getSupabaseServerClient>;
	try {
		supabase = getSupabaseServerClient();
	} catch (err) {
		return { blocked: err instanceof Error ? err.message : String(err) };
	}

	try {
		const signIn = await supabase.auth.signInWithPassword({ email, password });
		if (signIn.error) {
			return { blocked: signIn.error.message };
		}

		const userRes = await supabase.auth.getUser();
		const authUserId = userRes.data.user?.id;
		if (!authUserId) {
			await supabase.auth.signOut();
			return { blocked: 'Authentication failed.' };
		}

		const dbUser = await dbQuery<UserRow>(
			`SELECT role, is_owner, disabled FROM users WHERE id::text = $1 LIMIT 1`,
			[authUserId],
		);

		const row = dbUser.rows[0];
		if (!row) {
			await supabase.auth.signOut();
			return { blocked: 'User not provisioned.' };
		}

		if (row.disabled && !row.is_owner) {
			await supabase.auth.signOut();
			return { blocked: 'User disabled.' };
		}

		if (row.is_owner) redirect('/admin');
		// Locked routing rules (server-side only)
		redirect(routeByRole({ role: row.role }));

		await supabase.auth.signOut();
		return { blocked: 'User role invalid.' };
	} catch (err) {
		// Avoid surfacing an unhandled server-action error.
		try {
			await supabase.auth.signOut();
		} catch {
			// ignore
		}
		return { blocked: err instanceof Error ? err.message : String(err) };
	}
}
