import 'server-only';
import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

function badRequest(message: string) {
  return NextResponse.json({ error: 'BLOCKED', reason: 'invalid_request', message }, { status: 400 });
}

function unauthorized(message: string) {
  return NextResponse.json({ error: 'BLOCKED', reason: 'unauthorized', message }, { status: 401 });
}

function forbidden(message: string) {
  return NextResponse.json({ error: 'BLOCKED', reason: 'forbidden', message }, { status: 403 });
}

function serverError(message: string) {
  return NextResponse.json({ error: 'BLOCKED', reason: 'missing_dependency', message }, { status: 501 });
}

type JobPhotoResponse = {
  id: string;
  label: string;
  signedUrl: string;
  createdAt: string;
};

type JobDocumentResponse = {
  id: string;
  name: string;
  kind: string;
  signedUrl: string;
  createdAt: string;
};

type JobRequestDetailResponse = {
  id: string;
  ownerCompanyId: string;
  title: string;
  jobType: string;
  commodity: string;
  urgency: string;
  scopeDescription: string;
  descriptionFull: string;
  status: string;

  startDate: string | null;
  expectedDuration: string | null;

  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;

  complianceRequirements: string[];

  equipmentNotes: string | null;
  laborNotes: string | null;

  pricingExpectation: string | null;

  photos: JobPhotoResponse[];
  documents: JobDocumentResponse[];

  createdAt: string;
  updatedAt: string;
};

export async function GET(req: Request, ctx: { params: { id: string } }) {
  const jobRequestId = ctx?.params?.id;
  if (!jobRequestId || typeof jobRequestId !== 'string' || jobRequestId.trim().length === 0) {
    return badRequest('Invalid jobRequestId.');
  }

  let auth;
  try {
    auth = await getServerAuthContext();
  } catch (err) {
    return unauthorized(err instanceof Error ? err.message : 'Not authenticated.');
  }

  const job = await prisma.jobRequest.findUnique({
    where: { id: jobRequestId },
    include: {
      photos: { orderBy: { createdAt: 'asc' } },
      documents: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!job) {
    return NextResponse.json(
      { error: 'BLOCKED', reason: 'invalid_request', message: 'Job request not found.' },
      { status: 404 },
    );
  }

  if (!auth.isOwner) {
    if (auth.disabled) {
      return forbidden('Access denied: user disabled.');
    }
    if (auth.role === 'contractor') {
      if (job.status !== 'open') {
        return forbidden('Access denied: contractors can only view open job requests.');
      }
    } else if (auth.role === 'logistics') {
      // Ownership checks are not implemented in the current data model.
    } else if (auth.role === 'admin') {
      // Admins can view.
    } else {
      return forbidden('Access denied: unknown role.');
    }
  }

  let photos: JobPhotoResponse[];
  let documents: JobDocumentResponse[];
  try {
    // Core product should not depend on external storage configuration.
    photos = job.photos.map((p) => ({ id: p.id, label: p.label, signedUrl: '', createdAt: p.createdAt.toISOString() }));
    documents = job.documents.map((d) => ({ id: d.id, name: d.name, kind: d.kind, signedUrl: '', createdAt: d.createdAt.toISOString() }));
  } catch (err) {
    return serverError(`Failed to load job attachments. ${err instanceof Error ? err.message : String(err)}`);
  }

  const payload: JobRequestDetailResponse = {
    id: job.id,
    ownerCompanyId: job.ownerCompanyId,
    title: job.title,
    jobType: job.jobType,
    commodity: job.commodity,
    urgency: job.urgency,
    scopeDescription: job.scopeDescription,
    descriptionFull: job.descriptionFull,
    status: job.status,

    startDate: job.startDate ? job.startDate.toISOString() : null,
    expectedDuration: job.expectedDuration ?? null,

    address: job.address,
    city: job.city,
    state: job.state,
    latitude: job.latitude,
    longitude: job.longitude,

    complianceRequirements: job.complianceRequirements,

    equipmentNotes: job.equipmentNotes ?? null,
    laborNotes: job.laborNotes ?? null,

    pricingExpectation: job.pricingExpectation ?? null,

    photos,
    documents,

    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };

  return NextResponse.json(payload, { status: 200 });
}

type PatchBody = { title?: unknown; scope?: unknown; status?: unknown };

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const jobRequestId = ctx?.params?.id;
  if (!jobRequestId || typeof jobRequestId !== 'string' || jobRequestId.trim().length === 0) {
    return badRequest('Invalid jobRequestId.');
  }

  let auth;
  try {
    auth = await getServerAuthContext();
  } catch (err) {
    return unauthorized(err instanceof Error ? err.message : 'Not authenticated.');
  }

  if (auth.disabled) {
    return forbidden('Access denied: user disabled.');
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return badRequest('Invalid JSON body.');
  }

  const title = typeof body.title === 'string' ? body.title.trim() : undefined;
  const scope = typeof body.scope === 'string' ? body.scope.trim() : undefined;
  const statusRaw = typeof body.status === 'string' ? body.status.trim().toLowerCase() : undefined;
  const status = statusRaw === 'open' || statusRaw === 'closed' ? statusRaw : undefined;

  if (!title && !scope && !status) {
    return badRequest('No supported fields provided (title, scope, status).');
  }

  try {
    const job = await prisma.jobRequest.findUnique({ where: { id: jobRequestId }, select: { ownerCompanyId: true } });
    if (!job) {
      return NextResponse.json(
        { error: 'BLOCKED', reason: 'invalid_request', message: 'Job request not found.' },
        { status: 404 },
      );
    }

    if (auth.role !== 'admin' && auth.role !== 'logistics') {
      return forbidden('Access denied: logistics role required.');
    }

    if (auth.role !== 'admin' && job.ownerCompanyId !== auth.userId) {
      return forbidden('Access denied: only the owning company can edit this job.');
    }

    const updated = await prisma.jobRequest.update({
      where: { id: jobRequestId },
      data: {
        ...(title ? { title } : {}),
        ...(scope ? { scopeDescription: scope } : {}),
        ...(status ? { status } : {}),
      },
      select: { id: true, status: true },
    });

    return NextResponse.json({ ok: true, id: updated.id, status: updated.status }, { status: 200 });
  } catch (err) {
    return serverError(err instanceof Error ? err.message : String(err));
  }
}
