"use client";

import { OpenJobRequest } from '@/lib/types';

interface JobMapProps {
  jobs: OpenJobRequest[];
  mapsApiKeyPresent: boolean;
}

export function JobMap({ jobs, mapsApiKeyPresent }: JobMapProps) {
  const reason = !mapsApiKeyPresent
    ? 'Map unavailable: MAPS_API_KEY is missing.'
    : jobs.length === 0
      ? 'Map unavailable: no open requests to display.'
      : null;

  return (
    <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Map View</h2>
          <p className="text-sm text-gray-700">Contractor-only map with real open job pins.</p>
        </div>
      </header>

      {reason ? (
        <div className="mt-3 rounded-md border border-dashed border-yellow-400 bg-yellow-50 p-4 text-sm text-yellow-800">
          {reason}
        </div>
      ) : (
        <div className="mt-3 h-64 rounded-md bg-gray-100" aria-hidden="true" />
      )}
    </section>
  );
}
