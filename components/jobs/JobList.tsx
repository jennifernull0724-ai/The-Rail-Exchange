"use client";

import { JobCard } from './JobCard';
import { OpenJobRequest } from '@/lib/types';

interface JobListProps {
  jobs: OpenJobRequest[];
}

export function JobList({ jobs }: JobListProps) {
  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
