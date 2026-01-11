import 'server-only';

import type { OpenJobRequest } from '@/lib/types';
import { prisma } from '@/lib/db';

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

  return rows.map((row) => {
    const urgency = row.urgency === 'urgent' || row.urgency === 'scheduled' ? row.urgency : null;
    if (!urgency) {
      throw new Error('BLOCKED: Persisted JobRequest.urgency must be "urgent" or "scheduled".');
    }

    return {
      id: row.id,
      ownerCompanyId: row.ownerCompanyId,
      companyName: row.ownerCompanyId,
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
