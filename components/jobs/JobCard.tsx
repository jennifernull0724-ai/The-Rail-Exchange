"use client";

import { OpenJobRequest } from '@/lib/types';

interface JobCardProps {
  job: OpenJobRequest;
  selected?: boolean;
  onSelect?: (job: OpenJobRequest) => void;
}

export function JobCard({ job, selected, onSelect }: JobCardProps) {
  const daysSincePosted = () => {
    const posted = new Date(job.postedAt).getTime();
    const now = Date.now();
    const diff = now - posted;
    const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    return days === 0 ? 'Today' : `${days}d ago`;
  };

  return (
    <article
      className={`cursor-pointer rounded-md border ${selected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'} p-4 shadow-sm transition hover:border-blue-500`}
      onClick={() => (onSelect ? onSelect(job) : undefined)}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{job.title}</h3>
          <div className="mt-1 text-sm text-gray-700">{job.companyName}</div>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold uppercase ${job.urgency === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}
        >
          {job.urgency === 'urgent' ? 'Urgent' : 'Scheduled'}
        </span>
      </header>
      <div className="mt-3 grid gap-2 text-sm text-gray-800 md:grid-cols-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Type:</span>
          <span>{job.jobType}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Commodity:</span>
          <span>{job.commodity}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Location:</span>
          <span>
            {job.location.city}, {job.location.state}
          </span>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-gray-700">{job.scopeSummary}</p>
      <footer className="mt-3 flex items-center justify-between text-sm text-gray-700">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1" aria-label="Photo count">
            📷 <span>{job.photoCount}</span>
          </span>
          <span className="flex items-center gap-1" aria-label="Compliance requirements">
            🛡 <span>{job.complianceRequirements.length}</span>
          </span>
          <span className="flex items-center gap-1" aria-label="Posted date">
            🕒 <span>{daysSincePosted()}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md bg-gray-900 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              if (onSelect) onSelect(job);
            }}
          >
            View Details
          </button>
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm"
          >
            Save Job
          </button>
        </div>
      </footer>
    </article>
  );
}
