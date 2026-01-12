import 'server-only';

import { notFound, redirect } from 'next/navigation';

import { getServerAuthContext } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { dbQuery } from '@/lib/db';

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
		<main className="min-h-screen bg-[#0B1220]">
			<div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
				<h1 className="text-[16px] font-semibold text-[#E5E7EB]">{title}</h1>
				<div className="border border-[#1F2A44] bg-[#111A2E] p-3 text-[12px] text-[#E5E7EB]">BLOCKED: {message}</div>
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
	} catch {
		redirect('/login');
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
			// Admins can view job details (read-only).
		} else {
			return <Blocked title="Job Request" message="Access denied: unknown role." />;
		}
	}

	// Photos/documents rely on external storage configuration. Core product should still work without it.
	const signedPhotos: Array<{ src: string; alt: string }> = [];

	let companyName = job.ownerCompanyId;
	try {
		const res = await dbQuery<{ email: string | null }>('SELECT email FROM users WHERE id::text = $1 LIMIT 1', [job.ownerCompanyId]);
		const email = res.rows[0]?.email ?? null;
		if (email && email.trim().length > 0) companyName = email;
	} catch {
		// ignore
	}

	const viewModel: JobDetailViewModel = {
		id: job.id,
		title: job.title,
		companyName,
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
		<div className="min-h-screen bg-[#0B1220]">
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
