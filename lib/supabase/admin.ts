import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function requireEnv(key: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'): string {
	const value = process.env[key];
	if (!value || value.trim().length === 0) {
		throw new Error(`BLOCKED: Missing required env var ${key}`);
	}
	return value;
}

export function getSupabaseAdminClient(): SupabaseClient {
	const url = requireEnv('SUPABASE_URL');
	const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

	return createClient(url, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}
