import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

function getEnv(key: 'SUPABASE_URL' | 'SUPABASE_ANON_KEY'): string | null {
	const value = process.env[key];
	if (!value || value.trim().length === 0) return null;
	return value;
}

export async function middleware(request: NextRequest) {
	const url = getEnv('SUPABASE_URL');
	const anonKey = getEnv('SUPABASE_ANON_KEY');

	// Allow the app to run even if Supabase isn't configured yet.
	// Login/auth routes will return BLOCKED with missing env guidance.
	if (!url || !anonKey) {
		return NextResponse.next();
	}

	// Create a response we can attach updated auth cookies to.
	let response = NextResponse.next({
		request: {
			headers: request.headers,
		},
	});

	const supabase = createServerClient(url, anonKey, {
		cookies: {
			get(name: string) {
				return request.cookies.get(name)?.value;
			},
			set(name: string, value: string, options: CookieOptions) {
				// Keep the incoming request cookie jar in sync for this middleware run.
				request.cookies.set(name, value);
				response = NextResponse.next({
					request: {
						headers: request.headers,
					},
				});
				response.cookies.set({ name, value, ...options });
			},
			remove(name: string, options: CookieOptions) {
				request.cookies.set(name, '');
				response = NextResponse.next({
					request: {
						headers: request.headers,
					},
				});
				response.cookies.set({ name, value: '', ...options });
			},
		},
	});

	// Refresh session cookie if needed.
	await supabase.auth.getUser();

	return response;
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
