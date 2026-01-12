import type { ReactNode } from 'react';

export function AdminTable({
  columns,
  rows,
  empty,
}: {
  columns: Array<{ key: string; label: string; align?: 'left' | 'right' }>;
  rows: Array<Record<string, ReactNode>>;
  empty?: ReactNode;
}) {
  return (
    <div className="border border-[#1F2A44] bg-[#111A2E]">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-[#0F172A]">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={
                    'border-b border-[#1F2A44] px-3 py-2 text-xs uppercase tracking-wide text-[#9CA3AF] ' +
                    (c.align === 'right' ? 'text-right' : 'text-left')
                  }
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-sm text-[#9CA3AF]" colSpan={columns.length}>
                  {empty ?? 'No rows.'}
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={idx} className="border-b border-[#1F2A44] hover:bg-[#162040]">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={
                        'px-3 py-2 align-top ' + (c.align === 'right' ? 'text-right' : 'text-left')
                      }
                    >
                      {r[c.key] ?? ''}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
