import 'server-only';

import { randomUUID } from 'crypto';

import { getServerAuthContext } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { badRequest, blockedJson, okJson, unauthorized } from '@/lib/api/json';

export const runtime = 'nodejs';

async function ensureMessageTables() {
  await dbQuery(
    `CREATE TABLE IF NOT EXISTS trex_message_threads (
      id text PRIMARY KEY,
      job_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  );

  await dbQuery(
    `CREATE TABLE IF NOT EXISTS trex_messages (
      id text PRIMARY KEY,
      thread_id text NOT NULL REFERENCES trex_message_threads(id) ON DELETE CASCADE,
      job_id text NOT NULL,
      from_user_id text NOT NULL,
      body text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  );

  await dbQuery('CREATE INDEX IF NOT EXISTS trex_messages_job_id_idx ON trex_messages(job_id)');
  await dbQuery('CREATE INDEX IF NOT EXISTS trex_messages_thread_id_idx ON trex_messages(thread_id)');
}

export async function GET(req: Request) {
  let auth;
  try {
    auth = await getServerAuthContext();
  } catch (err) {
    return unauthorized(err instanceof Error ? err.message : 'Not authenticated.');
  }

  const url = new URL(req.url);
  const jobId = (url.searchParams.get('jobId') ?? '').trim();
  if (!jobId) return badRequest('jobId is required');

  try {
    await ensureMessageTables();

    // thread is one-per-job for now
    let threadId = `job:${jobId}`;
    await dbQuery(
      'INSERT INTO trex_message_threads (id, job_id) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      [threadId, jobId],
    );

    const res = await dbQuery<{ id: string; from_user_id: string; body: string; created_at: string }>(
      'SELECT id, from_user_id, body, created_at::text as created_at FROM trex_messages WHERE thread_id = $1 ORDER BY created_at ASC LIMIT 500',
      [threadId],
    );

    return okJson({
      threadId,
      messages: res.rows.map((m) => ({
        id: m.id,
        fromUserId: m.from_user_id,
        body: m.body,
        createdAt: m.created_at,
      })),
      viewer: { id: auth.userId, role: auth.role },
    });
  } catch (err) {
    return blockedJson('missing_dependency', err instanceof Error ? err.message : String(err), 501);
  }
}

type PostBody = { jobId?: unknown; body?: unknown };

export async function POST(req: Request) {
  let auth;
  try {
    auth = await getServerAuthContext();
  } catch (err) {
    return unauthorized(err instanceof Error ? err.message : 'Not authenticated.');
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return badRequest('Invalid JSON body.');
  }

  const jobId = typeof body.jobId === 'string' ? body.jobId.trim() : '';
  const msg = typeof body.body === 'string' ? body.body.trim() : '';
  if (!jobId) return badRequest('jobId is required');
  if (!msg) return badRequest('body is required');

  try {
    await ensureMessageTables();

    const threadId = `job:${jobId}`;
    await dbQuery(
      'INSERT INTO trex_message_threads (id, job_id) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      [threadId, jobId],
    );

    const id = randomUUID();
    await dbQuery(
      'INSERT INTO trex_messages (id, thread_id, job_id, from_user_id, body) VALUES ($1, $2, $3, $4, $5)',
      [id, threadId, jobId, auth.userId, msg],
    );

    return okJson({ ok: true, threadId, messageId: id }, 200);
  } catch (err) {
    return blockedJson('missing_dependency', err instanceof Error ? err.message : String(err), 501);
  }
}
