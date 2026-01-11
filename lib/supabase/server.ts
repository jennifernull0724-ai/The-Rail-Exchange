import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

function requireEnv(key: 'SUPABASE_URL' | 'SUPABASE_ANON_KEY'): string {
	const value = process.env[key];
	if (!value || value.trim().length === 0) {
		throw new Error(`BLOCKED: Missing required env var ${key}`);
	}
	return value;
}

export function getSupabaseServerClient(): SupabaseClient {
	const url = requireEnv('SUPABASE_URL');
	const anonKey = requireEnv('SUPABASE_ANON_KEY');
	const cookieStore = cookies();

	return createServerClient(url, anonKey, {
		cookies: {
			get(name: string) {
				return cookieStore.get(name)?.value;
			},
			set(name: string, value: string, options: CookieOptions) {
				cookieStore.set({ name, value, ...options });
			},
			remove(name: string, options: CookieOptions) {
				cookieStore.set({ name, value: '', ...options });
			},
		},
	});
}
