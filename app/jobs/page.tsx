import { EmptyState } from '@/components/jobs/EmptyState';
import { JobsGrid } from '@/components/jobs/JobsGrid';
import { JobsToolbar } from '@/components/jobs/JobsToolbar';
import { ensureContractorAccess } from '@/lib/permissions';
import { getOpenJobRequestsForContractor } from '@/lib/repositories/jobRequests.read';

export default async function JobsPage() {
  const access = ensureContractorAccess();

  if (!access.authorized) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <JobsToolbar />
          <div className="bg-white border rounded-lg p-6 text-sm text-gray-800">
            BLOCKED: {access.reason ?? 'Authorization not implemented.'} (status {access.status}).
          </div>
        </div>
      </div>
    );
  }

  let jobs;
  try {
    jobs = await getOpenJobRequestsForContractor();
  } catch (err) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <JobsToolbar />
          <div className="bg-white border rounded-lg p-6 text-sm text-gray-800">
            BLOCKED: Failed to load open job requests. {err instanceof Error ? err.message : String(err)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <JobsToolbar />

        {jobs.length === 0 ? <EmptyState /> : <JobsGrid jobs={jobs} />}
      </div>
    </div>
  );
}
