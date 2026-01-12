import 'server-only';

import { getServerAuthContext } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { badRequest, blockedJson, forbidden, okJson, unauthorized } from '@/lib/api/json';

export const runtime = 'nodejs';

function parseUsdAmount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Best-effort parse: "$50,000" -> 50000
  const normalized = trimmed.replace(/[^0-9.]/g, '');
  if (!normalized) return null;
  const num = Number.parseFloat(normalized);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const jobRequestId = ctx?.params?.id;
  if (!jobRequestId || typeof jobRequestId !== 'string' || jobRequestId.trim().length === 0) {
    return badRequest('Invalid job id.');
  }

  let auth;
  try {
    auth = await getServerAuthContext();
  } catch (err) {
    return unauthorized(err instanceof Error ? err.message : 'Not authenticated.');
  }

  if (auth.disabled) {
    return forbidden('User disabled.');
  }

  if (auth.role !== 'logistics' && auth.role !== 'admin') {
    return forbidden('Access denied: logistics role required.');
  }

  try {
    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      // No body is fine.
    }
    const raw = (body && typeof body === 'object' ? (body as Record<string, unknown>) : null) ?? null;
    const jobValueFromBody = raw ? parseUsdAmount(raw.jobValue) : null;

    const job = await prisma.jobRequest.findUnique({
      where: { id: jobRequestId },
      select: { id: true, ownerCompanyId: true, pricingExpectation: true },
    });
    if (!job) {
      return blockedJson('invalid_request', 'Job not found.', 404);
    }

    if (auth.role !== 'admin' && job.ownerCompanyId !== auth.userId) {
      return forbidden('Access denied: only the owning company can close this job.');
    }

    await prisma.jobRequest.update({ where: { id: jobRequestId }, data: { status: 'closed' } });

    // Backend-triggered job fee (best effort). Never block closing the job.
    try {
      if (auth.role === 'logistics') {
        const jobValue = jobValueFromBody ?? parseUsdAmount(job.pricingExpectation);
        if (jobValue && jobValue > 0) {
          const origin = new URL(req.url).origin;
          const cookie = req.headers.get('cookie') ?? '';
          void fetch(`${origin}/api/billing/job-fee`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              cookie,
            },
            body: JSON.stringify({ jobId: job.id, jobValue }),
            cache: 'no-store',
          }).catch(() => {
            // ignore
          });
        }
      }
    } catch {
      // ignore
    }

    return okJson({ ok: true }, 200);
  } catch (err) {
    return blockedJson('missing_dependency', err instanceof Error ? err.message : String(err), 501);
  }
}
