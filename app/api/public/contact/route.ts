import 'server-only';

import { badRequest, okJson } from '@/lib/api/json';

export const runtime = 'nodejs';

type Body = { name?: unknown; email?: unknown; message?: unknown };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return badRequest('Invalid JSON body.');
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!name || !email || !message) {
    return badRequest('name, email, and message are required');
  }

  // No email provider wired here; don't crash.
  return okJson({ ok: true }, 200);
}
