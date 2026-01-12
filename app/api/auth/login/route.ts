import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { badRequest, blockedJson, okJson, unauthorized } from '@/lib/api/json';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { dbQuery } from '@/lib/db';

export const runtime = 'nodejs';

type LoginBody = { email?: unknown; password?: unknown };

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

type ParsedCredentials = { email: string; password: string } | { error: string };

async function parseCredentials(request: NextRequest): Promise<ParsedCredentials> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    let body: LoginBody;
    try {
      body = (await request.json()) as LoginBody;
    } catch {
      return { error: 'Invalid JSON body.' };
    }

    const emailRaw = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';
    return { email: emailRaw, password };
  }

  // Browser form POSTs
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    try {
      const form = await request.formData();
      const email = typeof form.get('email') === 'string' ? String(form.get('email')) : '';
      const password = typeof form.get('password') === 'string' ? String(form.get('password')) : '';
      return { email, password };
    } catch {
      return { error: 'Invalid form body.' };
    }
  }

  // Best-effort fallback
  try {
    const form = await request.formData();
    const email = typeof form.get('email') === 'string' ? String(form.get('email')) : '';
    const password = typeof form.get('password') === 'string' ? String(form.get('password')) : '';
    return { email, password };
  } catch {
    return { error: 'Invalid request body.' };
  }
}

function isBrowserLike(request: NextRequest): boolean {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return false;
  const accept = request.headers.get('accept') ?? '';
  return accept.includes('text/html') || accept === '*/*' || accept.length === 0;
}

function redirectWithCookies(request: NextRequest, responseForCookies: NextResponse, path: string) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = '';
  const res = NextResponse.redirect(url, 303);
  for (const cookie of responseForCookies.cookies.getAll()) {
    res.cookies.set(cookie);
  }
  return res;
}

function redirectToLoginError(request: NextRequest, responseForCookies: NextResponse, message: string) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('error', message);
  const res = NextResponse.redirect(url, 303);
  for (const cookie of responseForCookies.cookies.getAll()) {
    res.cookies.set(cookie);
  }
  return res;
}

function routeForUserRow(row: { role: string; is_owner: boolean; disabled: boolean }): '/admin' | '/jobs' | '/company' {
  if (row.is_owner) return '/admin';
  if (row.role === 'admin') return '/admin';
  if (row.role === 'contractor') return '/jobs';
  return '/company';
}

export async function POST(request: NextRequest) {
  const parsed = await parseCredentials(request);
  if ('error' in parsed) {
		if (isBrowserLike(request)) {
			return redirectToLoginError(request, NextResponse.next(), parsed.error);
		}
    return badRequest(parsed.error);
  }

  const emailRaw = parsed.email;
  const password = parsed.password;

  if (!emailRaw.trim() || !password.trim()) {
    if (isBrowserLike(request)) {
      return redirectToLoginError(request, NextResponse.next(), 'missing_credentials');
    }
    if (!emailRaw.trim()) return badRequest('email is required');
    return badRequest('password is required');
  }

  const responseForCookies = NextResponse.json({ ok: true });

  let supabase;
  try {
    supabase = createSupabaseRouteClient(request, responseForCookies);
  } catch (err) {
    if (isBrowserLike(request)) {
      return redirectToLoginError(
        request,
        responseForCookies,
        err instanceof Error ? err.message : 'Supabase not configured.',
      );
    }
    return blockedJson('missing_dependency', err instanceof Error ? err.message : 'Supabase not configured.', 501);
  }

  const email = normalizeEmail(emailRaw);
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (signIn.error) {
		if (isBrowserLike(request)) {
			return redirectToLoginError(request, responseForCookies, signIn.error.message);
		}
		return unauthorized(signIn.error.message);
  }

  const userId = signIn.data.user?.id;
  if (!userId) {
    if (isBrowserLike(request)) {
      return redirectToLoginError(request, responseForCookies, 'Authentication failed.');
    }
    return unauthorized('Authentication failed.');
  }

  try {
    const res = await dbQuery<{ role: string; is_owner: boolean; disabled: boolean }>(
      'SELECT role, is_owner, disabled FROM users WHERE id::text = $1 LIMIT 1',
      [userId],
    );
    const row = res.rows[0];
    if (!row) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
      if (isBrowserLike(request)) {
        return redirectToLoginError(request, responseForCookies, 'User not provisioned.');
      }
      return blockedJson('missing_dependency', 'Logged in, but user not provisioned.', 501);
    }

    if (row.disabled && !row.is_owner) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
      if (isBrowserLike(request)) {
        return redirectToLoginError(request, responseForCookies, 'User disabled.');
      }
      return unauthorized('User disabled.');
    }

    const target = routeForUserRow(row);
    if (isBrowserLike(request)) {
      return redirectWithCookies(request, responseForCookies, target);
    }

    const finalResponse = NextResponse.json({ userId, role: row.role }, { status: 200 });
    for (const cookie of responseForCookies.cookies.getAll()) {
      finalResponse.cookies.set(cookie);
    }
    return finalResponse;
  } catch (err) {
    if (isBrowserLike(request)) {
      return redirectToLoginError(
        request,
        responseForCookies,
        `Logged in, but user not provisioned. ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return blockedJson(
      'missing_dependency',
      `Logged in, but user not provisioned. ${err instanceof Error ? err.message : String(err)}`,
      501,
    );
  }
}
