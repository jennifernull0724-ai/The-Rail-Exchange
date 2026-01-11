import 'server-only';

import { notFound } from 'next/navigation';
import { headers as nextHeaders } from 'next/headers';

type PageProps = {
  params: { id: string };
};

type JobPhoto = {
  id: string;
  label: string;
  signedUrl: string;
  createdAt: string;
};

type JobDocument = {
  id: string;
  name: string;
  kind: string;
  signedUrl: string;
  createdAt: string;
};

type JobRequestDetail = {
  id: string;
  ownerCompanyId: string;
  title: string;
  jobType: string;
  commodity: string;
  urgency: string;
  scopeDescription: string;
  descriptionFull: string;
  status: string;

  startDate: string | null;
  expectedDuration: string | null;

  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;

  complianceRequirements: string[];

  equipmentNotes: string | null;
  laborNotes: string | null;

  pricingExpectation: string | null;

  photos: JobPhoto[];
  documents: JobDocument[];

  createdAt: string;
  updatedAt: string;
};

function getForwardedAuthHeaders(): HeadersInit {
  const h = nextHeaders();
  const required = ['x-user-id', 'x-user-role', 'x-company-id', 'x-subscription-active'] as const;
  const out = new Headers();
  for (const key of required) {
    const value = h.get(key);
    if (value === null || value.trim() === '') {
      throw new Error(`Missing required auth header: ${key}`);
    }
    out.set(key, value);
  }
  return out;
}

function StatusBadge({ status }: { status: string }) {
  const isOpen = status === 'open';
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase ${
        isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}
    >
      {isOpen ? 'Open' : 'Closed'}
    </span>
  );
}

export default async function Page({ params }: PageProps) {
  const id = params.id;
  const baseUrl = process.env.APP_BASE_URL;

  if (!baseUrl) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          ERROR: APP_BASE_URL is missing.
        </div>
      </main>
    );
  }

  let authHeaders: HeadersInit;
  try {
    authHeaders = getForwardedAuthHeaders();
  } catch (err) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          BLOCKED: {err instanceof Error ? err.message : String(err)}
        </div>
      </main>
    );
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/jobs/${encodeURIComponent(id)}`, {
      cache: 'no-store',
      headers: authHeaders,
    });
  } catch (err) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          ERROR: Backend unreachable. {err instanceof Error ? err.message : String(err)}
        </div>
      </main>
    );
  }

  if (res.status === 404) {
    notFound();
  }

  if (res.status === 403) {
    const text = await res.text();
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          BLOCKED: {text || 'Access denied.'}
        </div>
      </main>
    );
  }

  if (res.status >= 500) {
    const text = await res.text();
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          ERROR: {text || `Server error (status ${res.status}).`}
        </div>
      </main>
    );
  }

  if (!res.ok) {
    const text = await res.text();
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          ERROR: {text || `Request failed (status ${res.status}).`}
        </div>
      </main>
    );
  }

  const job = (await res.json()) as JobRequestDetail;
  const startDate = job.startDate ? new Date(job.startDate) : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">{job.title}</h1>
          <StatusBadge status={job.status} />
        </div>
        <div className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">Company:</span> {job.ownerCompanyId}
        </div>
      </header>

      <section className="mt-6 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Location &amp; Timing</h2>
        <div className="mt-2 space-y-1 text-sm text-gray-800">
          <div>
            <span className="font-medium text-gray-700">Address:</span> {job.address}, {job.city}, {job.state}
          </div>
          {startDate ? (
            <div>
              <span className="font-medium text-gray-700">Start date:</span> {startDate.toLocaleString()}
            </div>
          ) : null}
          {job.expectedDuration ? (
            <div>
              <span className="font-medium text-gray-700">Expected duration:</span> {job.expectedDuration}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-6 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Scope &amp; Description</h2>
        <div className="mt-3 space-y-4 text-sm text-gray-800">
          <div>
            <div className="font-medium text-gray-700">Scope</div>
            <div className="whitespace-pre-wrap">{job.scopeDescription}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Description</div>
            <div className="whitespace-pre-wrap">{job.descriptionFull}</div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Compliance</h2>
        {job.complianceRequirements.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
            {job.complianceRequirements.map((req) => (
              <li key={req}>{req}</li>
            ))}
          </ul>
        ) : (
          <div className="mt-2 text-sm text-gray-700">No compliance requirements listed.</div>
        )}
      </section>

      {job.equipmentNotes || job.laborNotes ? (
        <section className="mt-6 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Operational Notes</h2>
          <div className="mt-2 space-y-3 text-sm text-gray-800">
            {job.equipmentNotes ? (
              <div>
                <div className="font-medium text-gray-700">Equipment notes</div>
                <div className="whitespace-pre-wrap">{job.equipmentNotes}</div>
              </div>
            ) : null}
            {job.laborNotes ? (
              <div>
                <div className="font-medium text-gray-700">Labor notes</div>
                <div className="whitespace-pre-wrap">{job.laborNotes}</div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Media</h2>

        <div className="mt-3">
          <div className="text-sm font-semibold text-gray-900">Photos</div>
          {job.photos.length > 0 ? (
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {job.photos.map((p) => (
                <a key={p.id} href={p.signedUrl} target="_blank" rel="noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.signedUrl}
                    alt={p.label || 'Job photo'}
                    className="aspect-square w-full rounded-md border border-gray-200 object-cover"
                  />
                </a>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-700">No photos uploaded.</div>
          )}
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-gray-900">Documents</div>
          {job.documents.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {job.documents.map((d) => (
                <li key={d.id}>
                  <a className="text-blue-700 underline" href={d.signedUrl} target="_blank" rel="noreferrer">
                    {d.name}
                  </a>
                  <span className="text-gray-500"> ({d.kind})</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 text-sm text-gray-700">No documents uploaded.</div>
          )}
        </div>
      </section>
    </main>
  );
}
