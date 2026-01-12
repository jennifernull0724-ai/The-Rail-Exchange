import 'server-only';

import { redirect } from 'next/navigation';

import { JobsFeed } from '@/components/jobs/JobsFeed';

import { getServerAuthContext } from '@/lib/auth';
import { getOpenJobRequestsForContractor } from '@/lib/repositories/jobRequests.read';
import { isActiveSubscription } from '@/lib/stripe/state';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function Blocked({ message }: { message: string }) {
	return (
		<div className="min-h-screen bg-[#0B1220]">
			<div className="mx-auto max-w-7xl px-4 py-6">
				<div className="border border-[#1F2A44] bg-[#111A2E] p-3 text-[12px] text-[#E5E7EB]">BLOCKED: {message}</div>
			</div>
		</div>
	);
}

export default async function JobsPage() {
	let auth;
	try {
		auth = await getServerAuthContext();
	} catch {
		redirect('/login');
	}

	// Server-side access gate: contractors must have an active subscription.
	// Redirect to the contractor checkout entry point if inactive.
	if (!auth.isOwner && auth.role === 'contractor') {
		const active = await isActiveSubscription(auth.userId);
		if (!active) {
			redirect('/contractor');
		}
	}

	if (!auth.isOwner && auth.disabled) {
		return <Blocked message="User disabled." />;
	}

	let jobs;
	try {
		jobs = await getOpenJobRequestsForContractor();
	} catch (err) {
		return <Blocked message={`Failed to load open job requests. ${err instanceof Error ? err.message : String(err)}`} />;
	}

	return <JobsFeed jobs={jobs} />;
}
