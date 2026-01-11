import { LoginForm } from './LoginForm';

export const runtime = 'nodejs';

export default async function LoginPage() {
	return (
		<main className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-md px-4 py-10 space-y-6">
				<h1 className="text-2xl font-semibold text-gray-900">Login</h1>
				<div className="rounded-lg border bg-white p-5">
					<LoginForm />
				</div>
			</div>
		</main>
	);
}
