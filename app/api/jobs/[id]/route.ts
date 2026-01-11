import 'server-only';

import '@/lib/env';
import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth';
import { getSignedReadUrl } from '@/lib/storage/readUrl';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function unauthorized(message: string) {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

function serverError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
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
    auth = getServerAuthContext(req);
  } catch (err) {
    return forbidden(err instanceof Error ? err.message : 'Invalid auth context headers.');
  }

  const job = await prisma.jobRequest.findUnique({
    where: { id: jobRequestId },
    include: {
      photos: { orderBy: { createdAt: 'asc' } },
      documents: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!job) {
    return NextResponse.json({ error: 'Job request not found.' }, { status: 404 });
  }

  if (auth.role === 'contractor') {
    if (auth.subscriptionActive !== true) {
      return forbidden('Access denied: contractor subscription is not active.');
    }
    if (job.status !== 'open') {
      return forbidden('Access denied: contractors can only view open job requests.');
    }
  } else if (auth.role === 'logistics_company') {
    if (auth.companyId !== job.ownerCompanyId) {
      return forbidden('Access denied: logistics company does not own this job request.');
    }
  } else {
    return forbidden('Access denied: unknown role.');
  }

  const bucket = process.env.FILE_STORAGE_BUCKET;
  if (!bucket) {
    return serverError('BLOCKED: FILE_STORAGE_BUCKET missing; cannot generate signed read URLs.');
  }

  let photos: JobPhotoResponse[];
  let documents: JobDocumentResponse[];
  try {
    photos = await Promise.all(
      job.photos.map(async (p) => {
        const signedUrl = await getSignedReadUrl({ bucket, key: p.s3Key, expiresInSeconds: 60 });
        return { id: p.id, label: p.label, signedUrl, createdAt: p.createdAt.toISOString() };
      }),
    );

    documents = await Promise.all(
      job.documents.map(async (d) => {
        const signedUrl = await getSignedReadUrl({ bucket, key: d.s3Key, expiresInSeconds: 60 });
        return { id: d.id, name: d.name, kind: d.kind, signedUrl, createdAt: d.createdAt.toISOString() };
      }),
    );
  } catch (err) {
    return serverError(`BLOCKED: Failed to generate signed read URLs. ${err instanceof Error ? err.message : String(err)}`);
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
