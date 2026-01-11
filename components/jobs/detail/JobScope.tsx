import type { JobDetailViewModel } from '@/components/jobs/detail/types';

function Block({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-sm font-semibold text-gray-900">{label}</div>
      <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{value ?? '—'}</div>
    </div>
  );
}

export function JobScope({ job }: { job: JobDetailViewModel }) {
  return (
    <section className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Scope</h2>
      <Block label="Full description" value={job.scopeFull} />
      <Block label="Equipment notes" value={job.equipmentNotesLabel} />
      <Block label="Labor notes" value={job.laborNotesLabel} />
    </section>
  );
}
