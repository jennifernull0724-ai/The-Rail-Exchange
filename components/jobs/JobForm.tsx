"use client";

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobLocationConfirm } from './JobLocationConfirm';
import { JobUploads } from './JobUploads';
import { JobUrgency } from '@/lib/types';

interface JobFormState {
  title: string;
  description: string;
  jobType: string;
  commodity: string;
  scope: string;
  urgency: JobUrgency;
  startDate: string;
  duration: string;
  address: string;
  facilityNotes: string;
  complianceRequirements: string;
  equipmentNotes: string;
  laborNotes: string;
  pricingExpectation: string;
}

export function JobForm() {
  const router = useRouter();
  const [state, setState] = useState<JobFormState>({
    title: '',
    description: '',
    jobType: '',
    commodity: '',
    scope: '',
    urgency: 'urgent',
    startDate: '',
    duration: '',
    address: '',
    facilityNotes: '',
    complianceRequirements: '',
    equipmentNotes: '',
    laborNotes: '',
    pricingExpectation: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const complianceList = useMemo(
    () =>
      state.complianceRequirements
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    [state.complianceRequirements],
  );

  const handleChange = (key: keyof JobFormState) => (value: string) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const title = state.title.trim();
    const description = state.description.trim();
    const address = state.address.trim();
    const jobType = state.jobType.trim();
    const commodity = state.commodity.trim();
    const scope = state.scope.trim();

    if (!title || !description || !address || !jobType || !commodity || !scope) {
      setFormError('Missing required fields. Title, description, address, job type, commodity, and scope are required.');
      return;
    }

    if (state.urgency === 'scheduled' && !state.startDate) {
      setFormError('Missing required field. Start date is required for scheduled jobs.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          jobType,
          commodity,
          scope,
          urgency: state.urgency,
          startDate: state.urgency === 'scheduled' ? state.startDate : undefined,
          address,
          complianceRequirements: complianceList,
          equipmentNotes: state.equipmentNotes.trim() || undefined,
          laborNotes: state.laborNotes.trim() || undefined,
          pricingExpectation: state.pricingExpectation.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const parsed = JSON.parse(text) as { error?: unknown };
          if (parsed && typeof parsed === 'object' && typeof parsed.error === 'string' && parsed.error.trim()) {
            setFormError(parsed.error);
            return;
          }
        } catch {
          // ignore JSON parse errors
        }
        setFormError(text || `Create failed (status ${res.status}).`);
        return;
      }

      const json = (await res.json()) as { jobRequestId?: unknown };
      const jobRequestId = typeof json.jobRequestId === 'string' ? json.jobRequestId.trim() : '';
      if (!jobRequestId) {
        setFormError('Create failed: server response missing jobRequestId.');
        return;
      }

      router.push(`/jobs/${encodeURIComponent(jobRequestId)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    setFormError('BLOCKED: Draft saving requires a real persistence endpoint.');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">Post a Job Request</h1>
        <p className="text-sm text-gray-700">Describe the operational issue and what support you need.</p>
      </header>

      {formError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{formError}</div>
      ) : null}

      <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Job Basics</h2>
        <p className="mb-4 text-sm text-gray-600">Explain what is wrong and what needs to be done.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-800" htmlFor="job-title">
              Job title (required)
            </label>
            <input
              id="job-title"
              name="title"
              value={state.title}
              onChange={(e) => handleChange('title')(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800" htmlFor="job-description">
              Job description (required)
            </label>
            <textarea
              id="job-description"
              name="description"
              value={state.description}
              onChange={(e) => handleChange('description')(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none"
              rows={4}
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-800" htmlFor="job-type">
                Job type
              </label>
              <input
                id="job-type"
                name="jobType"
                value={state.jobType}
                onChange={(e) => handleChange('jobType')(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800" htmlFor="commodity">
                Commodity
              </label>
              <input
                id="commodity"
                name="commodity"
                value={state.commodity}
                onChange={(e) => handleChange('commodity')(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800" htmlFor="scope">
                Estimated scope / volume
              </label>
              <input
                id="scope"
                name="scope"
                value={state.scope}
                onChange={(e) => handleChange('scope')(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Timing & Priority</h2>
        <p className="mb-4 text-sm text-gray-600">Set urgency for mobilization feasibility.</p>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-800">Urgency</label>
              <div className="mt-2 flex gap-3 text-sm text-gray-800">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="urgency"
                    value="urgent"
                    checked={state.urgency === 'urgent'}
                    onChange={() => handleChange('urgency')('urgent')}
                  />
                  Urgent / Immediate
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="urgency"
                    value="scheduled"
                    checked={state.urgency === 'scheduled'}
                    onChange={() => handleChange('urgency')('scheduled')}
                  />
                  Scheduled
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800" htmlFor="start-date">
                Target start date (if scheduled)
              </label>
              <input
                id="start-date"
                name="startDate"
                type="date"
                value={state.startDate}
                onChange={(e) => handleChange('startDate')(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none"
                disabled={state.urgency !== 'scheduled'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800" htmlFor="duration">
                Expected duration (optional)
              </label>
              <input
                id="duration"
                name="duration"
                value={state.duration}
                onChange={(e) => handleChange('duration')(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      <JobLocationConfirm
        address={state.address}
        facilityNotes={state.facilityNotes}
        onAddressChange={handleChange('address')}
        onFacilityNotesChange={handleChange('facilityNotes')}
      />

      <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Requirements & Constraints</h2>
        <p className="mb-4 text-sm text-gray-600">List compliance, equipment, labor, and safety constraints.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-800" htmlFor="compliance">
              Compliance requirements (one per line)
            </label>
            <textarea
              id="compliance"
              name="compliance"
              value={state.complianceRequirements}
              onChange={(e) => handleChange('complianceRequirements')(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none"
              rows={3}
            />
            {complianceList.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                {complianceList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-800" htmlFor="equipment-notes">
                Equipment requirements
              </label>
              <textarea
                id="equipment-notes"
                name="equipmentNotes"
                value={state.equipmentNotes}
                onChange={(e) => handleChange('equipmentNotes')(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800" htmlFor="labor-notes">
                Labor requirements
              </label>
              <textarea
                id="labor-notes"
                name="laborNotes"
                value={state.laborNotes}
                onChange={(e) => handleChange('laborNotes')(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800" htmlFor="safety-notes">
                Safety notes
              </label>
              <textarea
                id="safety-notes"
                name="safetyNotes"
                value={state.scope}
                onChange={(e) => handleChange('scope')(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none"
                rows={2}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Pricing Expectation (Optional)</h2>
        <p className="mb-4 text-sm text-gray-600">Context only; no bids or calculations.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-800" htmlFor="price-range">
              Price range (optional)
            </label>
            <input
              id="price-range"
              name="priceRange"
              value={state.pricingExpectation}
              onChange={(e) => handleChange('pricingExpectation')(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800" htmlFor="pricing-notes">
              Pricing notes (optional)
            </label>
            <textarea
              id="pricing-notes"
              name="pricingNotes"
              value={state.pricingExpectation}
              onChange={(e) => handleChange('pricingExpectation')(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none"
              rows={2}
            />
          </div>
        </div>
      </section>

      <JobUploads
        jobRequestId=""
        mode="photos"
        maxFileSizeBytes={25 * 1024 * 1024}
        onUploaded={() => {
          setFormError('Uploads blocked: create the job request first to get a jobRequestId.');
        }}
        provider={process.env.NEXT_PUBLIC_FILE_STORAGE_PROVIDER}
        onBlocked={() => setFormError('Uploads blocked: create the job request first to get a jobRequestId.')}
      />

      <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Publish Controls</h2>
        <p className="mb-4 text-sm text-gray-600">Publish real jobs only. Submission is blocked until a live API is connected.</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed"
          >
            {submitting ? 'Publishing…' : 'Publish job'}
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
        <div className="mt-3 text-sm text-red-800">
          Real submission is NOT IMPLEMENTED. Connect a persisted Job Request API and remove the block to enable publishing.
        </div>
      </section>
    </form>
  );
}
