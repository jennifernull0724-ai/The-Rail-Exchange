"use client";

import { useState } from 'react';

export function JobsToolbar() {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Open Job Requests</h1>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-3 py-2 text-sm border rounded-md bg-white"
            onClick={() => setFiltersOpen(true)}
          >
            Filters
          </button>
          <select className="px-3 py-2 text-sm border rounded-md bg-white" defaultValue="Newest">
            <option>Newest</option>
            <option>Urgent</option>
          </select>
          <div className="flex items-center overflow-hidden rounded-md border bg-white">
            <button type="button" className="px-3 py-2 text-sm">
              Grid
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <button type="button" className="px-3 py-2 text-sm">
              List
            </button>
          </div>
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-4">
              <div className="text-sm font-semibold text-gray-900">Filters</div>
              <button type="button" className="text-sm text-gray-600" onClick={() => setFiltersOpen(false)}>
                Close
              </button>
            </div>
            <div className="p-4 text-sm text-gray-700">
              BLOCKED: Filters require real facet data + URL persistence.
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
