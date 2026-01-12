import 'server-only';

import type { OpenJobRequest } from '@/lib/types';
import { dbQuery, prisma } from '@/lib/db';

export async function getOpenJobRequestsForContractor(): Promise<OpenJobRequest[]> {
  const rows = await prisma.jobRequest.findMany({
    where: { status: 'open' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      ownerCompanyId: true,
      title: true,
      jobType: true,
      commodity: true,
      urgency: true,
      city: true,
      state: true,
      latitude: true,
      longitude: true,
      scopeDescription: true,
      complianceRequirements: true,
      createdAt: true,
      _count: { select: { photos: true } },
    },
  });

  if (rows.length === 0) return [];

  const ownerIds = Array.from(new Set(rows.map((r) => r.ownerCompanyId).filter(Boolean)));
  const ownerEmailById = new Map<string, string>();
  if (ownerIds.length > 0) {
    try {
      const res = await dbQuery<{ id: string; email: string | null }>(
        'SELECT id::text as id, email FROM users WHERE id::text = ANY($1)',
        [ownerIds],
      );
      for (const row of res.rows) {
        ownerEmailById.set(row.id, row.email && row.email.trim().length > 0 ? row.email : row.id);
      }
    } catch {
      // Non-blocking: fall back to IDs.
    }
  }

  return rows.map((row) => {
    const urgency = row.urgency === 'urgent' || row.urgency === 'scheduled' ? row.urgency : null;
    if (!urgency) {
      throw new Error('BLOCKED: Persisted JobRequest.urgency must be "urgent" or "scheduled".');
    }

    return {
      id: row.id,
      ownerCompanyId: row.ownerCompanyId,
      companyName: ownerEmailById.get(row.ownerCompanyId) ?? row.ownerCompanyId,
      title: row.title,
      jobType: row.jobType,
      commodity: row.commodity,
      urgency,
      location: {
        lat: row.latitude,
        lng: row.longitude,
        city: row.city,
        state: row.state,
      },
      scopeSummary: row.scopeDescription,
      photoCount: row._count.photos,
      complianceRequirements: row.complianceRequirements,
      postedAt: row.createdAt.toISOString(),
      status: 'open',
    };
  });
}
