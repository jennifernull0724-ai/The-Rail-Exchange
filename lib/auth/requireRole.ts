import 'server-only';

import { getServerAuthContext, type ServerAuthContext, type UserRole } from '@/lib/auth';

export async function requireRole(role: UserRole): Promise<ServerAuthContext> {
	const auth = await getServerAuthContext();

	// Treat system owner as admin-equivalent for access checks.
	const effectiveRole: UserRole = auth.isOwner ? 'admin' : auth.role;

	if (auth.disabled && !auth.isOwner) {
		throw new Error('BLOCKED: User disabled.');
	}

	if (effectiveRole !== role) {
		throw new Error('BLOCKED: Forbidden.');
	}

	return auth;
}
