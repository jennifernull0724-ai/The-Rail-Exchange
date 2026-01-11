import type { JobDetailViewModel } from '@/components/jobs/detail/types';

function Item({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-md border bg-white p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase">{label}</div>
      <div className="mt-1 text-sm text-gray-900">{value ?? '—'}</div>
    </div>
  );
}

export function JobOverview({ job }: { job: JobDetailViewModel }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Item label="Job Type" value={job.jobType} />
        <Item label="Commodity" value={job.commodity} />
        <Item label="Volume" value={job.volumeLabel} />
        {job.distanceLabel ? <Item label="Distance" value={job.distanceLabel} /> : null}
      </div>
    </section>
  );
}
