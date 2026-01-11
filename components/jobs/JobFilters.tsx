"use client";

interface JobFiltersProps {
  blockedReason?: string;
}

export function JobFilters({ blockedReason }: JobFiltersProps) {
  return (
    <aside className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-xs font-semibold text-gray-700 underline disabled:cursor-not-allowed"
            disabled
          >
            Clear filters
          </button>
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-2 text-[11px] font-semibold text-gray-900 shadow-sm disabled:cursor-not-allowed"
            disabled
          >
            Save search
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-red-700">
        {blockedReason ?? 'Filter facets require real query + facet data. Not implemented.'}
      </p>
      <div className="mt-4 space-y-3 text-sm text-gray-800">
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed" disabled>
            Radius
          </button>
          <button className="rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed" disabled>
            Job type
          </button>
          <button className="rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed" disabled>
            Urgency
          </button>
          <button className="rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed" disabled>
            Commodity
          </button>
          <button className="rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed" disabled>
            Equipment required
          </button>
          <button className="rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed" disabled>
            Compliance required
          </button>
          <button className="rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed" disabled>
            Date posted
          </button>
          <button className="rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed" disabled>
            Price context
          </button>
        </div>
        <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-700">
          Radius (25/50/100/250 mi), job type, urgency, commodity, equipment, compliance, date posted, and price context filters must be driven by real backend data with URL persistence. UI is disabled until wired.
        </div>
        <div className="text-xs text-gray-600">
          URL persistence and shareable filter state must be powered by real routing + query params. Not implemented.
        </div>
      </div>
    </aside>
  );
}
