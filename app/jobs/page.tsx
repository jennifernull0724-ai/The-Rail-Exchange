import { JobFilters } from '@/components/jobs/JobFilters';
import { JobList } from '@/components/jobs/JobList';
import { JobMap } from '@/components/jobs/JobMap';
import { ensureContractorAccess } from '@/lib/permissions';
import { getOpenJobRequestsForContractor } from '@/lib/repositories/jobRequests.read';

export default async function Page() {
  const access = ensureContractorAccess();

  if (!access.authorized) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Access denied: {access.reason ?? 'Authorization not implemented.'} (status {access.status}).
        </div>
        {access.reason === 'Active subscription required to view open requests.' ? (
          <div className="mt-3">
            <button
              type="button"
              disabled
              className="rounded-md bg-gray-400 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed"
            >
              Manage subscription (blocked)
            </button>
          </div>
        ) : null}
      </main>
    );
  }

  let jobs;
  try {
    jobs = await getOpenJobRequestsForContractor();
  } catch (err) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          BLOCKED: {err instanceof Error ? err.message : String(err)}
        </div>
      </main>
    );
  }

  if (jobs.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-800 shadow-sm">
          No open requests yet.
        </div>
      </main>
    );
  }

  const mapFeatureEnabled = Boolean(process.env.MAPS_API_KEY);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4">
        <label className="sr-only" htmlFor="job-search">
          Search open job requests
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input
            id="job-search"
            type="search"
            placeholder="Search by job type, commodity, location, or company"
            className="w-full rounded-md border border-gray-300 pl-10 pr-10 py-3 text-gray-900 shadow-sm"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
          >
            ✕
          </button>
        </div>
        <p className="mt-2 text-xs text-red-700">
          Live search requires a real backend search index; wire before enabling results.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="lg:sticky lg:top-4 h-fit">
          <JobFilters blockedReason="Filters require real facet data and URL persistence. NOT IMPLEMENTED." />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">Results</div>
            <div className="flex gap-2 text-xs">
              <button className="rounded-md bg-gray-800 px-3 py-2 font-semibold text-white shadow-sm">
                List view
              </button>
              <button className="rounded-md border border-gray-300 px-3 py-2 font-semibold text-gray-800 shadow-sm">
                Map view
              </button>
            </div>
          </div>

          <JobList jobs={jobs} />

          <JobMap jobs={jobs} mapsApiKeyPresent={mapFeatureEnabled} />
        </div>
      </div>
    </main>
  );
}
