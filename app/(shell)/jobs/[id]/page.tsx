import 'server-only';

import { notFound } from 'next/navigation';

import { getServerAuthContext } from '@/lib/auth';
import { getSignedReadUrl } from '@/lib/storage/readUrl';
import { prisma } from '@/lib/db';

import type { JobDetailViewModel } from '@/components/jobs/detail/types';
import { JobCompliance } from '@/components/jobs/detail/JobCompliance';
import { JobHeader } from '@/components/jobs/detail/JobHeader';
import { JobImageGallery } from '@/components/jobs/detail/JobImageGallery';
import { JobLocation } from '@/components/jobs/detail/JobLocation';
import { JobOverview } from '@/components/jobs/detail/JobOverview';
import { JobPricing } from '@/components/jobs/detail/JobPricing';
import { JobScope } from '@/components/jobs/detail/JobScope';
import { JobTiming } from '@/components/jobs/detail/JobTiming';
import { StickyActionBar } from '@/components/jobs/detail/StickyActionBar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: { id: string };
};

function Blocked({ title, message }: { title: string; message: string }) {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <div className="bg-white border rounded-lg p-6 text-sm text-gray-800">BLOCKED: {message}</div>
      </div>
    </main>
  );
}

function formatPostedLabel(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export default async function JobDetailPage({ params }: PageProps) {
  const jobRequestId = params?.id;
  if (!jobRequestId || typeof jobRequestId !== 'string' || jobRequestId.trim().length === 0) {
    notFound();
  }

  let auth;
  try {
    auth = await getServerAuthContext();
  } catch (err) {
    return <Blocked title="Job Request" message={err instanceof Error ? err.message : String(err)} />;
  }

  const job = await prisma.jobRequest.findUnique({
    where: { id: jobRequestId },
    include: {
      photos: { orderBy: { createdAt: 'asc' } },
      documents: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!job) notFound();

  const status = job.status === 'open' || job.status === 'closed' ? job.status : null;
  if (!status) {
    return <Blocked title="Job Request" message='Persisted JobRequest.status must be "open" or "closed".' />;
  }

  const urgency = job.urgency === 'urgent' || job.urgency === 'scheduled' ? job.urgency : null;
  if (!urgency) {
    return <Blocked title="Job Request" message='Persisted JobRequest.urgency must be "urgent" or "scheduled".' />;
  }

  if (!auth.isOwner) {
    if (auth.disabled) {
      return <Blocked title="Job Request" message="Access denied: user disabled." />;
    }
    if (auth.role === 'contractor') {
      if (status !== 'open') {
        return <Blocked title="Job Request" message="Access denied: contractors can only view open job requests." />;
      }
    } else if (auth.role === 'logistics') {
      // Ownership checks are not implemented in the current data model.
    } else if (auth.role === 'admin') {
      // Admins can view job details.
    } else {
      return <Blocked title="Job Request" message="Access denied: unknown role." />;
    }
  }

  const bucket = process.env.FILE_STORAGE_BUCKET;
  if (!bucket) {
    return <Blocked title="Job Request" message="FILE_STORAGE_BUCKET missing; cannot generate signed read URLs." />;
  }

  let signedPhotos: Array<{ src: string; alt: string }>;
  try {
    signedPhotos = await Promise.all(
      job.photos.map(async (p) => {
        const signedUrl = await getSignedReadUrl({ bucket, key: p.s3Key, expiresInSeconds: 60 });
        return { src: signedUrl, alt: p.label || 'Job photo' };
      }),
    );
  } catch (err) {
    return (
      <Blocked
        title="Job Request"
        message={`Failed to generate signed read URLs for photos. ${err instanceof Error ? err.message : String(err)}`}
      />
    );
  }

  const viewModel: JobDetailViewModel = {
    id: job.id,
    title: job.title,
    companyName: job.ownerCompanyId,
    urgency,
    status,
    postedDateLabel: formatPostedLabel(job.createdAt),

    jobType: job.jobType,
    commodity: job.commodity,
    volumeLabel: 'Not provided.',

    addressLine: job.address,
    cityStateLine: `${job.city}, ${job.state}`,
    facilityNameLabel: 'Not provided.',
    gateInstructionsLabel: 'Not provided.',
    ppeRequirementsLabel: 'Not provided.',
    clearanceNotesLabel: 'Not provided.',
    railAccessNotesLabel: 'Not provided.',

    scopeFull: job.descriptionFull,
    equipmentNotesLabel: job.equipmentNotes ?? 'Not provided.',
    laborNotesLabel: job.laborNotes ?? 'Not provided.',

    complianceRequired: job.complianceRequirements,
    complianceOptional: [],

    startDateLabel: job.startDate ? job.startDate.toLocaleString() : 'Not provided.',
    durationLabel: job.expectedDuration ?? 'Not provided.',
    workHoursLabel: 'Not provided.',

    pricingExpectationLabel: job.pricingExpectation ?? 'Not provided.',
    pricingNotesLabel: 'Not provided.',

    photos: signedPhotos,

		isOwner: auth.isOwner,
		role: auth.role,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-24">
        <JobHeader job={viewModel} />
        <JobImageGallery job={viewModel} />
        <JobOverview job={viewModel} />
        <JobLocation job={viewModel} />
        <JobScope job={viewModel} />
        <JobCompliance job={viewModel} />
        <JobTiming job={viewModel} />
        <JobPricing job={viewModel} />
      </div>

      <StickyActionBar jobId={viewModel.id} role={viewModel.role} isOwner={viewModel.isOwner} />
    </div>
  );
}
