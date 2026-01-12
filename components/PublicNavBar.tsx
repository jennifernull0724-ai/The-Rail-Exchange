import Link from 'next/link';

export function PublicNavBar() {
	return (
		<header className="border-b bg-white">
			<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
				<Link href="/" className="text-lg font-semibold text-gray-900">
					The Rail Exchange
				</Link>
				<nav className="flex items-center gap-3 text-sm">
					<Link href="/login" className="rounded-md border bg-white px-3 py-2 text-gray-900">
						Login
					</Link>
					<Link href="/pricing" className="rounded-md border bg-white px-3 py-2 text-gray-900">
						Pricing
					</Link>
				</nav>
			</div>
		</header>
	);
}
