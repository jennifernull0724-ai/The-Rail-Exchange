export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-[16px] font-semibold text-[#E5E7EB]">No open job requests yet</div>
      <div className="mt-2 text-[12px] text-[#9CA3AF]">Check back later — new listings post daily.</div>
    </div>
  );
}
