import Link from 'next/link';

import { PublicNavBar } from '@/components/PublicNavBar';

export const dynamic = 'force-static';

export default function PricingPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<PublicNavBar />
			<main className="mx-auto max-w-5xl px-4 py-12 space-y-10">
				<header className="space-y-2">
					<h1 className="text-3xl font-semibold text-gray-900">Pricing</h1>
					<p className="text-gray-700 max-w-3xl">Operational pricing for logistics companies and contractors.</p>
				</header>

				<section className="grid gap-6 md:grid-cols-2">
					<div className="bg-white border rounded-lg p-6 space-y-4">
						<div className="text-lg font-semibold text-gray-900">Logistics</div>
						<div className="space-y-1 text-sm text-gray-800">
							<div className="flex items-baseline justify-between gap-4">
								<span>$499 / month</span>
								<span className="text-xs text-gray-600">Subscription</span>
							</div>
							<div className="flex items-baseline justify-between gap-4">
								<span>$4,800 / year</span>
								<span className="text-xs text-gray-600">Subscription</span>
							</div>
							<div className="flex items-baseline justify-between gap-4">
								<span>2% per job</span>
								<span className="text-xs text-gray-600">Cap $10,000</span>
							</div>
						</div>
						<div className="pt-2">
							<Link
								href="/create-account?role=logistics"
								className="inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
							>
								Create Logistics Account
							</Link>
						</div>
					</div>

					<div className="bg-white border rounded-lg p-6 space-y-4">
						<div className="text-lg font-semibold text-gray-900">Contractor</div>
						<div className="space-y-1 text-sm text-gray-800">
							<div className="flex items-baseline justify-between gap-4">
								<span>$349 / year</span>
								<span className="text-xs text-gray-600">Subscription</span>
							</div>
							<div className="text-xs text-gray-600">Optional verification can be added later.</div>
						</div>
						<div className="pt-2">
							<Link
								href="/create-account?role=contractor"
								className="inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
							>
								Create Contractor Account
							</Link>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}
