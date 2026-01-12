import Link from 'next/link';

import { PublicNavBar } from '@/components/PublicNavBar';

export default function HomePage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PublicNavBar />
			<main className="mx-auto max-w-5xl px-4 py-12 space-y-10">
				<section className="space-y-4">
					<div className="space-y-2">
						<h1 className="text-3xl font-semibold text-gray-900">The Rail Exchange</h1>
						<p className="text-gray-700 max-w-3xl">
							Where logistics companies post real work and contractors respond fast.
						</p>
					</div>

					<div className="flex flex-wrap gap-3">
						<Link href="/pricing" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
							View Pricing
						</Link>
						<Link href="/login" className="rounded-md border bg-white px-4 py-2 text-sm font-semibold text-gray-900">
							Login
						</Link>
					</div>
				</section>

				<section className="grid gap-4 md:grid-cols-2">
					<div className="bg-white border rounded-lg p-6 space-y-2">
						<div className="text-sm font-semibold text-gray-900">Logistics Companies</div>
						<p className="text-sm text-gray-700">
							Post job requests with clear scope and requirements. Track responses and close work when complete.
						</p>
					</div>
					<div className="bg-white border rounded-lg p-6 space-y-2">
						<div className="text-sm font-semibold text-gray-900">Contractors</div>
						<p className="text-sm text-gray-700">
							Browse open listings and respond quickly. Keep communications and expectations operational.
						</p>
					</div>
				</section>

				<section className="bg-white border rounded-lg p-6">
					<div className="text-sm font-semibold text-gray-900">How it works</div>
					<div className="mt-4 grid gap-3 md:grid-cols-3">
						<div className="rounded-md border bg-gray-50 p-4">
							<div className="text-xs font-semibold text-gray-900">1) Post</div>
							<div className="mt-1 text-sm text-gray-700">Logistics posts a job request with scope.</div>
						</div>
						<div className="rounded-md border bg-gray-50 p-4">
							<div className="text-xs font-semibold text-gray-900">2) Respond</div>
							<div className="mt-1 text-sm text-gray-700">Contractors review and respond quickly.</div>
						</div>
						<div className="rounded-md border bg-gray-50 p-4">
							<div className="text-xs font-semibold text-gray-900">3) Close</div>
							<div className="mt-1 text-sm text-gray-700">Work is closed out when completed.</div>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}
