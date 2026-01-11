import type { JobDetailViewModel } from '@/components/jobs/detail/types';

export function JobTiming({ job }: { job: JobDetailViewModel }) {
  return (
    <section className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Timing</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase">Start Date</div>
          <div className="mt-1 text-sm text-gray-900">{job.startDateLabel}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase">Duration</div>
          <div className="mt-1 text-sm text-gray-900">{job.durationLabel}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase">Work Hours</div>
          <div className="mt-1 text-sm text-gray-900">{job.workHoursLabel}</div>
        </div>
      </div>
    </section>
  );
}
