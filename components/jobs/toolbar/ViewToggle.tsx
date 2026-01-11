export function ViewToggle() {
  return (
    <div className="flex items-center overflow-hidden rounded-md border bg-white">
      <button type="button" className="px-3 py-2 text-sm">
        Grid
      </button>
      <div className="h-6 w-px bg-gray-200" />
      <button type="button" className="px-3 py-2 text-sm">
        List
      </button>
    </div>
  );
}
