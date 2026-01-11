import type { OpenJobRequest } from '@/lib/types';
import { JobCard } from '@/components/jobs/JobCard';

export function JobsGrid({ jobs }: { jobs: OpenJobRequest[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
