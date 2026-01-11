"use client";

import { OpenJobRequest } from '@/lib/types';
import Link from 'next/link';

interface JobPreviewPanelProps {
  selectedJob: OpenJobRequest | null;
}

export function JobPreviewPanel({ selectedJob }: JobPreviewPanelProps) {
  if (!selectedJob) {
    return (
      <aside className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-gray-900">Select a job to view details</div>
        <p className="mt-2 text-sm text-gray-700">Select a request from the list.</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <header className="space-y-1">
        <div className="text-sm font-semibold text-gray-900">{selectedJob.title}</div>
        <div className="text-xs text-gray-700">{selectedJob.companyName}</div>
        <div className="text-xs text-gray-700">
          {selectedJob.location.city}, {selectedJob.location.state}
        </div>
        <span
          className={`inline-flex w-fit rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${selectedJob.urgency === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}
        >
          {selectedJob.urgency === 'urgent' ? 'Urgent' : 'Scheduled'}
        </span>
      </header>
      <div className="mt-3 space-y-2 text-sm text-gray-800">
        <div>
          <span className="font-medium text-gray-700">Job type:</span> {selectedJob.jobType}
        </div>
        <div>
          <span className="font-medium text-gray-700">Commodity:</span> {selectedJob.commodity}
        </div>
        <div>
          <span className="font-medium text-gray-700">Scope:</span> {selectedJob.scopeSummary}
        </div>
        <div>
          <span className="font-medium text-gray-700">Photos:</span> {selectedJob.photoCount}
        </div>
        <div>
          <span className="font-medium text-gray-700">Compliance requirements:</span>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {selectedJob.complianceRequirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 text-xs">
        <Link
          href={`/jobs/${encodeURIComponent(selectedJob.id)}`}
          className="rounded-md bg-gray-900 px-3 py-2 text-center font-semibold text-white shadow-sm hover:bg-gray-800"
        >
          View Request
        </Link>
        <button className="rounded-md border border-gray-300 px-3 py-2 font-semibold text-gray-800 shadow-sm">
          Message Company
        </button>
        <button className="rounded-md border border-gray-300 px-3 py-2 font-semibold text-gray-800 shadow-sm">
          Save Job
        </button>
      </div>
    </aside>
  );
}
