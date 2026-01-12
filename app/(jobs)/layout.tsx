import type { ReactNode } from 'react';

import { JobsTopNav } from '@/components/jobs/JobsTopNav';

export default function JobsLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-[#0B1220] text-[#E5E7EB]">
			<JobsTopNav />
			{children}
		</div>
	);
}
