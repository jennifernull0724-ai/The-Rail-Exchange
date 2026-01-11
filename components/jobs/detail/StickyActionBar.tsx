"use client";

import { useState } from 'react';

export function StickyActionBar({ jobId, role, isOwner }: { jobId: string; role: 'admin' | 'contractor' | 'logistics'; isOwner: boolean }) {
  const [pricingOpen, setPricingOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-600">Ready to respond?</span>

          {role === 'contractor' ? (
            <div className="flex gap-3">
              <a href={`/messages?jobId=${encodeURIComponent(jobId)}`} className="px-4 py-2 border rounded-md">
                Message Logistics
              </a>
              <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded-md" onClick={() => setPricingOpen(true)}>
                Submit Pricing
              </button>
            </div>
          ) : isOwner ? (
            <div className="flex gap-3">
              <a href={`/jobs/${encodeURIComponent(jobId)}/edit`} className="px-4 py-2 border rounded-md">
                Edit Job
              </a>
              <button type="button" className="px-4 py-2 bg-gray-900 text-white rounded-md" onClick={() => setCloseOpen(true)}>
                Close Job
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-600">You do not own this job.</div>
          )}
        </div>
      </div>

      {pricingOpen ? (
        <div className="fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setPricingOpen(false)} aria-label="Close" />
          <div className="absolute left-1/2 top-1/2 w-[min(640px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl">
            <div className="text-sm font-semibold text-gray-900">Submit Pricing</div>
            <div className="mt-2 text-sm text-gray-700">
              BLOCKED: Pricing submission persistence is not implemented.
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => setPricingOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {closeOpen ? (
        <div className="fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setCloseOpen(false)} aria-label="Close" />
          <div className="absolute left-1/2 top-1/2 w-[min(640px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl">
            <div className="text-sm font-semibold text-gray-900">Close Job</div>
            <div className="mt-2 text-sm text-gray-700">
              BLOCKED: Closing jobs requires a backend mutation endpoint.
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => setCloseOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
