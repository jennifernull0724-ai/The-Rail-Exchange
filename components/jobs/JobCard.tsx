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
    if (!Number.isFinite(posted)) return 'Posted —';
    const diffMs = Math.max(0, Date.now() - posted);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 1) return 'Posted just now';
    if (hours === 1) return 'Posted 1h ago';
    if (hours < 48) return `Posted ${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `Posted ${days}d ago`;
  })();

  const saveDisabledReason = 'Disabled: saving jobs is not implemented yet.';
  const messageDisabledReason = 'Disabled: messaging is not implemented yet.';

  return (
    <article
      className="rounded-[6px] border border-[#1F2A44] bg-[#111A2E] hover:bg-[#162040] transition-colors cursor-pointer"
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
      <div className="relative h-[120px] bg-[#0F172A]">
        <div className="absolute right-2 top-2 rounded-[6px] border border-[#1F2A44] bg-[#0B1220] px-2 py-1 text-[12px] text-[#9CA3AF]">
          {job.photoCount} Photos
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-[16px] font-semibold leading-tight text-[#E5E7EB]">{job.title}</h2>
          {job.urgency === 'urgent' ? (
            <span className="rounded-[6px] border border-[#DC2626] px-2 py-1 text-[12px] font-semibold text-[#DC2626]">
              Urgent
            </span>
          ) : null}
        </div>

        <div className="mt-1 text-[14px] text-[#E5E7EB]">{job.companyName}</div>
        <div className="mt-1 text-[12px] text-[#9CA3AF]">
          {job.location.city}, {job.location.state}
        </div>

        <div className="mt-2 text-[12px] text-[#9CA3AF]">
          {job.jobType} • {job.commodity} • {postedLabel}
        </div>

        <p className="mt-2 line-clamp-2 text-[12px] text-[#6B7280]">{job.scopeSummary}</p>

        <div className="mt-2 flex flex-wrap gap-1">
          {job.complianceRequirements.slice(0, 3).map((req) => (
            <span key={req} className="rounded-[6px] bg-[#1F2A44] px-2 py-1 text-[12px] text-[#E5E7EB]">
              {req}
            </span>
          ))}
          {job.complianceRequirements.length > 3 ? (
            <span className="px-1 py-1 text-[12px] text-[#9CA3AF]">+{job.complianceRequirements.length - 3}</span>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#1F2A44] pt-3">
          <button
            type="button"
            className="text-[12px] font-medium text-[#2563EB] hover:text-[#1D4ED8]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openJob();
            }}
          >
            View Job
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-disabled="true"
              title={saveDisabledReason}
              className="h-9 w-9 grid place-items-center text-[#6B7280] cursor-not-allowed"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <span className="sr-only">Save Job</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path
                  d="M6 4.8C6 3.80589 6.80589 3 7.8 3H16.2C17.1941 3 18 3.80589 18 4.8V21L12 17.6L6 21V4.8Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              type="button"
              aria-disabled="true"
              title={messageDisabledReason}
              className="h-9 w-9 grid place-items-center text-[#6B7280] cursor-not-allowed"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <span className="sr-only">Message</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path
                  d="M4 5.5C4 4.11929 5.11929 3 6.5 3H17.5C18.8807 3 20 4.11929 20 5.5V14.5C20 15.8807 18.8807 17 17.5 17H9L5.2 20.2C4.87333 20.48 4.4 20.2473 4.4 19.82V17H6.5C5.11929 17 4 15.8807 4 14.5V5.5Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M7 7.8H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M7 11.2H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
