import 'server-only';

import type { ServerAuthContext } from '@/lib/auth';


export function routeByRole(auth: Pick<ServerAuthContext, 'role'>): '/admin' | '/contractor' | '/company' {
	if (auth.role === 'admin') return '/admin';
	if (auth.role === 'contractor') return '/contractor';
	return '/company';
}
