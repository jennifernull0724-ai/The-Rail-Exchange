import 'server-only';

import Link from 'next/link';

import { getServerAuthContext } from '@/lib/auth';
import { signOut } from '@/lib/auth/actions';

type NavItem = { label: string; href: string };

export async function TopNavBar() {
  let role: 'admin' | 'contractor' | 'logistics' | null = null;
  try {
    const auth = await getServerAuthContext();
    role = auth.isOwner ? 'admin' : auth.role;
  } catch {
    role = null;
  }

  const items: NavItem[] = (() => {
    if (!role) return [
      { label: 'Login', href: '/login' },
      { label: 'Pricing', href: '/pricing' },
    ];
    if (role === 'contractor') return [
      { label: 'Jobs', href: '/jobs' },
      { label: 'Profile', href: '/contractor/profile' },
    ];
    if (role === 'logistics') return [
      { label: 'Jobs', href: '/jobs' },
      { label: 'Company', href: '/company' },
    ];
    return [
      { label: 'Admin Dashboard', href: '/admin' },
    ];
  })();

  const brandHref = role === 'admin' ? '/admin' : '/';

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href={brandHref} className="text-lg font-semibold text-gray-900">
          The Rail Exchange
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md border bg-white px-3 py-2 text-gray-900">
              {item.label}
            </Link>
          ))}

          {role ? (
            <form action={signOut}>
              <button type="submit" className="rounded-md border bg-white px-3 py-2 text-gray-900">
                Logout
              </button>
            </form>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
