import 'server-only';

import { dbQuery } from '@/lib/db';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export type UserRole = 'admin' | 'contractor' | 'logistics';

export type ServerAuthContext = {
  userId: string;
  role: UserRole;
  isOwner: boolean;
  disabled: boolean;
};

export class AuthContextError extends Error {
  override name = 'AuthContextError';
}

type UserRow = {
	role: string;
	is_owner: boolean;
	disabled: boolean;
};

function parseUserRole(value: string): UserRole {
	if (value === 'admin' || value === 'contractor' || value === 'logistics') return value;
	if (value === 'logistics_company') return 'logistics';
	throw new AuthContextError('BLOCKED: Invalid user role.');
}

/**
 * Server-only auth context accessor.
 *
 * Identity is sourced from the Supabase session cookie; authorization is sourced from the app DB.
 */
export async function getServerAuthContext(): Promise<ServerAuthContext> {
	const supabase = getSupabaseServerClient();
	const { data, error } = await supabase.auth.getUser();
	if (error || !data.user) {
		throw new AuthContextError('BLOCKED: Not authenticated.');
	}

	const userId = data.user.id;
	const result = await dbQuery<UserRow>(
		`SELECT role, is_owner, disabled FROM users WHERE id::text = $1 LIMIT 1`,
		[userId],
	);
	const row = result.rows[0];
	if (!row) {
		throw new AuthContextError('BLOCKED: User not provisioned.');
	}

	return {
		userId,
		role: parseUserRole(row.role),
		isOwner: row.is_owner,
		disabled: row.disabled,
	};
}
