import 'server-only';

import { NextResponse } from 'next/server';

export function jsonBlocked(message: string, status = 403): NextResponse {
	return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T extends Record<string, unknown>>(body: T, status = 200): NextResponse {
	return NextResponse.json(body, { status });
}
