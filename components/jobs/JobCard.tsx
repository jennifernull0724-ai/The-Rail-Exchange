"use client";

import { OpenJobRequest } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface JobCardProps {
  job: OpenJobRequest;
}

export function JobCard({ job }: JobCardProps) {
  const router = useRouter();

  const openJob = useCallback(() => {
    router.push(`/jobs/${job.id}`);
  }, [job.id, router]);

  const postedLabel = (() => {
    const posted = new Date(job.postedAt).getTime();
    if (!Number.isFinite(posted)) return '—';
    const diffMs = Date.now() - posted;
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  })();

  return (
    <article
      className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
      role="link"
      tabIndex={0}
      onClick={openJob}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openJob();
        }
      }}
    >
      <div className="relative h-48 bg-gray-200">
        <div className="h-full w-full bg-gray-200" aria-label="Job cover" />
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {job.photoCount} Photos
        </div>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold text-gray-900 leading-tight">{job.title}</h2>

          {job.urgency === 'urgent' && (
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">Urgent</span>
          )}
        </div>

        <div className="text-sm text-gray-600">{job.companyName}</div>

        <div className="text-sm text-gray-500">
          📍 {job.location.city}, {job.location.state}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span>🚆 {job.jobType}</span>
          <span>📦 {job.commodity}</span>
          <span>🕒 {postedLabel}</span>
        </div>

        <p className="text-sm text-gray-700 line-clamp-2">{job.scopeSummary}</p>

        <div className="flex flex-wrap gap-1">
          {job.complianceRequirements.slice(0, 3).map((req) => (
            <span key={req} className="text-xs bg-gray-100 px-2 py-1 rounded">
              {req}
            </span>
          ))}
          {job.complianceRequirements.length > 3 ? (
            <span className="text-xs text-gray-500">+{job.complianceRequirements.length - 3} more</span>
          ) : null}
        </div>

        <div className="pt-3 flex items-center justify-between">
          <a
            href={`/jobs/${job.id}`}
            className="text-sm font-medium text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View Job
          </a>

          <div className="flex gap-3 text-gray-400">
            <a href={`/profile?saveJobId=${encodeURIComponent(job.id)}`} title="Save Job" onClick={(e) => e.stopPropagation()}>
              ☆
            </a>
            <a
              href={`/messages?jobId=${encodeURIComponent(job.id)}`}
              title="Message"
              onClick={(e) => e.stopPropagation()}
            >
              💬
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
