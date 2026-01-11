import Link from 'next/link';

export function TopNavBar() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/jobs" className="text-lg font-semibold text-gray-900">
          The Rail Exchange
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link href="/profile" className="rounded-md border bg-white px-3 py-2 text-gray-900">
            My Profile
          </Link>
          <Link href="/company" className="rounded-md border bg-white px-3 py-2 text-gray-900">
            Company
          </Link>
          <Link href="/messages" className="rounded-md border bg-white px-3 py-2 text-gray-900">
            Messages
          </Link>
          <Link href="/settings" className="rounded-md border bg-white px-3 py-2 text-gray-900">
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}
