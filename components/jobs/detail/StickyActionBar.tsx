"use client";

export function StickyActionBar({ jobId, role, isOwner }: { jobId: string; role: 'admin' | 'contractor' | 'logistics'; isOwner: boolean }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0B1220] border-t border-[#1F2A44]">
      <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-[12px] text-[#9CA3AF]">Job ID: {jobId}</div>

        {(role === 'logistics') ? (
          <a href={`/jobs/${encodeURIComponent(jobId)}/edit`} className="h-9 bg-[#2563EB] px-4 grid place-items-center text-[12px] font-semibold text-white hover:bg-[#1D4ED8]">
            Edit Job
          </a>
        ) : (
          <div className="text-[12px] text-[#6B7280]">Read-only</div>
        )}
      </div>
    </div>
  );
}
