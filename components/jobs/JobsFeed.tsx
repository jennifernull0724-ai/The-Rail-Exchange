'use client';

import { useMemo, useState } from 'react';
import type { OpenJobRequest } from '@/lib/types';

import { EmptyState } from '@/components/jobs/EmptyState';
import { JobsGrid } from '@/components/jobs/JobsGrid';
import { JobList } from '@/components/jobs/JobList';

type ViewMode = 'grid' | 'list';
type SortMode = 'newest' | 'urgent' | 'location';

export function JobsFeed({ jobs }: { jobs: OpenJobRequest[] }) {
	const [view, setView] = useState<ViewMode>('grid');
	const [sort, setSort] = useState<SortMode>('newest');

	const sortedJobs = useMemo(() => {
		const copy = [...jobs];

		const postedAtMs = (j: OpenJobRequest) => {
			const ms = new Date(j.postedAt).getTime();
			return Number.isFinite(ms) ? ms : 0;
		};

		if (sort === 'newest') {
			copy.sort((a, b) => postedAtMs(b) - postedAtMs(a));
			return copy;
		}

		if (sort === 'urgent') {
			copy.sort((a, b) => {
				const au = a.urgency === 'urgent' ? 1 : 0;
				const bu = b.urgency === 'urgent' ? 1 : 0;
				if (bu !== au) return bu - au;
				return postedAtMs(b) - postedAtMs(a);
			});
			return copy;
		}

		// location
		copy.sort((a, b) => {
			const aKey = `${a.location.state}|${a.location.city}`.toLowerCase();
			const bKey = `${b.location.state}|${b.location.city}`.toLowerCase();
			if (aKey < bKey) return -1;
			if (aKey > bKey) return 1;
			return postedAtMs(b) - postedAtMs(a);
		});
		return copy;
	}, [jobs, sort]);

	return (
		<div className="min-h-screen bg-[#0B1220]">
			<div className="sticky top-12 z-30 h-14 border-b border-[#1F2A44] bg-[#0B1220]">
				<div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
					<div className="min-w-0">
						<h1 className="text-[16px] font-semibold text-[#E5E7EB]">Open Job Requests</h1>
						<div className="text-[12px] text-[#9CA3AF]">Browse active logistics requests</div>
					</div>

					<div className="flex items-center gap-3">
						<button
							type="button"
							aria-disabled="true"
							title="Disabled: filters are not implemented yet."
							className="h-9 px-3 text-[12px] border border-[#1F2A44] text-[#6B7280] cursor-not-allowed"
							onClick={(e) => {
								e.preventDefault();
							}}
						>
							Filter
						</button>

						<select
							className="h-9 px-3 text-[12px] border border-[#1F2A44] bg-[#0B1220] text-[#E5E7EB]"
							value={sort}
							onChange={(e) => setSort(e.target.value as SortMode)}
							aria-label="Sort"
						>
							<option value="newest">Newest</option>
							<option value="urgent">Urgent</option>
							<option value="location">Location</option>
						</select>

						<div className="flex items-center overflow-hidden border border-[#1F2A44]">
							<button
								type="button"
								className={`h-9 px-3 text-[12px] ${view === 'grid' ? 'text-[#E5E7EB]' : 'text-[#9CA3AF]'}`}
								onClick={() => setView('grid')}
							>
								Grid
							</button>
							<div className="h-5 w-px bg-[#1F2A44]" />
							<button
								type="button"
								className={`h-9 px-3 text-[12px] ${view === 'list' ? 'text-[#E5E7EB]' : 'text-[#9CA3AF]'}`}
								onClick={() => setView('list')}
							>
								List
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-7xl px-4 py-4">
				{sortedJobs.length === 0 ? (
					<EmptyState />
				) : view === 'grid' ? (
					<JobsGrid jobs={sortedJobs} />
				) : (
					<JobList jobs={sortedJobs} />
				)}
			</div>
		</div>
	);
}
