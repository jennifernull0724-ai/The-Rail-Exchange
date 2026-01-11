export function SortDropdown() {
  return (
    <select className="px-3 py-2 text-sm border rounded-md bg-white" defaultValue="Newest">
      <option>Newest</option>
      <option>Urgent</option>
      <option>Distance</option>
    </select>
  );
}
