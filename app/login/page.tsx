import { PublicNavBar } from '@/components/PublicNavBar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function LoginPage({
	searchParams,
}: {
	searchParams?: Record<string, string | string[] | undefined>;
}) {
	const errorParam = typeof searchParams?.error === 'string' ? searchParams.error : null;

	return (
		<div className="min-h-screen bg-gray-50">
			<PublicNavBar />
			<div className="flex items-center justify-center px-6 py-12">
				<div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
					<h1 className="text-2xl font-semibold text-white mb-1">Sign in to The Rail Exchange</h1>

					<p className="text-sm text-slate-400 mb-6">Use your email and password to continue.</p>

					<form method="post" action="/api/auth/login" className="space-y-4">
						<div>
							<label className="block text-sm text-slate-300 mb-1">Email</label>
							<input
								type="email"
								name="email"
								required
								className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm text-slate-300 mb-1">Password</label>
							<input
								type="password"
								name="password"
								required
								className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						{errorParam ? (
							<div className="text-sm text-red-400 bg-red-950 border border-red-900 rounded-md px-3 py-2">
								{errorParam}
							</div>
						) : null}

						<button
							type="submit"
							className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-medium py-2 rounded-md"
						>
							Sign In
						</button>
					</form>

					<div className="mt-6 text-sm text-slate-400 text-center">
						<a href="/pricing" className="text-blue-400 underline">
							View Pricing
						</a>
						<span className="mx-2 text-slate-600">•</span>
						<a href="/create-account" className="text-blue-400 underline">
							Create Account
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
