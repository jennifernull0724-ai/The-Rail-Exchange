import 'server-only';

import { dbQuery, prisma } from '@/lib/db';
import { getServerAuthContext } from '@/lib/auth';
import { badRequest, blockedJson, okJson, unauthorized, forbidden } from '@/lib/api/json';

export const runtime = 'nodejs';

type CreateJobBody = { title?: unknown; location?: unknown; scope?: unknown; description?: unknown };

export async function GET() {
  try {
    await getServerAuthContext();
  } catch (err) {
    return unauthorized(err instanceof Error ? err.message : 'Not authenticated.');
  }

  const jobs = await prisma.jobRequest.findMany({
    where: { status: 'open' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, ownerCompanyId: true, city: true, state: true, scopeDescription: true, createdAt: true },
  });

  const ownerIds = Array.from(new Set(jobs.map((j) => j.ownerCompanyId)));
  const ownerEmailById = new Map<string, string>();
  if (ownerIds.length > 0) {
    try {
      const res = await dbQuery<{ id: string; email: string | null }>('SELECT id::text as id, email FROM users WHERE id::text = ANY($1)', [ownerIds]);
      for (const row of res.rows) {
        ownerEmailById.set(row.id, row.email && row.email.trim().length > 0 ? row.email : row.id);
      }
    } catch {
      // ignore
    }
  }

  return okJson({
    jobs: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      company: ownerEmailById.get(j.ownerCompanyId) ?? j.ownerCompanyId,
      location: `${j.city}, ${j.state}`,
      scope: j.scopeDescription,
      postedAt: j.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
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
    return forbidden('Role must be logistics.');
  }

  let body: CreateJobBody;
  try {
    body = (await req.json()) as CreateJobBody;
  } catch {
    return badRequest('Invalid JSON body.');
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const location = typeof body.location === 'string' ? body.location.trim() : '';
  const scope = typeof body.scope === 'string' ? body.scope.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';

  if (!title) return badRequest('title is required');
  if (!location) return badRequest('location is required');
  if (!scope) return badRequest('scope is required');
  if (!description) return badRequest('description is required');

  // Very lightweight parsing: allow "City, ST"; otherwise treat as city.
  let city = location;
  let state = 'N/A';
  const m = /^\s*(.+?)\s*,\s*([A-Za-z]{2})\s*$/.exec(location);
  if (m) {
    city = m[1] ?? location;
    state = (m[2] ?? '').toUpperCase() || 'N/A';
  }

  try {
    const created = await prisma.jobRequest.create({
      data: {
        ownerCompanyId: auth.userId,
        title,
        jobType: 'General',
        commodity: 'General',
        urgency: 'urgent',
        scopeDescription: scope,
        descriptionFull: description,
        status: 'open',
        address: location,
        city,
        state,
        latitude: 0,
        longitude: 0,
        complianceRequirements: [],
      },
      select: { id: true },
    });

    return okJson({ id: created.id }, 200);
  } catch (err) {
    return blockedJson('missing_dependency', err instanceof Error ? err.message : String(err), 501);
  }
}
