import type { JobDetailViewModel } from '@/components/jobs/detail/types';

function UrgencyBadge({ urgency }: { urgency?: JobDetailViewModel['urgency'] }) {
  if (urgency !== 'urgent') return null;
  return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">Urgent</span>;
}

function StatusBadge({ status }: { status: JobDetailViewModel['status'] }) {
  const isOpen = status === 'open';
  return (
    <span
      className={
        'text-xs font-semibold px-2 py-1 rounded ' +
        (isOpen ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700')
      }
    >
      {isOpen ? 'Open' : 'Closed'}
    </span>
  );
}

export function JobHeader({ job }: { job: JobDetailViewModel }) {
  return (
    <header className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-2xl font-semibold text-gray-900">{job.title}</div>
          <div className="text-sm text-gray-600">{job.companyName}</div>
        </div>

        <div className="flex items-center gap-2">
          <UrgencyBadge urgency={job.urgency} />
          <StatusBadge status={job.status} />
          <div className="text-xs text-gray-500">{job.postedDateLabel}</div>
        </div>
      </div>
    </header>
  );
}
