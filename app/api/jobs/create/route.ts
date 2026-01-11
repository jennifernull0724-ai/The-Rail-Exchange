import 'server-only';

import '@/lib/env';
import { NextResponse } from 'next/server';
import { ensureLogisticsCompanyAccess } from '@/lib/permissions';
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
  complianceRequirements: string[];
  equipmentNotes?: string;
  laborNotes?: string;
  pricingExpectation?: string;
  location?: {
    lat: number;
    lng: number;
  };
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
  const access = ensureLogisticsCompanyAccess();
  if (!access.authorized) {
    return NextResponse.json(
      { error: `Access denied: ${access.reason ?? 'Authorization not implemented.'}` },
      { status: access.status },
    );
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
    complianceRequirements: isStringArray(raw.complianceRequirements) ? raw.complianceRequirements : [],
    equipmentNotes: typeof raw.equipmentNotes === 'string' ? raw.equipmentNotes : undefined,
    laborNotes: typeof raw.laborNotes === 'string' ? raw.laborNotes : undefined,
    pricingExpectation: typeof raw.pricingExpectation === 'string' ? raw.pricingExpectation : undefined,
    location:
      raw.location && typeof raw.location === 'object'
        ? {
            lat: Number((raw.location as Record<string, unknown>).lat),
            lng: Number((raw.location as Record<string, unknown>).lng),
          }
        : undefined,
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

  if (!input.location || !Number.isFinite(input.location.lat) || !Number.isFinite(input.location.lng)) {
    return NextResponse.json(
      {
        error:
          'BLOCKED: JobRequest schema requires location.lat/lng. Provide real coordinates or implement server-side geocoding (not implemented).',
      },
      { status: 501 },
    );
  }

  return NextResponse.json(
    {
      error:
        'BLOCKED: No real persistence layer is declared in this codebase (no database schema/client). Implement a real DB write and return the created jobRequestId.',
    },
    { status: 501 },
  );
}
