"use client";

import { useState } from 'react';
import { JobCard } from './JobCard';
import { OpenJobRequest } from '@/lib/types';
import { JobPreviewPanel } from './JobPreviewPanel';

interface JobListProps {
  jobs: OpenJobRequest[];
}

export function JobList({ jobs }: JobListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedJob = jobs.find((job) => job.id === selectedId) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[65%_35%]">
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            selected={job.id === selectedId}
            onSelect={(j) => setSelectedId(j.id)}
          />
        ))}
      </div>
      <JobPreviewPanel selectedJob={selectedJob} />
    </div>
  );
}
