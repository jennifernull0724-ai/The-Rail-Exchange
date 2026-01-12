import { NextResponse } from 'next/server';

export type BlockedReason =
  | 'missing_dependency'
  | 'unauthorized'
  | 'forbidden'
  | 'invalid_request'
  | 'not_implemented';

export function okJson<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function blockedJson(reason: BlockedReason, message: string, status: number) {
  return NextResponse.json({ error: 'BLOCKED', reason, message }, { status });
}

export function badRequest(message: string) {
  return blockedJson('invalid_request', message, 400);
}

export function unauthorized(message = 'Not authenticated.') {
  return blockedJson('unauthorized', message, 401);
}

export function forbidden(message = 'Forbidden.') {
  return blockedJson('forbidden', message, 403);
}

export function missingDep(message: string) {
  return blockedJson('missing_dependency', message, 501);
}

export function notImplemented(message: string) {
  return blockedJson('not_implemented', message, 501);
}
