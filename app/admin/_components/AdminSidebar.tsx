'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV: Array<{ label: string; href: string }> = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Companies', href: '/admin/companies' },
  { label: 'Jobs', href: '/admin/jobs' },
  { label: 'Messaging', href: '/admin/messages' },
  { label: 'Payments', href: '/admin/payments' },
  { label: 'Subscriptions', href: '/admin/subscriptions' },
  { label: 'Documents', href: '/admin/documents' },
  { label: 'Audit Log', href: '/admin/audit-log' },
  { label: 'Settings', href: '/admin/settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] shrink-0 bg-[#0B1220] border-r border-[#1F2A44]">
      <nav className="p-3 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                'relative block rounded-md px-3 py-2 text-sm ' +
                (active
                  ? 'bg-[#111A2E] text-[#E5E7EB]'
                  : 'text-[#9CA3AF] hover:bg-[#111A2E] hover:text-[#E5E7EB]')
              }
            >
              {active ? (
                <span className="absolute left-0 top-0 h-full w-[3px] rounded-l-md bg-[#2563EB]" />
              ) : null}
              <span className={active ? 'pl-2' : ''}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
