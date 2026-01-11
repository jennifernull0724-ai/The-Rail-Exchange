"use client";

import { useState } from 'react';

interface JobLocationConfirmProps {
  address: string;
  facilityNotes: string;
  onAddressChange: (value: string) => void;
  onFacilityNotesChange: (value: string) => void;
}

export function JobLocationConfirm({
  address,
  facilityNotes,
  onAddressChange,
  onFacilityNotesChange,
}: JobLocationConfirmProps) {
  const [mapAvailable] = useState(Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY));

  return (
    <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Location (Confirm Only)</h2>
      <p className="mb-4 text-sm text-gray-600">
        Confirm the exact address. Map is for confirmation only; no browsing or discovery.
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-800" htmlFor="job-address">
            Address
          </label>
          <input
            id="job-address"
            name="address"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none"
            autoComplete="street-address"
          />
        </div>
        <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
          <div className="mb-2 font-medium text-gray-800">Static confirmation map</div>
          {mapAvailable ? (
            <div className="h-48 w-full rounded bg-gray-200" />
          ) : (
            <div className="text-red-700">Map unavailable. Provide NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable address confirmation.</div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800" htmlFor="facility-notes">
            Facility notes (gate access, rail access, clearance)
          </label>
          <textarea
            id="facility-notes"
            name="facilityNotes"
            value={facilityNotes}
            onChange={(e) => onFacilityNotesChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none"
            rows={3}
          />
        </div>
      </div>
    </section>
  );
}
