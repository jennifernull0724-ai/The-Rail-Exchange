'use client';

import { useState } from 'react';
import type { JobDetailViewModel } from '@/components/jobs/detail/types';

export function JobImageGallery({ job }: { job: JobDetailViewModel }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Photos</h2>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {job.photos.slice(0, 10).map((img, idx) => (
          <button
            key={`${img.alt}-${idx}`}
            type="button"
            className="group relative aspect-[4/3] overflow-hidden rounded-md border bg-gray-100"
            onClick={() => setActiveIndex(idx)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
          </button>
        ))}
      </div>

      {job.photos.length === 0 ? (
        <div className="mt-3 text-sm text-gray-700">No photos uploaded.</div>
      ) : null}

      {activeIndex !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close"
            onClick={() => setActiveIndex(null)}
          />

          <div className="relative z-10 w-full max-w-5xl">
            <div className="absolute right-0 top-0 -translate-y-12">
              <button
                type="button"
                className="rounded-md bg-white/90 px-3 py-2 text-sm font-medium text-gray-900"
                onClick={() => setActiveIndex(null)}
              >
                Close
              </button>
            </div>

            <div className="overflow-hidden rounded-lg bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={job.photos[activeIndex]?.src ?? ''}
                alt={job.photos[activeIndex]?.alt ?? 'Image'}
                className="w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
