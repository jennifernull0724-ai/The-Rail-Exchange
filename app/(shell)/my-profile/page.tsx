import 'server-only';

import { redirect } from 'next/navigation';

import { getServerAuthContext } from '@/lib/auth';
import { signOut } from '@/lib/auth/actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MyProfilePage() {
	let auth;
	try {
		auth = await getServerAuthContext();
	} catch {
		redirect('/login');
	}

	if (!auth.isOwner && auth.disabled) {
		return (
			<main className="min-h-screen bg-gray-50">
				<div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
					<h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
					<div className="bg-white border rounded-lg p-6 text-sm text-gray-800">BLOCKED: User disabled.</div>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
				<h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
				<div className="bg-white border rounded-lg p-6 text-sm text-gray-800 space-y-2">
					<div>Role: {auth.isOwner ? 'admin' : auth.role}</div>
					<div>User ID: {auth.userId}</div>
				</div>

				<form action={signOut}>
					<button type="submit" className="rounded-md border bg-white px-4 py-2 text-sm text-gray-900">
						Logout
					</button>
				</form>
			</div>
		</main>
	);
}
