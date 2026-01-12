import 'server-only';
import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { JobUrgency } from '@/lib/types';

export const runtime = 'nodejs';

type CreateJobRequestInput = {
  title: string;
  description: string;
  jobType: string;
  commodity: string;
  scope: string;
  urgency: JobUrgency;
  startDate?: string;
  address: string;
  city: string;
  state: string;
  complianceRequirements: string[];
  equipmentNotes?: string;
  laborNotes?: string;
  pricingExpectation?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: Request) {
  let auth;
  try {
    auth = await getServerAuthContext();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Not authenticated.' },
      { status: 401 },
    );
  }

  if (auth.disabled) {
    return NextResponse.json({ error: 'Access denied: user disabled.' }, { status: 403 });
  }

  if (auth.role !== 'logistics' && auth.role !== 'admin') {
    return NextResponse.json({ error: 'Access denied: logistics or admin role required to post jobs.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON body.');
  }

  if (!body || typeof body !== 'object') {
    return badRequest('Invalid request body.');
  }

  const raw = body as Record<string, unknown>;

  const input: CreateJobRequestInput = {
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    jobType: String(raw.jobType ?? ''),
    commodity: String(raw.commodity ?? ''),
    scope: String(raw.scope ?? ''),
    urgency: raw.urgency as JobUrgency,
    startDate: typeof raw.startDate === 'string' ? raw.startDate : undefined,
    address: String(raw.address ?? ''),
    city: String(raw.city ?? ''),
    state: String(raw.state ?? ''),
    complianceRequirements: isStringArray(raw.complianceRequirements) ? raw.complianceRequirements : [],
    equipmentNotes: typeof raw.equipmentNotes === 'string' ? raw.equipmentNotes : undefined,
    laborNotes: typeof raw.laborNotes === 'string' ? raw.laborNotes : undefined,
    pricingExpectation: typeof raw.pricingExpectation === 'string' ? raw.pricingExpectation : undefined,
  };

  if (!isNonEmptyString(input.title)) return badRequest('Missing required field: title.');
  if (!isNonEmptyString(input.description)) return badRequest('Missing required field: description.');
  if (!isNonEmptyString(input.jobType)) return badRequest('Missing required field: jobType.');
  if (!isNonEmptyString(input.commodity)) return badRequest('Missing required field: commodity.');
  if (!isNonEmptyString(input.scope)) return badRequest('Missing required field: scope.');
  if (input.urgency !== 'urgent' && input.urgency !== 'scheduled') return badRequest('Invalid urgency.');
  if (input.urgency === 'scheduled' && !isNonEmptyString(input.startDate)) {
    return badRequest('Missing required field: startDate (scheduled jobs).');
  }
  if (!isNonEmptyString(input.address)) return badRequest('Missing required field: address.');
  if (!isNonEmptyString(input.city)) return badRequest('Missing required field: city.');
  if (!isNonEmptyString(input.state)) return badRequest('Missing required field: state.');

  const startDate = input.urgency === 'scheduled' && input.startDate ? new Date(input.startDate) : null;
  if (startDate && Number.isNaN(startDate.getTime())) {
    return badRequest('Invalid startDate. Expected YYYY-MM-DD.');
  }

  const created = await prisma.jobRequest.create({
    data: {
      ownerCompanyId: auth.userId,
      title: input.title.trim(),
      jobType: input.jobType.trim(),
      commodity: input.commodity.trim(),
      urgency: input.urgency,
      scopeDescription: input.scope.trim(),
      descriptionFull: input.description.trim(),
      status: 'open',
      startDate: startDate ?? undefined,
      expectedDuration: undefined,
      address: input.address.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      latitude: 0,
      longitude: 0,
      complianceRequirements: input.complianceRequirements,
      equipmentNotes: input.equipmentNotes?.trim() || undefined,
      laborNotes: input.laborNotes?.trim() || undefined,
      pricingExpectation: input.pricingExpectation?.trim() || undefined,
    },
    select: { id: true },
  });

  return NextResponse.json({ jobRequestId: created.id }, { status: 200 });
}
